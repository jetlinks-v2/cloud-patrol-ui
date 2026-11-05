import { request } from './request'
import type { ConfigEntity, Task } from './types'
export interface CalendarSummary {
  scheduledDayCount: number; totalDayCount: number; staffCount: number; rosterCount: number
  taskCount: number; expectedCount: number; completedCount: number; missedCount: number
  pendingTaskCount: number; ongoingTaskCount: number; completedTaskCount: number; abnormalTaskCount: number
  pointCount: number; completedPointCount: number; missedPointCount: number; absentPointCount: number
}
export interface CalendarDay {
  date: string; staffCount: number; taskCount: number; expectedCount: number
  completedCount: number; missedCount: number; status: string
  pointCount: number; completedPointCount: number; missedPointCount: number; absentPointCount: number
  shifts: { name: string; startTime: number; endTime: number; staffCount: number }[]
}
export interface CalendarMonth { month: string; summary: CalendarSummary; days: CalendarDay[] }
export interface CalendarDetail {
  date: string; staffCount: number; shiftCount: number; pointCount: number
  expectedCount: number; completedCount: number; missedCount: number
  completedPointCount: number; missedPointCount: number; absentPointCount: number
  staff: ConfigEntity[]; tasks: Task[]; staffTelephones?: Record<string, string>
}
export const calendarMonth = (month: string) => request.get<CalendarMonth>('/park/patrol/calendar/month', { month })
export const calendarDay = (date: string) => request.get<CalendarDetail>('/park/patrol/calendar/day', { date })
export async function exportCalendarDay(date: string) {
  const response = await request.get<ArrayBuffer>('/park/patrol/calendar/day/export', { date }, { responseType: 'arraybuffer' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = `${date}-patrol.xlsx`; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
