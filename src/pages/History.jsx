import { useState } from 'react';
import { getTodayString } from '../utils/dateUtils.js';
import './History.css';

/**
 * 历史记录页面
 * 支持按日期和按项目两种视角查看任务历史
 */
function History({ projects, tasks }) {
  // 当前视图模式：'date' 或 'project'
  const [viewMode, setViewMode] = useState('date');
  
  // 按日期视图的选中日期
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  
  // 按项目视图的选中项目
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');

  // 按日期视角：获取当天已完成的任务
  const getCompletedTasksByDate = (date) => {
    return tasks.filter(task => {
      if (!task.done || !task.doneAt) return false;
      const taskDate = new Date(task.doneAt).toISOString().split('T')[0];
      return taskDate === date;
    }).map(task => ({
      ...task,
      projectName: projects.find(p => p.id === task.projectId)?.name || '未分类'
    }));
  };

  // 按日期视角：获取当天到期但未完成的任务
  // 条件：deadline === 选中日期 且 done === false
  const getUncompletedTasksByDate = (date) => {
    return tasks.filter(task => {
      return !task.done && task.deadline === date;
    }).map(task => ({
      ...task,
      projectName: projects.find(p => p.id === task.projectId)?.name || '未分类'
    }));
  };

  // 按项目视角：获取项目的已完成任务（按完成日期倒序）
  const getProjectCompletedTasks = (projectId) => {
    return tasks
      .filter(task => task.projectId === projectId && task.done && task.doneAt)
      .map(task => ({
        ...task,
        projectName: projects.find(p => p.id === task.projectId)?.name || '未分类'
      }))
      .sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt));
  };

  // 按项目视角：计算项目统计
  const getProjectStats = (projectId) => {
    const completedTasks = tasks.filter(
      task => task.projectId === projectId && task.done
    );
    const totalCount = completedTasks.length;
    const totalMinutes = completedTasks.reduce(
      (sum, task) => sum + (task.actualMin || 0),
      0
    );
    return { totalCount, totalMinutes };
  };

  // 格式化日期显示
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 渲染按日期视角
  const renderDateView = () => {
    const completedTasks = getCompletedTasksByDate(selectedDate);
    const uncompletedTasks = getUncompletedTasksByDate(selectedDate);

    return (
      <div className="date-view">
        {/* 日期选择器 */}
        <div className="date-picker-section">
          <label className="date-label">选择日期：</label>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <span className="date-display">{formatDate(selectedDate)}</span>
        </div>

        <div className="history-content">
          {/* 已完成列表 */}
          <div className="task-section">
            <h3 className="section-title">
              ✅ 已完成
              <span className="section-count">({completedTasks.length}条)</span>
            </h3>
            {completedTasks.length > 0 ? (
              <ul className="task-list">
                {completedTasks.map(task => (
                  <li key={task.id} className="task-item">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      <span className="task-project">📁 {task.projectName}</span>
                      {task.actualMin && (
                        <span className="task-duration">⏱ {task.actualMin}分钟</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">当日无完成任务</p>
            )}
          </div>

          {/* 未完成列表 */}
          <div className="task-section">
            <h3 className="section-title">
              ⏳ 未完成
              <span className="section-count">({uncompletedTasks.length}条)</span>
            </h3>
            {uncompletedTasks.length > 0 ? (
              <ul className="task-list">
                {uncompletedTasks.map(task => (
                  <li key={task.id} className="task-item incomplete">
                    <span className="task-title">{task.title}</span>
                    <div className="task-meta">
                      <span className="task-project">📁 {task.projectName}</span>
                      {task.deadline && (
                        <span className="task-deadline">📅 截止：{task.deadline}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">当日无未完成任务</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染按项目视角
  const renderProjectView = () => {
    const projectStats = selectedProjectId ? getProjectStats(selectedProjectId) : null;
    const projectTasks = selectedProjectId ? getProjectCompletedTasks(selectedProjectId) : [];
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    return (
      <div className="project-view">
        {/* 项目选择器 */}
        <div className="project-select-section">
          <label className="project-label">选择项目：</label>
          <select
            className="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.done ? '✅ ' : ''}{project.name}
              </option>
            ))}
          </select>
        </div>

        {/* 项目统计 */}
        {selectedProject && projectStats && (
          <div className="project-stats">
            <div className="stat-card">
              <span className="stat-value">{projectStats.totalCount}</span>
              <span className="stat-label">累计完成任务</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{projectStats.totalMinutes}</span>
              <span className="stat-label">累计时长（分钟）</span>
            </div>
          </div>
        )}

        {/* 任务时间线 */}
        <div className="timeline-section">
          <h3 className="section-title">
            📋 任务时间线
            <span className="section-count">({projectTasks.length}条)</span>
          </h3>
          {projectTasks.length > 0 ? (
            <ul className="timeline-list">
              {projectTasks.map(task => {
                const doneDate = new Date(task.doneAt);
                const dateStr = doneDate.toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short'
                });
                return (
                  <li key={task.id} className="timeline-item">
                    <div className="timeline-date">{dateStr}</div>
                    <div className="timeline-content">
                      <span className="task-title">{task.title}</span>
                      {task.actualMin && (
                        <span className="task-duration">⏱ {task.actualMin}分钟</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-message">
              {selectedProject ? '该项目暂无完成任务' : '请选择一个项目'}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="history-page">
      <h1 className="page-title">历史记录</h1>

      {/* 视图切换按钮 */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'date' ? 'active' : ''}`}
          onClick={() => setViewMode('date')}
        >
          📅 按日期
        </button>
        <button
          className={`toggle-btn ${viewMode === 'project' ? 'active' : ''}`}
          onClick={() => setViewMode('project')}
        >
          📁 按项目
        </button>
      </div>

      {/* 视图内容 */}
      <div className="history-view">
        {viewMode === 'date' ? renderDateView() : renderProjectView()}
      </div>
    </div>
  );
}

export default History;
