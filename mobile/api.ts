import type { Execution, Page, Query, AttachmentReceipt, ConfigEntity } from '../api/types'
import type { MobileTask, Submission } from './model'
import { request } from './transport'
export const myTasks = (date: string, mine = true) => request<MobileTask[]>('/park/patrol/mobile/tasks/_query', 'POST', { date, mine })
export const categories = () => request<Page<ConfigEntity>>('/park/patrol/categories/_query', 'POST', { pageSize: 200, sorts: [{ name: 'name', order: 'asc' }] })
export const myHistory = (query: Query) => request<Page<Execution>>('/park/patrol/mobile/history/_query', 'POST', query)
export const submit = (body: Submission) => request<Execution>('/park/patrol/executions', 'POST', body)
export const upload = (file: File) => {
  const body = new FormData(); body.append('file', file)
  return request<AttachmentReceipt>('/park/patrol/attachments/evidence', 'POST', body)
}
export const preview = (id: string) => request<{ dataUrl: string }>(`/park/patrol/attachments/${encodeURIComponent(id)}/preview`, 'GET')
