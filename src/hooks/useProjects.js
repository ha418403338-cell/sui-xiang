/**
 * 项目数据管理 Hook
 * 提供项目的增删改查功能，并自动持久化到 localStorage
 */
import { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage.js';
import { generateId } from '../utils/uuid.js';

const STORAGE_KEY = 'todo_projects';

export function useProjects() {
  // 项目列表状态 - 使用惰性初始化从 localStorage 读取数据
  const [projects, setProjects] = useState(() => getItem(STORAGE_KEY, []));

  // 当项目数据变化时，持久化到 localStorage
  useEffect(() => {
    setItem(STORAGE_KEY, projects);
  }, [projects]);

  /**
   * 创建新项目
   * @param {string} zoneId - 所属区的 ID
   * @param {string} name - 项目名称
   * @returns {Object} 新创建的项目对象
   */
  const createProject = (zoneId, name) => {
    const newProject = {
      id: generateId(),
      zoneId,
      name,
      createdAt: new Date().toISOString()
    };
    
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  /**
   * 删除项目
   * @param {string} projectId - 项目 ID
   */
  const deleteProject = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  /**
   * 更新项目名称
   * @param {string} projectId - 项目 ID
   * @param {string} newName - 新的项目名称
   */
  const updateProjectName = (projectId, newName) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId ? { ...p, name: newName } : p
      )
    );
  };

  /**
   * 根据区 ID 获取项目列表
   * @param {string} zoneId - 区 ID
   * @returns {Array} 该区下的项目列表
   */
  const getProjectsByZoneId = (zoneId) => {
    return projects.filter(p => p.zoneId === zoneId);
  };

  /**
   * 切换项目完成状态
   * @param {string} projectId - 项目 ID
   */
  const toggleProjectDone = (projectId) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== projectId) return p;
        if (p.done) {
          return { ...p, done: false, doneAt: null };
        } else {
          return { ...p, done: true, doneAt: new Date().toISOString() };
        }
      })
    );
  };

  /**
   * 切换项目置顶状态
   * @param {string} projectId - 项目 ID
   */
  const togglePin = (projectId) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId ? { ...p, pinned: !p.pinned } : p
      )
    );
  };

  /**
   * 更新项目类型
   * @param {string} projectId - 项目 ID
   * @param {string} category - 项目类型：'primary' | 'side' | 'other'
   */
  const updateProjectCategory = (projectId, category) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId ? { ...p, category } : p
      )
    );
  };

  return {
    projects,
    createProject,
    deleteProject,
    updateProjectName,
    getProjectsByZoneId,
    toggleProjectDone,
    togglePin,
    updateProjectCategory
  };
}