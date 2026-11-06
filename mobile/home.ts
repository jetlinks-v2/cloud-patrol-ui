import type { MobileTask } from './model'
export type HomeTaskState = 'ready' | 'cooldown' | 'completed'

/** 首页数字和下钻列表使用同一筛选：今日完成保留已结束时段，避免点击后数字有值却没有记录。 */
export function homeTasks(rows: MobileTask[], date: string, now: number, state: HomeTaskState): MobileTask[] {
  if (state === 'completed') return rows.filter(row => (row.task.belongDate || row.task.businessDate) === date
    && row.task.completedCount >= row.task.requiredCount)
  return rows.filter(row => row.task.startTime <= now && now < row.task.endTime
    && (state === 'ready' ? row.executable : row.reason === 'error.patrol.execution.cooldown'))
}

/** 沿用小程序按真实时段任务计数的口径，不将多个角色、时段误合并成一项。 */
export function homeSummary(rows: MobileTask[], date: string, now: number) {
  return {
    ready: homeTasks(rows, date, now, 'ready').length,
    cooldown: homeTasks(rows, date, now, 'cooldown').length,
    completed: homeTasks(rows, date, now, 'completed').length,
  }
}
