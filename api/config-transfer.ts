import { request } from './request'
import type { Query } from './types'
export type ExportableConfig = 'levels' | 'standards' | 'tags'
const names: Record<ExportableConfig, string> = { levels: '点位等级', standards: '巡更标准', tags: '巡更标签' }
export async function exportConfiguration(resource: ExportableConfig, query: Query) {
  const response = await request.post<ArrayBuffer>(`/park/patrol/${resource}/_export`, query, { responseType: 'arraybuffer' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a'); link.href = url; link.download = `${names[resource]}.xlsx`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
