import { request } from './request'
import type { Task, Execution, Page } from './types'
export interface StatisticsCounts {
  expected: number; completed: number; executed: number; credited: number; overdue: number; notDue: number
  pointDays: number; completedPoints: number; missedPoints: number; absentPoints: number
  pendingPoints: number; ongoingPoints: number; abnormalPoints: number
  dueExpected: number; dueCompleted: number
  progressRate: number | null; dueFulfillmentRate: number | null
}
export type StatisticsMetric = 'all' | 'completed' | 'finished' | 'due' | 'overdue' | 'notDue' | 'missed' | 'absent' | 'anomaly' | 'pending' | 'ongoing'
export interface StatisticsRange { from: string; to: string; categoryIds: string[]; levelIds: string[]; projectId?: string }
export interface StatisticsPointDay {
  id: string; projectId: string; projectName: string; pointId: string; pointName: string; date: string
  categoryNames: string[]; levelNames: string[]; groupIds: string[]; state: string; counts: StatisticsCounts
}
export interface StatisticsReport {
  from: string; to: string; generatedAt: number; total: StatisticsCounts
  projects: {projectId: string; projectName: string; counts: StatisticsCounts}[]
  days: {date: string; counts: StatisticsCounts}[]
  people: {userId: string; userName: string; executionCount: number; abnormalCount: number; pointCount: number; lastTime: number}[]
}
export interface StatisticsDetail { periods: Task[]; executions: Execution[] }
export const queryStatistics = (range: StatisticsRange) => request.post<StatisticsReport>('/park/patrol/statistics/overview', range)
export const queryStatisticsTasks = (range: StatisticsRange, metric: StatisticsMetric, pageIndex: number, pageSize: number) =>
  request.post<Page<StatisticsPointDay>>('/park/patrol/statistics/overview/tasks', {range, metric, pageIndex, pageSize})
export const queryStatisticsDetail = (range: StatisticsRange, pointId: string) =>
  request.post<StatisticsDetail>('/park/patrol/statistics/overview/detail', {range, pointId})
/** 同一筛选快照导出完整数据；不使用当前表格页拼装。 */
export async function exportStatistics(range: StatisticsRange) {
  const response = await request.post<ArrayBuffer>('/park/patrol/statistics/overview/export', range, {responseType: 'arraybuffer'})
  const url = URL.createObjectURL(new Blob([response.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = `${range.from}_${range.to}-patrol-statistics.xlsx`; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
