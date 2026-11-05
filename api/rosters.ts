import { request } from './request'
export async function downloadRosterTemplate(month: string, projectId: string) {
  const response = await request.get<ArrayBuffer>('/park/patrol/rosters/month/template', { month }, { responseType: 'arraybuffer', headers: { 'X-Patrol-Project': projectId } })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const link = document.createElement('a')
  link.href = url; link.download = `${month}-roster.xlsx`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export const importRosterMonth = (month: string, file: File, projectId: string) => {
  const data = new FormData(); data.append('file', file)
  return request.post<number>(`/park/patrol/rosters/month/import?month=${encodeURIComponent(month)}`, data, { headers: { 'X-Patrol-Project': projectId } })
}
