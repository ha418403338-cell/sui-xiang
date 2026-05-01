/**
 * Streak 打卡逻辑 Hook
 * 处理工作区达标型 streak 和推进区打卡型 streak
 */
import { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage.js';
import { getTodayString } from '../utils/dateUtils.js';

const STORAGE_KEY_WORK = 'todo_streak_work';
const STORAGE_KEY_ADVANCE = 'todo_streak_advance';

/**
 * 计算连续天数
 * @param {Array} records - 打卡记录数组
 * @param {string} today - 今天的日期字符串 (YYYY-MM-DD)
 * @param {string} checkField - 检查字段名 ('achieved' 或 'checked')
 * @returns {number} 连续天数
 */
const calculateStreak = (records, today, checkField) => {
  const recordsMap = new Map();
  records.forEach(record => {
    recordsMap.set(record.date, record[checkField]);
  });

  let streak = 0;
  let currentDate = new Date(today);
  
  // 从昨天开始往前计算，今天不影响连续记录
  currentDate.setDate(currentDate.getDate() - 1);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (recordsMap.get(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

/**
 * 检查并更新当天的记录
 * @param {Array} records - 现有记录
 * @param {string} today - 今天的日期
 * @param {boolean} status - 状态
 * @param {string} checkField - 检查字段名
 * @returns {Array} 更新后的记录
 */
const updateTodayRecord = (records, today, status, checkField) => {
  const existingIndex = records.findIndex(r => r.date === today);
  const newRecord = { date: today, [checkField]: status };
  
  if (existingIndex >= 0) {
    // 更新现有记录
    const updated = [...records];
    updated[existingIndex] = newRecord;
    return updated;
  } else {
    // 添加新记录
    return [...records, newRecord];
  }
};

export function useStreak(tasks) {
  const today = getTodayString();
  
  // 工作区 streak 记录
  const [workStreakRecords, setWorkStreakRecords] = useState(() => 
    getItem(STORAGE_KEY_WORK, [])
  );
  
  // 推进区 streak 记录
  const [advanceStreakRecords, setAdvanceStreakRecords] = useState(() => 
    getItem(STORAGE_KEY_ADVANCE, [])
  );

  // 计算工作区今天是否达标（完成任务数 ≥ 2）
  const workCompletedToday = tasks.filter(task => {
    return task.zoneId === 'work' && task.done && task.doneAt &&
           new Date(task.doneAt).toISOString().split('T')[0] === today;
  }).length;
  
  const workAchievedToday = workCompletedToday >= 2;

  // 计算推进区今天是否打卡（任何任务完成）
  const advanceCheckedToday = tasks.some(task => {
    return task.zoneId === 'advance' && task.done && task.doneAt &&
           new Date(task.doneAt).toISOString().split('T')[0] === today;
  });

  // 更新工作区 streak 记录
  useEffect(() => {
    const updatedRecords = updateTodayRecord(
      workStreakRecords, 
      today, 
      workAchievedToday, 
      'achieved'
    );
    setWorkStreakRecords(updatedRecords);
    setItem(STORAGE_KEY_WORK, updatedRecords);
  }, [workAchievedToday, today]);

  // 更新推进区 streak 记录
  useEffect(() => {
    const updatedRecords = updateTodayRecord(
      advanceStreakRecords, 
      today, 
      advanceCheckedToday, 
      'checked'
    );
    setAdvanceStreakRecords(updatedRecords);
    setItem(STORAGE_KEY_ADVANCE, updatedRecords);
  }, [advanceCheckedToday, today]);

  // 计算连续天数
  const workStreak = calculateStreak(workStreakRecords, today, 'achieved');
  const advanceStreak = calculateStreak(advanceStreakRecords, today, 'checked');

  return {
    workStreak,
    advanceStreak,
    workAchievedToday,
    advanceCheckedToday
  };
}
