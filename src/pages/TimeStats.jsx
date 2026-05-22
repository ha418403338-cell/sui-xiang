/**
 * 时间统计页面组件
 * 展示今日/本周/本月的时间统计数据
 */
import { useState, useMemo } from 'react';
import './TimeStats.css';

function TimeStats({ tasks, projects }) {
  // 当前时间范围选择：today, week, month
  const [timeRange, setTimeRange] = useState('today');

  // 获取当前时间范围的起始日期
  const getDateRange = useMemo(() => {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        // 获取本周一
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = now;
    }
    
    return {
      start: startDate.toISOString(),
      end: new Date().toISOString()
    };
  }, [timeRange]);

  // 过滤时间记录并计算统计数据
  const stats = useMemo(() => {
    const result = {
      totalMinutes: 0,
      byCategory: { primary: 0, side: 0, other: 0 },
      byProject: {},
      byTask: []
    };

    // 获取项目分类映射
    const projectCategories = {};
    projects.forEach(project => {
      projectCategories[project.id] = project.category || 'other';
    });

    // 获取项目名称映射
    const projectNames = {};
    projects.forEach(project => {
      projectNames[project.id] = project.name;
    });

    // 遍历所有任务
    tasks.forEach(task => {
      const projectId = task.projectId;
      const category = projectCategories[projectId] || 'other';
      const timeRecords = task.timeRecords || [];

      // 过滤时间范围内的记录
      const filteredRecords = timeRecords.filter(record => {
        return record.startTime >= getDateRange.start && record.startTime <= getDateRange.end;
      });

      // 计算该任务的总时长
      const taskMinutes = filteredRecords.reduce((sum, record) => sum + record.minutes, 0);

      if (taskMinutes > 0) {
        // 更新总时长
        result.totalMinutes += taskMinutes;

        // 更新分类统计
        result.byCategory[category] += taskMinutes;

        // 更新项目统计
        if (!result.byProject[projectId]) {
          result.byProject[projectId] = {
            name: projectNames[projectId] || '未知项目',
            category,
            minutes: 0
          };
        }
        result.byProject[projectId].minutes += taskMinutes;

        // 更新任务明细
        result.byTask.push({
          taskId: task.id,
          taskTitle: task.title,
          projectId,
          projectName: projectNames[projectId] || '未知项目',
          category,
          minutes: taskMinutes,
          records: filteredRecords
        });
      }
    });

    // 按时长排序项目
    result.sortedProjects = Object.values(result.byProject)
      .sort((a, b) => b.minutes - a.minutes);

    // 按时长排序任务
    result.sortedTasks = [...result.byTask]
      .sort((a, b) => b.minutes - a.minutes);

    return result;
  }, [tasks, projects, getDateRange]);

  // 格式化时长显示
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时 ${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  // 获取分类颜色
  const getCategoryColor = (category) => {
    switch (category) {
      case 'primary':
        return { bg: 'rgba(168, 200, 232, 0.3)', text: '#7EB8D4', border: 'rgba(168, 200, 232, 0.5)' };
      case 'side':
        return { bg: 'rgba(155, 196, 168, 0.3)', text: '#9BC4A8', border: 'rgba(155, 196, 168, 0.5)' };
      default:
        return { bg: 'rgba(153, 153, 153, 0.2)', text: '#999', border: 'rgba(153, 153, 153, 0.3)' };
    }
  };

  // 获取分类名称
  const getCategoryName = (category) => {
    switch (category) {
      case 'primary': return '本职';
      case 'side': return '副业';
      default: return '其他';
    }
  };

  return (
    <div className="time-stats-page">
      <h1 className="page-title">时间统计</h1>

      {/* 时间范围切换 */}
      <div className="time-range-tabs">
        <button
          className={`tab ${timeRange === 'today' ? 'active' : ''}`}
          onClick={() => setTimeRange('today')}
        >
          今日
        </button>
        <button
          className={`tab ${timeRange === 'week' ? 'active' : ''}`}
          onClick={() => setTimeRange('week')}
        >
          本周
        </button>
        <button
          className={`tab ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => setTimeRange('month')}
        >
          本月
        </button>
      </div>

      {/* 总时长卡片 */}
      <div className="stats-card total-duration-card">
        <div className="card-title">总时长</div>
        <div className="total-duration">
          {stats.totalMinutes > 0 ? (
            <span className="duration-value">{formatDuration(stats.totalMinutes)}</span>
          ) : (
            <span className="no-data">暂无记录</span>
          )}
        </div>
      </div>

      {/* 分类占比 */}
      <div className="stats-card category-chart-card">
        <div className="card-title">类型占比</div>
        {stats.totalMinutes > 0 ? (
          <div className="category-chart">
            <div className="chart-bars">
              {['primary', 'side', 'other'].map(category => {
                const color = getCategoryColor(category);
                const percentage = stats.totalMinutes > 0 
                  ? (stats.byCategory[category] / stats.totalMinutes * 100).toFixed(1) 
                  : 0;
                return (
                  <div key={category} className="category-bar-item">
                    <div className="bar-label">{getCategoryName(category)}</div>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color.bg,
                          borderColor: color.border
                        }}
                      />
                    </div>
                    <div className="bar-percentage" style={{ color: color.text }}>
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="category-summary">
              {['primary', 'side', 'other'].map(category => {
                const color = getCategoryColor(category);
                return (
                  <div key={category} className="summary-item">
                    <span className="summary-dot" style={{ backgroundColor: color.text }} />
                    <span className="summary-label">{getCategoryName(category)}</span>
                    <span className="summary-value" style={{ color: color.text }}>
                      {formatDuration(stats.byCategory[category])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-data">暂无记录</div>
        )}
      </div>

      {/* 项目时长排行 */}
      <div className="stats-card project-ranking-card">
        <div className="card-title">项目时长排行</div>
        {stats.sortedProjects.length > 0 ? (
          <div className="project-ranking">
            {stats.sortedProjects.map((project, index) => {
              const color = getCategoryColor(project.category);
              return (
                <div key={project.name} className="project-ranking-item">
                  <span className="rank-badge">{index + 1}</span>
                  <div className="project-info">
                    <span className="project-name">{project.name}</span>
                    <span
                      className="category-tag"
                      style={{
                        backgroundColor: color.bg,
                        color: color.text,
                        borderColor: color.border
                      }}
                    >
                      {getCategoryName(project.category)}
                    </span>
                  </div>
                  <span className="project-duration">{formatDuration(project.minutes)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-data">暂无记录</div>
        )}
      </div>

      {/* 任务明细 */}
      <div className="stats-card task-details-card">
        <div className="card-title">任务明细</div>
        {stats.sortedTasks.length > 0 ? (
          <div className="task-details">
            {stats.sortedTasks.map(task => {
              const color = getCategoryColor(task.category);
              return (
                <div key={task.taskId} className="task-detail-item">
                  <div className="task-info">
                    <span className="task-title">{task.taskTitle}</span>
                    <span className="task-project">📁 {task.projectName}</span>
                  </div>
                  <span className="task-duration" style={{ color: color.text }}>
                    {formatDuration(task.minutes)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-data">暂无记录</div>
        )}
      </div>
    </div>
  );
}

export default TimeStats;