import { useMemo } from 'react';
import { getItem } from '../utils/storage.js';
import { getTodayString, getWeekStartEnd } from '../utils/dateUtils.js';
import './WeekReview.css';

const STORAGE_KEY_WORK = 'todo_streak_work';
const STORAGE_KEY_ADVANCE = 'todo_streak_advance';

/**
 * 计算连续天数（从指定日期往前计算）
 * @param {Array} records - 打卡记录数组
 * @param {string} today - 结束的日期字符串 (YYYY-MM-DD)
 * @param {string} checkField - 检查字段名 ('achieved' 或 'checked')
 * @returns {number} 连续天数
 */
const calculateLongestStreak = (records, endDate, checkField) => {
  const recordsMap = new Map();
  records.forEach(record => {
    recordsMap.set(record.date, record[checkField]);
  });

  let longestStreak = 0;
  let currentStreak = 0;
  let currentDate = new Date(endDate);
  currentDate.setDate(currentDate.getDate() - 1);

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (recordsMap.get(dateStr)) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return longestStreak;
};

/**
 * 周回顾小结页面
 * 展示本周（周一到今天）的任务完成情况统计
 */
function WeekReview({ projects, tasks }) {
  const today = getTodayString();
  const { weekStart, weekEnd } = getWeekStartEnd();

  // 从 localStorage 获取 streak 记录
  const workStreakRecords = getItem(STORAGE_KEY_WORK, []);
  const advanceStreakRecords = getItem(STORAGE_KEY_ADVANCE, []);

  // 计算本周数据
  const weekData = useMemo(() => {
    // 本周完成的任务
    const weekTasks = tasks.filter(task => {
      if (!task.done || !task.doneAt) return false;
      const doneDate = new Date(task.doneAt).toISOString().split('T')[0];
      return doneDate >= weekStart && doneDate <= today;
    });

    // 工作区本周完成的任务
    const workTasks = weekTasks.filter(t => t.zoneId === 'work');

    // 推进区本周完成的任务
    const advanceTasks = weekTasks.filter(t => t.zoneId === 'advance');

    // 兴趣区本周完成的任务
    const interestTasks = weekTasks.filter(t => t.zoneId === 'interest');

    // 本周打卡天数（推进区有任务完成的天数）
    const advanceCheckInDays = new Set();
    advanceTasks.forEach(t => {
      const doneDate = new Date(t.doneAt).toISOString().split('T')[0];
      advanceCheckInDays.add(doneDate);
    });

    // 计算工作区本周最长连续达标天数
    let maxWorkStreak = 0;
    let tempWorkStreak = 0;
    let checkDate = new Date(weekStart);
    while (checkDate <= new Date(today)) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayWorkTasks = weekTasks.filter(t => {
        if (t.zoneId !== 'work') return false;
        const doneDate = new Date(t.doneAt).toISOString().split('T')[0];
        return doneDate === dateStr;
      });
      if (dayWorkTasks.length >= 2) {
        tempWorkStreak++;
        maxWorkStreak = Math.max(maxWorkStreak, tempWorkStreak);
      } else {
        tempWorkStreak = 0;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    // 计算推进区本周最长连续打卡天数
    let maxAdvanceStreak = 0;
    let tempAdvanceStreak = 0;
    checkDate = new Date(weekStart);
    while (checkDate <= new Date(today)) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasAdvanceTask = advanceTasks.some(t => {
        const doneDate = new Date(t.doneAt).toISOString().split('T')[0];
        return doneDate === dateStr;
      });
      if (hasAdvanceTask) {
        tempAdvanceStreak++;
        maxAdvanceStreak = Math.max(maxAdvanceStreak, tempAdvanceStreak);
      } else {
        tempAdvanceStreak = 0;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }

    // 按项目统计完成数量和时长
    const projectStats = {};
    weekTasks.forEach(task => {
      if (!projectStats[task.projectId]) {
        projectStats[task.projectId] = {
          count: 0,
          minutes: 0
        };
      }
      projectStats[task.projectId].count++;
      projectStats[task.projectId].minutes += task.actualMin || 0;
    });

    // Top3 项目（按完成数量）
    const topProjectsByCount = Object.entries(projectStats)
      .map(([projectId, stats]) => ({
        projectId,
        projectName: projects.find(p => p.id === projectId)?.name || '未分类',
        count: stats.count,
        minutes: stats.minutes
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Top3 项目（按时长）
    const topProjectsByMinutes = Object.entries(projectStats)
      .map(([projectId, stats]) => ({
        projectId,
        projectName: projects.find(p => p.id === projectId)?.name || '未分类',
        count: stats.count,
        minutes: stats.minutes
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);

    // 总计
    const totalCount = weekTasks.length;
    const totalMinutes = weekTasks.reduce((sum, t) => sum + (t.actualMin || 0), 0);

    return {
      workCount: workTasks.length,
      advanceCount: advanceTasks.length,
      interestCount: interestTasks.length,
      advanceCheckInDays: advanceCheckInDays.size,
      maxWorkStreak,
      maxAdvanceStreak,
      topProjectsByCount,
      topProjectsByMinutes,
      totalCount,
      totalMinutes
    };
  }, [tasks, projects, weekStart, today]);

  return (
    <div className="week-review-page">
      <h1 className="page-title">周回顾小结</h1>
      <p className="week-range">{weekStart} ~ {today}</p>

      {/* 卡片区域 */}
      <div className="cards-grid">
        {/* 工作区卡片 */}
        <div className="review-card work-card">
          <h2 className="card-title">💼 工作区</h2>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">{weekData.workCount}</span>
              <span className="stat-label">本周完成</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{weekData.maxWorkStreak}</span>
              <span className="stat-label">最长连续达标</span>
            </div>
          </div>
        </div>

        {/* 推进区卡片 */}
        <div className="review-card advance-card">
          <h2 className="card-title">🚀 推进区</h2>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">{weekData.advanceCheckInDays}</span>
              <span className="stat-label">本周打卡</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{weekData.maxAdvanceStreak}</span>
              <span className="stat-label">最长连续打卡</span>
            </div>
          </div>
        </div>

        {/* 兴趣区卡片 */}
        <div className="review-card interest-card">
          <h2 className="card-title">🎯 兴趣区</h2>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">{weekData.interestCount}</span>
              <span className="stat-label">本周完成</span>
            </div>
            <div className="stat-item">
              <span className={`stat-value ${weekData.interestCount >= 2 ? 'achieved' : ''}`}>
                {weekData.interestCount >= 2 ? '✅ 达标' : '💪 加油'}
              </span>
              <span className="stat-label">本周目标 ≥2</span>
            </div>
          </div>
        </div>

        {/* 总计卡片 */}
        <div className="review-card total-card">
          <h2 className="card-title">📊 本周总计</h2>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">{weekData.totalCount}</span>
              <span className="stat-label">完成任务</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{weekData.totalMinutes}</span>
              <span className="stat-label">累计时长（分钟）</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 榜单 */}
      <div className="rankings-section">
        {/* Top3 项目（按完成数量） */}
        <div className="ranking-card">
          <h3 className="ranking-title">🏆 完成任务 Top3</h3>
          {weekData.topProjectsByCount.length > 0 ? (
            <ul className="ranking-list">
              {weekData.topProjectsByCount.map((item, index) => (
                <li key={item.projectId} className="ranking-item">
                  <span className="rank-number">{index + 1}</span>
                  <span className="rank-name">{item.projectName}</span>
                  <span className="rank-value">{item.count} 条</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">暂无数据</p>
          )}
        </div>

        {/* Top3 项目（按时长） */}
        <div className="ranking-card">
          <h3 className="ranking-title">⏱ 累计时长 Top3</h3>
          {weekData.topProjectsByMinutes.length > 0 ? (
            <ul className="ranking-list">
              {weekData.topProjectsByMinutes.map((item, index) => (
                <li key={item.projectId} className="ranking-item">
                  <span className="rank-number">{index + 1}</span>
                  <span className="rank-name">{item.projectName}</span>
                  <span className="rank-value">{item.minutes} 分钟</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeekReview;
