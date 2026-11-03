import { request as host, type Request } from '@jetlinks-web/core'
import type { ConfigEntity, Resource, Query, Page, Task, TaskGroup, Execution, Person, Answer, AttachmentReceipt } from './types'
const request: Pick<Request, 'get' | 'post' | 'put'> = host
const prefix = '/park/patrol'
// 保留宿主响应用于 ProTable；普通动作只解包 result，不再重复触发全局错误提示。
export const queryConfig = (resource: Resource, query: Query) =>
  request.post<Page<ConfigEntity>>(`${prefix}/${resource}/_query`, query)
export const saveConfig = (resource: Resource, value: ConfigEntity) =>
  value.id
    ? request.put<ConfigEntity>(`${prefix}/${resource}/${encodeURIComponent(value.id)}`, value)
    : request.post<ConfigEntity>(`${prefix}/${resource}`, value)
export const getConfig = (resource: Resource, id: string) =>
  request.get<ConfigEntity>(`${prefix}/${resource}/${encodeURIComponent(id)}`)
export const queryPeople = (query: Query) =>
  request.post<Page<Person>>(`${prefix}/persons/_query`, query)
export const queryTasks = (query: Query) =>
  request.post<Page<Task>>(`${prefix}/tasks/_query`, query)
export const queryRecordPeriods = (query: Query) =>
  request.post<Page<Task>>(`${prefix}/record-periods/_query`, query)
export const queryTaskGroups = (query: Query) =>
  request.post<Page<TaskGroup>>(`${prefix}/task-groups/_query`, query)
export const queryExecutions = (query: Query) =>
  request.post<Page<Execution>>(`${prefix}/executions/_query`, query)
export const previewTasks = (planId: string, date: string) =>
  request.post<Task[]>(`${prefix}/tasks/_preview`, { planId, date })
export const generateTasks = (planId: string, date: string) =>
  request.post<Task[]>(`${prefix}/tasks/_generate`, { planId, date })
export const submitExecution = (value: {
  taskId: string
  requestId: string
  answers: Answer[]
  remark?: string
}) => request.post<Execution>(`${prefix}/executions`, value)

export interface Summary {
  windows: number
  expected: number
  completed: number
  completeWindows: number
  overdueMissing: number
}
export const reportSummary = (from: string, to: string) =>
  request.post<Summary>(`${prefix}/reports/summary`, { from, to })

export const uploadImage = (file: File, purpose: 'example' | 'evidence' = 'example') => {
  const body = new FormData()
  body.append('file', file)
  return request.post<AttachmentReceipt>(`${prefix}/attachments/${purpose}`, body)
}
export const previewImage = (id: string) =>
  request.get<{ dataUrl: string }>(`${prefix}/attachments/${encodeURIComponent(id)}/preview`)
