import type { Task } from '../api/types'

export interface CalendarPoint {
  key: string; pointName: string; projectName?: string; roles: string[]; allStaff: boolean; tasks: Task[]
  missed: boolean; absent: boolean; status: 'completed' | 'partial' | 'pending' | 'unvisited'
}
/** 一日内跨角色、跨任务组按项目和点位合并；全部角色完成才算完成，部分完成可同时有漏检。 */
export function calendarPoints(tasks: Task[], now = Date.now()): CalendarPoint[] {
  const groups = new Map<string, Task[]>()
  for (const task of tasks) {
    const key = JSON.stringify([task.projectId ?? null, task.pointId])
    const rows = groups.get(key) ?? []
    rows.push(task); groups.set(key, rows)
  }
  return [...groups].map(([key, rows]) => {
    const visited = rows.some(row => Math.min(row.requiredCount, row.completedCount) > 0)
    const complete = rows.every(row => row.completedCount >= row.requiredCount)
    return { key, pointName: rows[0].pointName, projectName: rows[0].projectName,
      roles: [...new Set(rows.map(row => row.roleName).filter(Boolean))], tasks: rows,
      allStaff: rows.some(row => row.roleId === ''),
      missed: visited && rows.some(row => row.completedCount < row.requiredCount && row.endTime <= now),
      absent: !visited && !complete && rows.every(row => row.endTime <= now),
      status: complete ? 'completed'
        : visited ? 'partial' : rows.every(row => row.startTime > now) ? 'pending' : 'unvisited',
    }
  })
}
