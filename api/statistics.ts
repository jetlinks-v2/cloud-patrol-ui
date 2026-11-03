import { request as host, type Request } from '@jetlinks-web/core'
const request: Pick<Request, 'get' | 'post'> = host
export interface StatisticsRow {
  id: string; name: string; pointCount: number; taskCount: number; completedTasks: number
  expected: number; completed: number; missing: number; coverage: number; qualification: number
}
export const queryStatistics = (people: boolean, from: string, to: string, categoryIds: string[]) =>
  request.post<StatisticsRow[]>(`/park/patrol/statistics/${people ? 'people' : 'points'}`, { from, to, categoryIds })
