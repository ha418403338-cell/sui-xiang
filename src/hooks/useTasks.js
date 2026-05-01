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

  return {
    tasks,
    createTask,
    deleteTask,
    toggleTaskDone,
    updateTask,
    getTasksByProjectId,
    getTasksByZoneId
  };
}