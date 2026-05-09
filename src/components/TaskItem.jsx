import { useState, useEffect, useRef } from 'react';
import { formatDate, getTodayString } from '../utils/dateUtils.js';
import './TaskItem.css';

/**
 * 任务项组件
 * 显示单条任务的标题、截止日期、实际时长等信息
 * @param {Object} task - 任务对象
 * @param {Function} onToggle - 切换任务完成状态的回调函数
 * @param {Function} onDelete - 删除任务的回调函数
 * @param {Function} onUpdate - 更新任务信息的回调函数
 * @param {string} [projectName] - 任务所属项目名称
 * @param {Function} [onActualMinDone] - 实际时长输入完成后的回调函数（用于今日聚焦页面）
 * @param {Function} onAddSubtask - 添加子任务的回调函数
 * @param {Function} onDeleteSubtask - 删除子任务的回调函数
 * @param {Function} onToggleSubtaskDone - 切换子任务完成状态的回调函数
 * @param {Function} onUpdateSubtask - 更新子任务标题的回调函数
 */
function TaskItem({ task, onToggle, onDelete, onUpdate, projectName, onActualMinDone, onAddSubtask, onDeleteSubtask, onToggleSubtaskDone, onUpdateSubtask }) {
  // 处理任务完成状态切换
  const handleToggle = () => {
    onToggle(task.id);
  };

  // 处理任务删除
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个任务吗？')) {
      onDelete(task.id);
    }
  };

  // 根据截止日期获取样式类名
  // 截止日期 < 今天（已过期）→ 红色
  // 截止日期 === 今天（今日到期）→ 橙色
  // 截止日期 > 今天（未来）→ 灰色
  const getDeadlineClass = () => {
    if (!task.deadline) return '';
    const today = getTodayString();
    if (task.deadline < today) return 'deadline-overdue';
    if (task.deadline === today) return 'deadline-today';
    return 'deadline-future';
  };

  const deadlineClass = getDeadlineClass();

  // 编辑状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    deadline: task.deadline
  });
  const editRef = useRef(null);
  const dateInputRef = useRef(null);

  // 实际时长输入状态（任务完成后可填写）
  const [showActualMin, setShowActualMin] = useState(false);
  const [actualMin, setActualMin] = useState(task.actualMin || '');
  const actualMinRef = useRef(null);

  // 子任务相关状态
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.done).length;

  // 子任务编辑状态 - 存储正在编辑的子任务ID和对应的标题
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  // 开始编辑
  const startEditing = () => {
    setIsEditing(true);
  };

  // 编辑时自动聚焦日期输入框
  useEffect(() => {
    if (isEditing && dateInputRef.current) {
      dateInputRef.current.focus();
    }
  }, [isEditing]);

  // 保存编辑
  const saveEditing = () => {
    if (editData.title.trim()) {
      onUpdate(task.id, {
        title: editData.title.trim(),
        deadline: editData.deadline || null
      });
      setIsEditing(false);
    }
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditData({
      title: task.title,
      deadline: task.deadline
    });
    setIsEditing(false);
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
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
  }, [isEditing, editData]);

  // 任务完成时显示实际时长输入框
  useEffect(() => {
    if (task.done && task.actualMin == null) {
      setShowActualMin(true);
    } else {
      setShowActualMin(false);
    }
  }, [task.done, task.actualMin]);

  // 处理实际时长输入
  const handleActualMinKeyPress = (e) => {
    if (e.key === 'Enter' && actualMin.trim()) {
      onUpdate(task.id, { actualMin: parseInt(actualMin) });
      setShowActualMin(false);
      // 通知父组件实际时长输入完成
      if (onActualMinDone) {
        onActualMinDone(task.id);
      }
    }
  };

  // 开始编辑实际时长
  const startEditActualMin = () => {
    setActualMin(task.actualMin || '');
    setShowActualMin(true);
  };

  // 跳过实际时长填写
  const skipActualMin = () => {
    // 保存 actualMin 为 0，表示用户主动跳过
    onUpdate(task.id, { actualMin: 0 });
    setShowActualMin(false);
    // 通知父组件实际时长输入完成
    if (onActualMinDone) {
      onActualMinDone(task.id);
    }
  };

  // 处理添加子任务
  const handleAddSubtask = (e) => {
    e.stopPropagation();
    if (newSubtaskTitle.trim() && onAddSubtask) {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  // 处理子任务回车键添加
  const handleSubtaskKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddSubtask(e);
    }
  };

  // 处理删除子任务
  const handleDeleteSubtask = (e, subtaskId) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个子任务吗？') && onDeleteSubtask) {
      onDeleteSubtask(task.id, subtaskId);
    }
  };

  // 处理切换子任务完成状态
  const handleToggleSubtask = (e, subtaskId) => {
    e.stopPropagation();
    if (onToggleSubtaskDone) {
      onToggleSubtaskDone(task.id, subtaskId);
    }
  };

  // 开始编辑子任务标题
  const startEditSubtask = (subtask) => {
    e.stopPropagation();
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  };

  // 处理子任务编辑键盘事件
  const handleSubtaskEditKeyPress = (e, subtaskId) => {
    if (e.key === 'Enter') {
      // 保存子任务标题
      if (editingSubtaskTitle.trim() && onUpdateSubtask) {
        onUpdateSubtask(task.id, subtaskId, editingSubtaskTitle.trim());
      }
      setEditingSubtaskId(null);
      setEditingSubtaskTitle('');
    } else if (e.key === 'Escape') {
      // 取消编辑
      setEditingSubtaskId(null);
      setEditingSubtaskTitle('');
    }
  };

  // 点击子任务标题开始编辑
  const handleSubtaskTitleClick = (e, subtask) => {
    e.stopPropagation();
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  };

  return (
    <div className={`task-item task-zone-${task.zoneId} ${task.done ? 'done' : ''}`}>
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={task.done}
          onChange={handleToggle}
        />
      </div>
      <div className="task-content" ref={editRef}>
        {isEditing ? (
          <div className="task-edit-form">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              onKeyPress={handleKeyPress}
              autoFocus
              className="edit-title"
            />
            <div className="edit-meta">
              <input
                type="date"
                ref={dateInputRef}
                value={editData.deadline || ''}
                onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
              />
            </div>
            <div className="edit-actions">
              <button onClick={saveEditing} className="btn-primary">保存</button>
              <button onClick={cancelEditing} className="btn-secondary">取消</button>
            </div>
          </div>
        ) : (
          <>
            <div className="task-title-row">
              <span className="task-title" onClick={startEditing}>{task.title}</span>
              {subtasks.length > 0 && (
                <span
                  className="subtask-progress"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSubtasks(!showSubtasks);
                  }}
                >
                  {completedSubtasks}/{subtasks.length}
                </span>
              )}
            </div>
            <div className="task-meta">
              {task.deadline && (
                <span className={`task-deadline ${deadlineClass}`} onClick={startEditing}>📅 {task.deadline}</span>
              )}
              {task.actualMin > 0 && (
                <span className="task-duration" onClick={startEditActualMin}>⏱ {task.actualMin}分钟 ✏️</span>
              )}
              {projectName && (
                <span className="task-project">📁 {projectName}</span>
              )}
              {task.doneAt && (
                <span className="task-done-time">✅ {new Date(task.doneAt).toLocaleString('zh-CN')}</span>
              )}
            </div>
          </>
        )}

        {/* 任务完成后的实际时长输入框 */}
        {task.done && showActualMin && (
          <div className="actual-min-form" ref={actualMinRef}>
            <span className="actual-min-label">实际用时（分钟）：</span>
            <input
                type="number"
                value={actualMin}
                onChange={(e) => setActualMin(e.target.value)}
                onKeyPress={handleActualMinKeyPress}
                placeholder="实际时长（分钟）"
                min="1"
                className="actual-min-input"
              />
            <button onClick={skipActualMin} className="btn-skip">跳过</button>
          </div>
        )}

        {/* 子任务区域 */}
        {showSubtasks && (
          <div className="subtasks-container">
            <div className="add-subtask-form">
              <input
                type="text"
                placeholder="添加子任务..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyPress={handleSubtaskKeyPress}
                className="subtask-input"
              />
              <button onClick={handleAddSubtask} className="btn-add-subtask">添加</button>
            </div>
            {subtasks.map(subtask => (
              <div key={subtask.id} className={`subtask-item ${subtask.done ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  checked={subtask.done}
                  onChange={(e) => handleToggleSubtask(e, subtask.id)}
                  className="subtask-checkbox"
                />
                {editingSubtaskId === subtask.id ? (
                  <input
                    type="text"
                    value={editingSubtaskTitle}
                    onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                    onKeyPress={(e) => handleSubtaskEditKeyPress(e, subtask.id)}
                    onBlur={() => {
                      // 失焦时保存
                      if (editingSubtaskTitle.trim() && onUpdateSubtask) {
                        onUpdateSubtask(task.id, subtask.id, editingSubtaskTitle.trim());
                      }
                      setEditingSubtaskId(null);
                      setEditingSubtaskTitle('');
                    }}
                    autoFocus
                    className="subtask-edit-input"
                  />
                ) : (
                  <span
                    className="subtask-title"
                    onClick={(e) => handleSubtaskTitleClick(e, subtask)}
                  >
                    {subtask.title}
                  </span>
                )}
                <button
                  className="subtask-delete-btn"
                  onClick={(e) => handleDeleteSubtask(e, subtask.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="task-actions">
        <button
          className="add-subtask-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setShowSubtasks(!showSubtasks);
          }}
          aria-label="切换子任务"
        >
          {showSubtasks ? '收起' : '+'}
        </button>
        <button
          className="task-delete-btn"
          onClick={handleDelete}
          aria-label="删除任务"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default TaskItem;
