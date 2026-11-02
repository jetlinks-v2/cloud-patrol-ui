import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import type { Task } from '../api/types'
dayjs.extend(utc)
/** 与后端规则一致，业务时间采用 Asia/Shanghai（UTC+08:00），不随浏览器时区漂移。 */
export const businessTime = (value?: number) => dayjs(value).utcOffset(480)
export const dateTime = (value?: number) =>
  value == null ? '—' : businessTime(value).format('YYYY-MM-DD HH:mm:ss')
/** 状态来自应巡事实和当前时钟，不向数据库写一个会随时间过期的“进行中”。 */
export function taskState(
  task: Task,
  now = Date.now()
): 'completed' | 'pending' | 'missed' | 'running' {
  if (task.completedCount >= task.requiredCount) return 'completed'
  if (now < task.startTime) return 'pending'
  return now >= task.endTime ? 'missed' : 'running'
}
