import { useState, useEffect, useRef } from 'react';
import TaskItem from './TaskItem.jsx';
import './ProjectItem.css';

/**
 * 项目折叠块组件
 * 显示单个项目名称及其下的所有任务，支持折叠/展开
 * @param {Object} project - 项目对象
 * @param {Array} tasks - 该项目下的所有任务
 * @param {Function} onCreateTask - 创建新任务的回调函数
 * @param {Function} onToggleTask - 切换任务完成状态的回调函数
 * @param {Function} onDeleteTask - 删除任务的回调函数
 * @param {Function} onUpdateTask - 更新任务信息的回调函数
 * @param {Function} onUpdateProject - 更新项目名称的回调函数
 * @param {Function} onToggleProjectDone - 切换项目完成状态的回调函数
 * @param {Function} onTogglePin - 切换项目置顶状态的回调函数
 * @param {Function} onUpdateProjectCategory - 更新项目类型的回调函数
 * @param {Function} onAddTimeRecord - 添加时间记录的回调函数
 * @param {Function} onDeleteTimeRecord - 删除时间记录的回调函数
 * @param {Function} onUpdateTimeRecord - 更新时间记录的回调函数
 * @param {Function} onAddSubtask - 添加子任务的回调函数
 * @param {Function} onDeleteSubtask - 删除子任务的回调函数
 * @param {Function} onToggleSubtaskDone - 切换子任务完成状态的回调函数
 * @param {Function} onUpdateSubtask - 更新子任务标题的回调函数
 */
function ProjectItem({ project, tasks, onCreateTask, onToggleTask, onDeleteTask, onUpdateTask, onUpdateProject, onToggleProjectDone, onTogglePin, onUpdateProjectCategory, onAddTimeRecord, onDeleteTimeRecord, onUpdateTimeRecord, onAddSubtask, onDeleteSubtask, onToggleSubtaskDone, onUpdateSubtask }) {
  // 控制项目折叠/展开状态
  const [isCollapsed, setIsCollapsed] = useState(false);
  // 控制新建任务输入框的显示状态
  const [isAddingTask, setIsAddingTask] = useState(false);
  // 新任务表单数据
  const [newTask, setNewTask] = useState({
    title: '',
    deadline: ''
  });

  // 编辑状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const editRef = useRef(null);

  // 计算已完成任务数量
  const completedCount = tasks.filter(t => t.done).length;

  // 处理项目完成状态切换
  const handleToggleProjectDone = (e) => {
    e.stopPropagation();
    onToggleProjectDone(project.id);
    // 勾选后自动折叠任务列表
    if (!project.done) {
      setIsCollapsed(true);
    }
  };

  // 处理新建任务
  const handleCreateTask = () => {
    if (newTask.title.trim()) {
      onCreateTask(
        project.id,
        project.zoneId,
        newTask.title.trim(),
        newTask.deadline || null
      );
      setNewTask({ title: '', deadline: '' });
      setIsAddingTask(false);
    }
  };

  // 处理回车键创建任务
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreateTask();
    }
  };

  // 开始编辑项目名称
  const startEditing = () => {
    setIsEditing(true);
  };

  // 保存项目名称
  const saveEditing = () => {
    if (editName.trim()) {
      onUpdateProject(project.id, editName.trim());
      setIsEditing(false);
    }
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditName(project.name);
    setIsEditing(false);
  };

  // 处理键盘事件
  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // 点击外部区域关闭编辑
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editRef.current && !editRef.current.contains(event.target)) {
        saveEditing();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, editName]);

  return (
    <div className={`project-item project-zone-${project.zoneId} ${isCollapsed ? 'collapsed' : ''} ${project.done ? 'done' : ''}`}>
      {/* 项目头部 */}
      <div className="project-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <input
          type="checkbox"
          className="project-checkbox"
          checked={project.done || false}
          onChange={handleToggleProjectDone}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="project-toggle">{isCollapsed ? '▶' : '▼'}</span>
        <div className="project-name-container" ref={editRef}>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyPress={handleEditKeyPress}
              autoFocus
              className="project-name-input"
            />
          ) : (
            <h3 className={`project-name ${project.done ? 'done' : ''}`} onClick={startEditing}>{project.name}</h3>
          )}
        </div>
        <button
          className={`pin-btn ${project.pinned ? 'pinned' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(project.id);
          }}
          aria-label={project.pinned ? '取消置顶' : '置顶'}
        >
          ⭐
        </button>
        <button
          className={`category-tag category-${project.category || 'other'}`}
          onClick={(e) => {
            e.stopPropagation();
            const categories = ['primary', 'side', 'other'];
            const currentIndex = categories.indexOf(project.category || 'other');
            const nextIndex = (currentIndex + 1) % categories.length;
            onUpdateProjectCategory(project.id, categories[nextIndex]);
          }}
          aria-label="切换项目类型"
        >
          {project.category === 'primary' ? '本职' : project.category === 'side' ? '副业' : '其他'}
        </button>
        {tasks.length > 0 && (
          <span className="project-progress">
            {completedCount}/{tasks.length}
          </span>
        )}
      </div>

      {/* 任务列表 */}
      {!isCollapsed && (
        <div className="task-list">
          {/* 新建任务表单 */}
          {isAddingTask ? (
            <div className="add-task-form">
              <input
                type="text"
                placeholder="任务标题"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <div className="task-form-row">
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button onClick={handleCreateTask} className="btn-primary">
                  确认
                </button>
                <button onClick={() => setIsAddingTask(false)} className="btn-secondary">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="add-task-btn"
            >
              + 新建任务
            </button>
          )}

          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
                onUpdate={onUpdateTask}
                onAddSubtask={onAddSubtask}
                onDeleteSubtask={onDeleteSubtask}
                onToggleSubtaskDone={onToggleSubtaskDone}
                onUpdateSubtask={onUpdateSubtask}
                onAddTimeRecord={onAddTimeRecord}
                onDeleteTimeRecord={onDeleteTimeRecord}
                onUpdateTimeRecord={onUpdateTimeRecord}
              />
            ))
          ) : (
            !isAddingTask && (
              <p className="no-tasks">暂无任务，点击上方添加</p>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectItem;
