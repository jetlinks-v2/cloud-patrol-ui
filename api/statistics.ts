import { request as host, type Request } from '@jetlinks-web/core'
const request: Pick<Request, 'get' | 'post'> = host
export interface StatisticsRow {
  id: string; name: string; pointCount: number; taskCount: number; completedTasks: number
  expected: number; completed: number; missing: number; coverage: number; qualification: number
}
export interface StatisticsReport { from: string; to: string; rows: StatisticsRow[]; total: StatisticsRow }
export const queryStatistics = (people: boolean, from: string, to: string, categoryIds: string[]) =>
  request.post<StatisticsReport>(`/park/patrol/statistics/${people ? 'people' : 'points'}/report`, { from, to, categoryIds })
/** 使用与查询相同的完整筛选，不导出当前分页或旧一次请求的数据。 */
export async function exportStatistics(people: boolean, qualification: boolean, from: string, to: string, categoryIds: string[]) {
  const response = await request.post<ArrayBuffer>(
    `/park/patrol/statistics/${people ? 'people' : 'points'}/export?qualification=${qualification}`,
    { from, to, categoryIds }, { responseType: 'arraybuffer' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = `${from}_${to}-patrol-${people ? 'posts' : qualification ? 'qualification' : 'coverage'}.xlsx`; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
