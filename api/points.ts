import { request } from './request'
import type { Query } from './types'
const prefix = '/park/patrol/points/workbook'
export interface PointImportRow {
  rowNumber: number; categoryId: string; categoryName: string; name: string; location: string; errors: string[]
}
export interface PointImportPreview { rows: PointImportRow[] }
function upload(file: File) { const data = new FormData(); data.append('file', file); return data }
export const previewPointImport = (file: File) => request.post<PointImportPreview>(`${prefix}/preview`, upload(file))
export const importPoints = (file: File) => request.post<number>(`${prefix}/import`, upload(file))
function download(data: ArrayBuffer, name: string) {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a'); link.href = url; link.download = name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function downloadPointTemplate() {
  const response = await request.get<ArrayBuffer>(`${prefix}/template`, {}, { responseType: 'arraybuffer' })
  download(response.data, '巡更点位导入模板.xlsx')
}
export async function exportPoints(query: Query, categoryId?: string) {
  const suffix = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''
  const response = await request.post<ArrayBuffer>(`${prefix}/export${suffix}`, query, { responseType: 'arraybuffer' })
  download(response.data, '巡更点位管理.xlsx')
}
