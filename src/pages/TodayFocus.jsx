import { useState, useEffect } from 'react';
import { ZONES } from '../constants/zones.js';
import TaskItem from '../components/TaskItem.jsx';
import { getTodayString, getWeekStartEnd } from '../utils/dateUtils.js';
import { useStreak } from '../hooks/useStreak.js';
import './TodayFocus.css';

/**
 * 今日聚焦页面
 * 核心是状态仪表盘，任务快捷列表是辅助
 */
function TodayFocus({ tasks, projects, onToggleTask, onDeleteTask, onUpdateTask, onUpdateTimeRecord }) {
  const today = getTodayString();
  const { weekStart, weekEnd } = getWeekStartEnd();

  // 计算工作区今日已完成任务数
  const workCompletedToday = tasks.filter(task => {
    return task.zoneId === 'work' && task.done && task.doneAt &&
           new Date(task.doneAt).toISOString().split('T')[0] === today;
  }).length;

  // 计算兴趣区本周已完成任务数
  const interestCompletedThisWeek = tasks.filter(task => {
    if (task.zoneId !== 'interest' || !task.done || !task.doneAt) return false;
    const doneDate = new Date(task.doneAt).toISOString().split('T')[0];
    return doneDate >= weekStart && doneDate <= weekEnd;
  }).length;

  // 控制「刚完成、还在等待填写实际时长」的任务 id 集合
  const [pendingActualMin, setPendingActualMin] = useState(new Set());

  // 统一管理三个区的展开状态
  const [zoneExpanded, setZoneExpanded] = useState({
    work: true,
    advance: true,
    interest: true
  });

  // 控制无截止日期任务组的展开/折叠
  const [isNoDeadlineExpanded, setIsNoDeadlineExpanded] = useState(false);

  // 筛选未完成任务：已过期 + 7天内到期
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

  const urgentTasks = tasks.filter(task => {
    // 未完成 或 刚完成正在等待填写实际时长
    if (!task.done || pendingActualMin.has(task.id)) {
      if (!task.deadline) return false;
      return task.deadline <= sevenDaysLaterStr;
    }
    return false;
  });

  // 无截止日期的任务
  const noDeadlineTasks = tasks.filter(task => {
    // 未完成且无截止日期 或 刚完成正在等待填写实际时长且无截止日期
    return (!task.done || pendingActualMin.has(task.id)) && !task.deadline;
  }).sort((a, b) => {
    // 获取任务对应的项目
    const projectA = projects.find(p => p.id === a.projectId);
    const projectB = projects.find(p => p.id === b.projectId);
    // 置顶项目优先
    if (projectA?.pinned && !projectB?.pinned) return -1;
    if (!projectA?.pinned && projectB?.pinned) return 1;
    return 0;
  });

  // 按区分组的紧急任务
  // 任务排序：置顶项目的任务 > 已过期 > 今天到期 > 未来
  const getUrgentTasksByZone = (zoneId) => {
    const zoneTasks = urgentTasks.filter(t => t.zoneId === zoneId);
    return sortTasks(zoneTasks, projects);
  };

  // 任务排序：置顶项目的任务优先，然后按截止日期排序
  const sortTasks = (taskList, projectList) => {
    return [...taskList].sort((a, b) => {
      // 获取任务对应的项目
      const projectA = projectList.find(p => p.id === a.projectId);
      const projectB = projectList.find(p => p.id === b.projectId);
      // 置顶项目优先
      if (projectA?.pinned && !projectB?.pinned) return -1;
      if (!projectA?.pinned && projectB?.pinned) return 1;
      // 然后按截止日期排序：已过期 > 今天到期 > 未来
      const getPriority = (task) => {
        if (task.deadline < today) return 0;
        if (task.deadline === today) return 1;
        return 2;
      };
      return getPriority(a) - getPriority(b);
    });
  };

  // 使用 streak 打卡逻辑
  const { workStreak, advanceStreak, workAchievedToday, advanceCheckedToday } = useStreak(tasks);

  // 处理任务完成状态切换（今日聚焦页面特有逻辑）
  const handleToggleTask = (taskId) => {
    onToggleTask(taskId);
    // 加入 pending 集合，让这条任务继续显示
    setPendingActualMin(prev => new Set([...prev, taskId]));
  };

  // 处理实际时长输入完成后的回调
  const handleActualMinDone = (taskId) => {
    // 从 pending 移除，任务才真正从列表消失
    setPendingActualMin(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  return (
    <div className="today-focus-page">
      <h1 className="page-title">今日聚焦</h1>
      <div className="today-date">
        {new Date().toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })}
      </div>

      {/* 上半部分：三个状态卡片 */}
      <div className="status-cards">
        {/* 工作区卡片 */}
        <div className={`status-card work-card ${workAchievedToday ? 'achieved' : ''}`}>
          <h3 className="card-title">工作区</h3>
          <div className="card-main">
            <span className="card-count">{workCompletedToday}</span>
            <span className="card-divider">/</span>
            <span className="card-goal">2条</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(workCompletedToday / 2 * 100, 100)}%` }}
            ></div>
          </div>
          <div className="card-status">
            {workAchievedToday ? (
              <span className="status-achieved">✅ 今日已达标</span>
            ) : (
              <span className="status-remaining">还差 {2 - workCompletedToday} 条</span>
            )}
          </div>
          <div className="card-streak">
            <span className="streak-number">{workStreak}</span>
            <span className="streak-label">连续达标天数</span>
          </div>
        </div>

        {/* 推进区卡片 */}
        <div className={`status-card advance-card ${advanceCheckedToday ? 'checked-in' : ''}`}>
          <h3 className="card-title">推进区</h3>
          <div className="card-main">
            <span className="card-status-text">
              {advanceCheckedToday ? '今日已打卡 ✅' : '今日未打卡'}
            </span>
          </div>
          <div className="card-streak">
            <span className="streak-number">{advanceStreak}</span>
            <span className="streak-label">连续打卡天数</span>
          </div>
        </div>

        {/* 兴趣区卡片 */}
        <div className={`status-card interest-card ${interestCompletedThisWeek >= 2 ? 'achieved' : ''}`}>
          <h3 className="card-title">兴趣区</h3>
          <div className="card-main">
            <span className="card-count">{interestCompletedThisWeek}</span>
            <span className="card-divider">/</span>
            <span className="card-goal">2次</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(interestCompletedThisWeek / 2 * 100, 100)}%` }}
            ></div>
          </div>
          <div className="card-subtitle">本周进度</div>
        </div>
      </div>

      {/* 下半部分：任务快捷列表 */}
      <div className="task-quick-list">
        <h2 className="section-title">待办任务</h2>

        {/* 三个区的分组任务 */}
        {ZONES.map(zone => {
          const zoneUrgentTasks = sortTasks(getUrgentTasksByZone(zone.id), projects);

          return (
            <div key={zone.id} className="zone-group">
              <div className="zone-group-header" onClick={() => setZoneExpanded(prev => ({ ...prev, [zone.id]: !prev[zone.id] }))}>
                <span className="group-toggle">{zoneExpanded[zone.id] ? '▼' : '▶'}</span>
                <span className="group-name">{zone.name}</span>
                <span className="group-count">({zoneUrgentTasks.length}项)</span>
              </div>
              {zoneExpanded[zone.id] && zoneUrgentTasks.length > 0 && (
                <div className="zone-group-tasks">
                  {zoneUrgentTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggleTask}
                        onDelete={onDeleteTask}
                        onUpdate={onUpdateTask}
                        projectName={project ? project.name : '未分类'}
                        onActualMinDone={handleActualMinDone}
                        onUpdateTimeRecord={onUpdateTimeRecord}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 无截止日期的任务折叠组 */}
        {noDeadlineTasks.length > 0 && (
          <div className="zone-group no-deadline-group">
            <div
              className="zone-group-header"
              onClick={() => setIsNoDeadlineExpanded(!isNoDeadlineExpanded)}
            >
              <span className="group-toggle">{isNoDeadlineExpanded ? '▼' : '▶'}</span>
              <span className="group-name">随时可做</span>
              <span className="group-count">({noDeadlineTasks.length}项)</span>
            </div>
            {isNoDeadlineExpanded && (
              <div className="zone-group-tasks">
                {noDeadlineTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={onDeleteTask}
                    onUpdate={onUpdateTask}
                    projectName={project ? project.name : '未分类'}
                    onActualMinDone={handleActualMinDone}
                    onUpdateTimeRecord={onUpdateTimeRecord}
                  />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {urgentTasks.length === 0 && noDeadlineTasks.length === 0 && (
          <p className="no-tasks">暂无待办任务 🎉</p>
        )}
      </div>
    </div>
  );
}

export default TodayFocus;