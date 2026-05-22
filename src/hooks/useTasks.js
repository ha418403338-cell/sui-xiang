/**
 * 任务数据管理 Hook
 * 提供任务的增删改查功能，并自动持久化到 localStorage
 */
import { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage.js';
import { generateId } from '../utils/uuid.js';

const STORAGE_KEY = 'todo_tasks';

export function useTasks() {
  // 任务列表状态 - 使用惰性初始化从 localStorage 读取数据
  const [tasks, setTasks] = useState(() => getItem(STORAGE_KEY, []));

  // 当任务数据变化时，持久化到 localStorage
  useEffect(() => {
    setItem(STORAGE_KEY, tasks);
  }, [tasks]);

  /**
   * 创建新任务
   * @param {string} projectId - 所属项目 ID
   * @param {string} zoneId - 所属区 ID（冗余字段）
   * @param {string} title - 任务标题
   * @param {string|null} deadline - 截止日期（ISO 字符串）
   * @returns {Object} 新创建的任务对象
   */
  const createTask = (projectId, zoneId, title, deadline = null) => {
    const newTask = {
      id: generateId(),
      projectId,
      zoneId,
      title,
      done: false,
      doneAt: null,
      deadline,
      subtasks: [], // 新增子任务字段
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  /**
   * 删除任务
   * @param {string} taskId - 任务 ID
   */
  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  /**
   * 切换任务完成状态
   * @param {string} taskId - 任务 ID
   */
  const toggleTaskDone = (taskId) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const newDone = !task.done;
          return {
            ...task,
            done: newDone,
            doneAt: newDone ? new Date().toISOString() : null,
            actualMin: newDone ? task.actualMin : null // 取消完成时重置时长
          };
        }
        return task;
      })
    );
  };

  /**
   * 更新任务信息
   * @param {string} taskId - 任务 ID
   * @param {Object} updates - 要更新的字段
   */
  const updateTask = (taskId, updates) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  /**
   * 根据项目 ID 获取任务列表
   * @param {string} projectId - 项目 ID
   * @returns {Array} 该项目下的任务列表
   */
  const getTasksByProjectId = (projectId) => {
    return tasks.filter(t => t.projectId === projectId);
  };

  /**
   * 根据区 ID 获取任务列表
   * @param {string} zoneId - 区 ID
   * @returns {Array} 该区下的任务列表
   */
  const getTasksByZoneId = (zoneId) => {
    return tasks.filter(t => t.zoneId === zoneId);
  };

  /**
   * 添加子任务
   * @param {string} taskId - 父任务 ID
   * @param {string} title - 子任务标题
   */
  const addSubtask = (taskId, title) => {
    const newSubtask = {
      id: generateId(),
      title,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString()
    };
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] }
          : task
      )
    );
  };

  /**
   * 删除子任务
   * @param {string} taskId - 父任务 ID
   * @param {string} subtaskId - 子任务 ID
   */
  const deleteSubtask = (taskId, subtaskId) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, subtasks: (task.subtasks || []).filter(s => s.id !== subtaskId) }
          : task
      )
    );
  };

  /**
   * 切换子任务完成状态
   * @param {string} taskId - 父任务 ID
   * @param {string} subtaskId - 子任务 ID
   */
  const toggleSubtaskDone = (taskId, subtaskId) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: (task.subtasks || []).map(subtask => {
              if (subtask.id === subtaskId) {
                const newDone = !subtask.done;
                return {
                  ...subtask,
                  done: newDone,
                  doneAt: newDone ? new Date().toISOString() : null
                };
              }
              return subtask;
            })
          };
        }
        return task;
      })
    );
  };

  /**
   * 更新子任务标题
   * @param {string} taskId - 父任务 ID
   * @param {string} subtaskId - 子任务 ID
   * @param {string} newTitle - 新的子任务标题
   */
  const updateSubtask = (taskId, subtaskId, newTitle) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: (task.subtasks || []).map(subtask =>
              subtask.id === subtaskId
                ? { ...subtask, title: newTitle }
                : subtask
            )
          };
        }
        return task;
      })
    );
  };

  /**
   * 添加时间记录
   * @param {string} taskId - 任务 ID
   * @param {Object} record - 时间记录对象 { startTime, endTime, note }
   */
  const addTimeRecord = (taskId, record) => {
    const newRecord = {
      id: generateId(),
      startTime: record.startTime,
      endTime: record.endTime,
      minutes: Math.round((new Date(record.endTime) - new Date(record.startTime)) / 60000) || 1,
      note: record.note || ''
    };
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const timeRecords = task.timeRecords || [];
          const newActualMin = timeRecords.reduce((sum, r) => sum + r.minutes, 0) + newRecord.minutes;
          return {
            ...task,
            timeRecords: [...timeRecords, newRecord],
            actualMin: newActualMin
          };
        }
        return task;
      })
    );
  };

  /**
   * 删除时间记录
   * @param {string} taskId - 任务 ID
   * @param {string} recordId - 时间记录 ID
   */
  const deleteTimeRecord = (taskId, recordId) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const timeRecords = (task.timeRecords || []).filter(r => r.id !== recordId);
          const newActualMin = timeRecords.reduce((sum, r) => sum + r.minutes, 0);
          return {
            ...task,
            timeRecords,
            actualMin: newActualMin
          };
        }
        return task;
      })
    );
  };

  /**
   * 更新时间记录
   * @param {string} taskId - 任务 ID
   * @param {string} recordId - 时间记录 ID
   * @param {Object} updates - 要更新的字段 { startTime, endTime, note }
   */
  const updateTimeRecord = (taskId, recordId, updates) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const timeRecords = (task.timeRecords || []).map(record => {
            if (record.id === recordId) {
              const startTime = updates.startTime || record.startTime;
              const endTime = updates.endTime || record.endTime;
              const minutes = Math.round((new Date(endTime) - new Date(startTime)) / 60000) || 1;
              return {
                ...record,
                startTime,
                endTime,
                minutes,
                note: updates.note !== undefined ? updates.note : record.note
              };
            }
            return record;
          });
          const newActualMin = timeRecords.reduce((sum, r) => sum + r.minutes, 0);
          return {
            ...task,
            timeRecords,
            actualMin: newActualMin
          };
        }
        return task;
      })
    );
  };

  return {
    tasks,
    createTask,
    deleteTask,
    toggleTaskDone,
    updateTask,
    getTasksByProjectId,
    getTasksByZoneId,
    addSubtask,
    deleteSubtask,
    toggleSubtaskDone,
    updateSubtask,
    addTimeRecord,
    deleteTimeRecord,
    updateTimeRecord
  };
}
