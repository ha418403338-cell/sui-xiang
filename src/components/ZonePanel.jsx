import { useState } from 'react';
import ProjectItem from './ProjectItem.jsx';
import './ZonePanel.css';

/**
 * 区面板组件
 * 显示单个区的名称、每日目标、及其下的所有项目
 * @param {Object} zone - 区配置对象
 * @param {Array} projects - 该区下的所有项目
 * @param {Array} tasks - 该区下的所有任务
 * @param {Function} onCreateProject - 创建新项目的回调函数
 * @param {Function} onCreateTask - 创建新任务的回调函数
 * @param {Function} onToggleTask - 切换任务完成状态的回调函数
 * @param {Function} onDeleteTask - 删除任务的回调函数
 * @param {Function} onUpdateTask - 更新任务信息的回调函数
 * @param {Function} onUpdateProject - 更新项目名称的回调函数
 * @param {Function} onToggleProjectDone - 切换项目完成状态的回调函数
 * @param {Function} onAddSubtask - 添加子任务的回调函数
 * @param {Function} onDeleteSubtask - 删除子任务的回调函数
 * @param {Function} onToggleSubtaskDone - 切换子任务完成状态的回调函数
 * @param {Function} onUpdateSubtask - 更新子任务标题的回调函数
 */
function ZonePanel({ zone, projects, tasks, onCreateProject, onCreateTask, onToggleTask, onDeleteTask, onUpdateTask, onUpdateProject, onToggleProjectDone, onAddSubtask, onDeleteSubtask, onToggleSubtaskDone, onUpdateSubtask }) {
  // 控制区面板的折叠/展开状态（移动端使用）
  const [isCollapsed, setIsCollapsed] = useState(false);
  // 控制新建项目输入框的显示状态
  const [isAddingProject, setIsAddingProject] = useState(false);
  // 新项目名称
  const [newProjectName, setNewProjectName] = useState('');
  // 控制已完成项目的折叠/展开状态
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  // 根据 zoneId 筛选项目
  const zoneProjects = projects.filter(p => p.zoneId === zone.id);
  // 未完成项目
  const activeProjects = zoneProjects.filter(p => !p.done);
  // 已完成项目
  const completedProjects = zoneProjects.filter(p => p.done);

  // 根据 zoneId 筛选任务
  const zoneTasks = tasks.filter(t => t.zoneId === zone.id);

  // 处理新建项目
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(zone.id, newProjectName.trim());
      setNewProjectName('');
      setIsAddingProject(false);
    }
  };

  // 处理回车键创建项目
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    }
  };

  return (
    <div className={`zone-panel zone-${zone.id} ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 区头部：区名 + 每日目标 */}
      <div className="zone-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="zone-info">
          <h2 className="zone-name">{zone.name}</h2>
          <span className="zone-goal-tag">{zone.dailyGoal}</span>
        </div>
        <button className="collapse-btn" aria-label="切换折叠状态">
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {/* 区的内容区域 */}
      {!isCollapsed && (
        <div className="zone-content">
          {/* 新建项目输入框 */}
          {isAddingProject ? (
            <div className="add-project-form">
              <input
                type="text"
                placeholder="输入项目名称"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <div className="form-actions">
                <button onClick={handleCreateProject} className="btn-primary">
                  确认
                </button>
                <button onClick={() => setIsAddingProject(false)} className="btn-secondary">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingProject(true)}
              className="add-project-btn"
            >
              + 新建项目
            </button>
          )}

          {zoneProjects.length === 0 && !isAddingProject ? (
            <p className="empty-tip">暂无项目，点击上方添加</p>
          ) : (
            <>
              {activeProjects.map(project => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  tasks={zoneTasks.filter(t => t.projectId === project.id)}
                  onCreateTask={onCreateTask}
                  onToggleTask={onToggleTask}
                  onDeleteTask={onDeleteTask}
                  onUpdateTask={onUpdateTask}
                  onUpdateProject={onUpdateProject}
                  onToggleProjectDone={onToggleProjectDone}
                  onAddSubtask={onAddSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onToggleSubtaskDone={onToggleSubtaskDone}
                  onUpdateSubtask={onUpdateSubtask}
                />
              ))}

              {/* 已完成项目折叠区 */}
              {completedProjects.length > 0 && (
                <div className="completed-projects-section">
                  <div
                    className="completed-projects-header"
                    onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                  >
                    <span className="completed-toggle">
                      {isCompletedExpanded ? '▼' : '▶'}
                    </span>
                    <span className="completed-title">
                      已完成项目（{completedProjects.length}个）
                    </span>
                  </div>
                  {isCompletedExpanded && (
                    <div className="completed-projects-list">
                      {completedProjects.map(project => (
                        <ProjectItem
                          key={project.id}
                          project={project}
                          tasks={zoneTasks.filter(t => t.projectId === project.id)}
                          onCreateTask={onCreateTask}
                          onToggleTask={onToggleTask}
                          onDeleteTask={onDeleteTask}
                          onUpdateTask={onUpdateTask}
                          onUpdateProject={onUpdateProject}
                          onToggleProjectDone={onToggleProjectDone}
                          onAddSubtask={onAddSubtask}
                          onDeleteSubtask={onDeleteSubtask}
                          onToggleSubtaskDone={onToggleSubtaskDone}
                          onUpdateSubtask={onUpdateSubtask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ZonePanel;
