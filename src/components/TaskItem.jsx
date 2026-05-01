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
 */
function TaskItem({ task, onToggle, onDelete, onUpdate, projectName, onActualMinDone }) {
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

  // 实际时长输入状态（任务完成后可填写）
  const [showActualMin, setShowActualMin] = useState(false);
  const [actualMin, setActualMin] = useState(task.actualMin || '');
  const actualMinRef = useRef(null);

  // 开始编辑
  const startEditing = () => {
    setIsEditing(true);
  };

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
      // 通知父组件实际时长输入已完成
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
    // 通知父组件实际时长输入已完成
    if (onActualMinDone) {
      onActualMinDone(task.id);
    }
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
            <span className="task-title" onClick={startEditing}>{task.title}</span>
            <div className="task-meta">
              {task.deadline && (
                <span className={`task-deadline ${deadlineClass}`}>📅 {task.deadline}</span>
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
      </div>
      <button
        className="task-delete-btn"
        onClick={handleDelete}
        aria-label="删除任务"
      >
        🗑️
      </button>
    </div>
  );
}

export default TaskItem;