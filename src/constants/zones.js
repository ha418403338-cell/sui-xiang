/**
 * 三个区的固定配置（不可修改 id 值）
 * id: 区唯一标识
 * name: 区显示名称
 * dailyGoal: 每日目标描述文字
 * goalType: 目标类型
 * goalValue: 目标数值（部分区有）
 */
export const ZONES = [
  {
    id: 'work',
    name: '工作区',
    dailyGoal: '今日建议完成 2–3 条',
    goalType: 'daily_count',
    goalValue: 2
  },
  {
    id: 'advance',
    name: '推进区',
    dailyGoal: '今日哪怕推进 1 分钟',
    goalType: 'daily_checkin'
  },
  {
    id: 'interest',
    name: '兴趣区',
    dailyGoal: '本周至少完成 2 次',
    goalType: 'weekly_count',
    goalValue: 2
  },
];