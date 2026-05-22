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
 * @param {Function} onAddTimeRecord - 添加时间记录的回调函数
 * @param {Function} onDeleteTimeRecord - 删除时间记录的回调函数
 * @param {Function} onUpdateTimeRecord - 更新时间记录的回调函数
 */
function TaskItem({ task, onToggle, onDelete, onUpdate, projectName, onActualMinDone, onAddSubtask, onDeleteSubtask, onToggleSubtaskDone, onUpdateSubtask, onAddTimeRecord, onDeleteTimeRecord, onUpdateTimeRecord }) {
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

  // 时间记录相关状态
  const [showTimeRecords, setShowTimeRecords] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [manualRecord, setManualRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    note: ''
  });
  const timeRecords = task.timeRecords || [];

  // 批量导入时间记录相关状态
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchImportDate, setBatchImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchImportText, setBatchImportText] = useState('');
  const [batchImportResults, setBatchImportResults] = useState([]);

  // 从 localStorage 读取计时状态
  useEffect(() => {
    const activeTimer = localStorage.getItem('todo_active_timer');
    if (activeTimer) {
      const { taskId, startTime } = JSON.parse(activeTimer);
      if (taskId === task.id) {
        setIsTimerRunning(true);
        setTimerStartTime(startTime);
      }
    }
  }, [task.id]);

  // 实时计时器
  useEffect(() => {
    let interval;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const start = new Date(timerStartTime);
        const diff = Math.floor((now - start) / 1000);
        setElapsedTime(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  // 格式化计时显示
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  // 开始计时
  const handleStartTimer = () => {
    const startTime = new Date().toISOString();
    setTimerStartTime(startTime);
    setIsTimerRunning(true);
    setElapsedTime(0);
    localStorage.setItem('todo_active_timer', JSON.stringify({
      taskId: task.id,
      startTime
    }));
  };

  // 结束计时
  const handleStopTimer = () => {
    const endTime = new Date().toISOString();
    if (onAddTimeRecord) {
      onAddTimeRecord(task.id, {
        startTime: timerStartTime,
        endTime,
        note: ''
      });
    }
    setIsTimerRunning(false);
    setTimerStartTime(null);
    setElapsedTime(0);
    localStorage.removeItem('todo_active_timer');
  };

  // 处理手动记录时间变化
  const handleManualRecordChange = (field, value) => {
    setManualRecord(prev => ({ ...prev, [field]: value }));
  };

  // 添加手动记录
  const handleAddManualRecord = () => {
    if (manualRecord.startTime && manualRecord.endTime && onAddTimeRecord) {
      const startTime = new Date(`${manualRecord.date}T${manualRecord.startTime}`);
      const endTime = new Date(`${manualRecord.date}T${manualRecord.endTime}`);
      
      if (endTime > startTime) {
        onAddTimeRecord(task.id, {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          note: manualRecord.note
        });
        setManualRecord({
          date: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
          note: ''
        });
      }
    }
  };

  // 删除时间记录
  const handleDeleteTimeRecord = (recordId) => {
    if (window.confirm('确定要删除这条时间记录吗？') && onDeleteTimeRecord) {
      onDeleteTimeRecord(task.id, recordId);
    }
  };

  // 解析批量导入的时间文本
  const parseBatchImport = () => {
    const lines = batchImportText.trim().split('\n');
    const results = [];
    const timeRegex = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      const match = trimmedLine.match(timeRegex);
      if (match) {
        const startHour = parseInt(match[1], 10);
        const startMin = parseInt(match[2], 10);
        const endHour = parseInt(match[3], 10);
        const endMin = parseInt(match[4], 10);
        
        // 验证时间有效性
        if (startHour >= 0 && startHour <= 23 && startMin >= 0 && startMin <= 59 &&
            endHour >= 0 && endHour <= 23 && endMin >= 0 && endMin <= 59) {
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          if (endMinutes > startMinutes) {
            const minutes = endMinutes - startMinutes;
            results.push({
              line: trimmedLine,
              valid: true,
              startHour,
              startMin,
              endHour,
              endMin,
              minutes,
              index
            });
          } else {
            results.push({
              line: trimmedLine,
              valid: false,
              error: '结束时间必须晚于开始时间',
              index
            });
          }
        } else {
          results.push({
            line: trimmedLine,
            valid: false,
            error: '时间格式无效',
            index
          });
        }
      } else {
        results.push({
          line: trimmedLine,
          valid: false,
          error: '格式不正确，应为 HH:MM-HH:MM',
          index
        });
      }
    });
    
    setBatchImportResults(results);
  };

  // 批量导入时间记录
  const handleBatchImport = () => {
    const validResults = batchImportResults.filter(r => r.valid);
    
    if (validResults.length === 0) {
      alert('没有有效的时间记录可导入');
      return;
    }
    
    validResults.forEach(result => {
      const startTime = new Date(`${batchImportDate}T${String(result.startHour).padStart(2, '0')}:${String(result.startMin).padStart(2, '0')}`);
      const endTime = new Date(`${batchImportDate}T${String(result.endHour).padStart(2, '0')}:${String(result.endMin).padStart(2, '0')}`);
      
      if (onAddTimeRecord) {
        onAddTimeRecord(task.id, {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          note: ''
        });
      }
    });
    
    // 清空导入表单
    setBatchImportText('');
    setBatchImportResults([]);
    setShowBatchImport(false);
  };

  // 计算批量导入的总时长
  const getBatchImportTotalMinutes = () => {
    return batchImportResults
      .filter(r => r.valid)
      .reduce((sum, r) => sum + r.minutes, 0);
  };

  // 编辑时间记录相关状态
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editingRecord, setEditingRecord] = useState({
    date: '',
    startTime: '',
    endTime: '',
    note: ''
  });

  // 开始编辑时间记录
  const handleStartEditRecord = (record) => {
    const startDate = new Date(record.startTime);
    const endDate = new Date(record.endTime);
    setEditingRecordId(record.id);
    setEditingRecord({
      date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
      startTime: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
      endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
      note: record.note || ''
    });
  };

  // 取消编辑时间记录
  const handleCancelEditRecord = () => {
    setEditingRecordId(null);
    setEditingRecord({
      date: '',
      startTime: '',
      endTime: '',
      note: ''
    });
  };

  // 保存编辑的时间记录
  const handleSaveEditRecord = () => {
    if (editingRecord.startTime && editingRecord.endTime && onUpdateTimeRecord) {
      const startTime = new Date(`${editingRecord.date}T${editingRecord.startTime}`);
      const endTime = new Date(`${editingRecord.date}T${editingRecord.endTime}`);
      
      if (endTime > startTime) {
        onUpdateTimeRecord(task.id, editingRecordId, {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          note: editingRecord.note
        });
        handleCancelEditRecord();
      }
    }
  };

  // 处理编辑记录的时间变化
  const handleEditingRecordChange = (field, value) => {
    setEditingRecord(prev => ({ ...prev, [field]: value }));
  };

  // 计算编辑记录的分钟数
  const getEditingRecordMinutes = () => {
    if (editingRecord.startTime && editingRecord.endTime) {
      const start = new Date(`${editingRecord.date}T${editingRecord.startTime}`);
      const end = new Date(`${editingRecord.date}T${editingRecord.endTime}`);
      const diff = Math.round((end - start) / 60000);
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  // 计算手动记录的分钟数
  const getManualRecordMinutes = () => {
    if (manualRecord.startTime && manualRecord.endTime) {
      const start = new Date(`${manualRecord.date}T${manualRecord.startTime}`);
      const end = new Date(`${manualRecord.date}T${manualRecord.endTime}`);
      const diff = Math.round((end - start) / 60000);
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

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

        {/* 时间记录区域 */}
        {showTimeRecords && (
          <div className="time-records-container">
            <div className="time-records-header">
              <h4>时间记录</h4>
            </div>
            
            {/* 实时计时 */}
            <div className="timer-section">
              <div className="timer-display">
                {isTimerRunning ? (
                  <>
                    <span className="timer-time">{formatElapsedTime(elapsedTime)}</span>
                    <button onClick={handleStopTimer} className="btn-stop-timer">结束计时</button>
                  </>
                ) : (
                  <button onClick={handleStartTimer} className="btn-start-timer">开始计时</button>
                )}
              </div>
            </div>

            {/* 手动补记 */}
            <div className="manual-record-section">
              <div className="manual-record-form">
                <input
                  type="date"
                  value={manualRecord.date}
                  onChange={(e) => handleManualRecordChange('date', e.target.value)}
                  className="record-date-input"
                />
                <input
                  type="time"
                  value={manualRecord.startTime}
                  onChange={(e) => handleManualRecordChange('startTime', e.target.value)}
                  className="record-time-input"
                />
                <span className="time-separator">-</span>
                <input
                  type="time"
                  value={manualRecord.endTime}
                  onChange={(e) => handleManualRecordChange('endTime', e.target.value)}
                  className="record-time-input"
                />
                <input
                  type="text"
                  placeholder="备注（可选）"
                  value={manualRecord.note}
                  onChange={(e) => handleManualRecordChange('note', e.target.value)}
                  className="record-note-input"
                />
                <button onClick={handleAddManualRecord} className="btn-add-record" disabled={!manualRecord.startTime || !manualRecord.endTime}>
                  添加
                </button>
              </div>
              {getManualRecordMinutes() > 0 && (
                <div className="record-preview">共 {getManualRecordMinutes()} 分钟</div>
              )}
            </div>

            {/* 批量导入 */}
            <div className="batch-import-section">
              <button 
                onClick={() => {
                  setShowBatchImport(!showBatchImport);
                  if (!showBatchImport) {
                    setBatchImportResults([]);
                  }
                }} 
                className="btn-batch-import"
              >
                {showBatchImport ? '收起批量导入' : '批量导入'}
              </button>
              
              {showBatchImport && (
                <div className="batch-import-form">
                  <input
                    type="date"
                    value={batchImportDate}
                    onChange={(e) => {
                      setBatchImportDate(e.target.value);
                      // 日期变化时重新解析
                      if (batchImportText.trim()) {
                        parseBatchImport();
                      }
                    }}
                    className="record-date-input"
                  />
                  <textarea
                    value={batchImportText}
                    onChange={(e) => {
                      setBatchImportText(e.target.value);
                    }}
                    onBlur={parseBatchImport}
                    placeholder="粘贴时间段，每行一个，格式：
09:00-10:30
14:00-15:45
16:20-17:00"
                    className="batch-import-textarea"
                    rows={4}
                  />
                  
                  {/* 解析结果预览 */}
                  {batchImportResults.length > 0 && (
                    <div className="batch-import-preview">
                      {batchImportResults.map((result, index) => (
                        <div key={index} className={`preview-item ${result.valid ? 'valid' : 'invalid'}`}>
                          <span className="preview-line">{result.line}</span>
                          {result.valid ? (
                            <span className="preview-minutes">→ {result.minutes}分钟</span>
                          ) : (
                            <span className="preview-error">{result.error}</span>
                          )}
                        </div>
                      ))}
                      <div className="batch-total">
                        共 {getBatchImportTotalMinutes()} 分钟
                      </div>
                    </div>
                  )}
                  
                  <div className="batch-import-actions">
                    <button 
                      onClick={parseBatchImport} 
                      className="btn-parse"
                      disabled={!batchImportText.trim()}
                    >
                      解析
                    </button>
                    <button 
                      onClick={handleBatchImport} 
                      className="btn-confirm-import"
                      disabled={getBatchImportTotalMinutes() === 0}
                    >
                      确认导入
                    </button>
                    <button 
                      onClick={() => {
                        setBatchImportText('');
                        setBatchImportResults([]);
                      }} 
                      className="btn-clear"
                    >
                      清空
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 时间记录列表 */}
            {timeRecords.length > 0 && (
              <div className="time-records-list">
                {timeRecords.map(record => {
                  const startDate = new Date(record.startTime);
                  const endDate = new Date(record.endTime);
                  const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
                  const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
                  const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                  const isEditing = editingRecordId === record.id;
                  
                  return (
                    <div key={record.id} className="time-record-item">
                      {isEditing ? (
                        <div className="record-edit-form">
                          <input
                            type="date"
                            value={editingRecord.date}
                            onChange={(e) => handleEditingRecordChange('date', e.target.value)}
                            className="record-date-input"
                          />
                          <input
                            type="time"
                            value={editingRecord.startTime}
                            onChange={(e) => handleEditingRecordChange('startTime', e.target.value)}
                            className="record-time-input"
                          />
                          <span className="time-separator">-</span>
                          <input
                            type="time"
                            value={editingRecord.endTime}
                            onChange={(e) => handleEditingRecordChange('endTime', e.target.value)}
                            className="record-time-input"
                          />
                          <input
                            type="text"
                            placeholder="备注（可选）"
                            value={editingRecord.note}
                            onChange={(e) => handleEditingRecordChange('note', e.target.value)}
                            className="record-note-input"
                          />
                          <button onClick={handleSaveEditRecord} className="btn-save-record" disabled={!editingRecord.startTime || !editingRecord.endTime}>
                            保存
                          </button>
                          <button onClick={handleCancelEditRecord} className="btn-cancel-record">
                            取消
                          </button>
                          {getEditingRecordMinutes() > 0 && (
                            <div className="record-preview">共 {getEditingRecordMinutes()} 分钟</div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="record-info">
                            <span className="record-date">{dateStr}</span>
                            <span className="record-time-range">{startTimeStr} - {endTimeStr}</span>
                            <span className="record-duration">{record.minutes}分钟</span>
                            {record.note && <span className="record-note">{record.note}</span>}
                          </div>
                          <div className="record-actions">
                            <button
                              className="record-edit-btn"
                              onClick={() => handleStartEditRecord(record)}
                            >
                              ✏️
                            </button>
                            <button
                              className="record-delete-btn"
                              onClick={() => handleDeleteTimeRecord(record.id)}
                            >
                              ×
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="task-actions">
        <button
          className="time-records-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setShowTimeRecords(!showTimeRecords);
          }}
          aria-label="切换时间记录"
        >
          ⏱️
        </button>
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
