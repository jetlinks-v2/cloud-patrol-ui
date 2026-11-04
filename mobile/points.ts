import type { ConfigEntity } from '../api/types'
import type { MobileTask } from './model'
export interface PointGroup { id: string; name: string; rows: MobileTask[]; state: 'ready' | 'cooldown' | 'completed' | 'unavailable' }

/** 与旧员工端一致，只展示当前时间窗；同一点位的岗位/时段保留在详情，不随意选一个任务提交。 */
export function pointGroups(rows: MobileTask[], keyword: string, category: string, categories: ConfigEntity[], now = Date.now()): PointGroup[] {
  const groups = new Map<string, PointGroup>()
  for (const row of rows) {
    const task = row.task, name = task.pointName || task.name
    if (now < task.startTime || now >= task.endTime || !name.toLocaleLowerCase().includes(keyword.trim().toLocaleLowerCase())
      || !withinCategory(task.categoryId, category, categories)) continue
    const group = groups.get(task.pointId) || { id: task.pointId, name, rows: [], state: 'unavailable' }
    group.rows.push(row); groups.set(task.pointId, group)
  }
  for (const group of groups.values()) {
    group.state = group.rows.some(row => row.executable) ? 'ready'
      : group.rows.every(row => row.task.completedCount >= row.task.requiredCount) ? 'completed'
      : group.rows.some(row => row.reason === 'error.patrol.execution.cooldown') ? 'cooldown' : 'unavailable'
  }
  return [...groups.values()]
}
function withinCategory(id: string | undefined, selected: string, categories: ConfigEntity[]): boolean {
  if (!selected) return true
  const seen = new Set<string>()
  while (id && !seen.has(id)) {
    if (id === selected) return true
    seen.add(id); id = categories.find(item => item.id === id)?.parentId
  }
  return false
}
