import { request } from './request'
import type { ConfigEntity, Resource, Query, Page, Task, TaskGroup, Execution, Person, Answer, AttachmentReceipt, CollectionMetadata } from './types'
import { selectedProject } from '../composables/useProjects'
import { waitForRecordExport, type RecordExportStatus } from '../model/record-export'
const prefix = '/park/patrol'
// 编辑表单可以独立选择所属项目，显式项目优先于列表筛选。
const projectOptions = (projectId?: string) => projectId ? { headers: { 'X-Patrol-Project': projectId } } : undefined
// 保留宿主响应用于 ProTable；普通动作只解包 result，不再重复触发全局错误提示。
export const queryConfig = (resource: Resource, query: Query, projectId?: string) =>
  // 候选与名称回显只读取角色，不因不需要的成员查询而依赖 user 数据权限。
  request.post<Page<ConfigEntity>>(`${prefix}/${resource}/_query${resource === 'roles' ? '?includeMembers=false' : ''}`, query, resource === 'roles' ? undefined : projectOptions(projectId))
export const saveConfig = (resource: Resource, value: ConfigEntity) =>
  value.id
    ? request.put<ConfigEntity>(`${prefix}/${resource}/${encodeURIComponent(value.id)}`, value, projectOptions(value.projectId))
    : request.post<ConfigEntity>(`${prefix}/${resource}`, value, projectOptions(value.projectId))
export const getConfig = (resource: Resource, id: string) =>
  request.get<ConfigEntity>(`${prefix}/${resource}/${encodeURIComponent(id)}`)
export const queryPeople = (query: Query, projectId?: string) =>
  request.post<Page<Person>>(`${prefix}/persons/_query`, query, projectOptions(projectId))
export const queryTasks = (query: Query) =>
  request.post<Page<Task>>(`${prefix}/tasks/_query`, query)
export const queryRecordPeriods = (query: Query) =>
  request.post<Page<Task>>(`${prefix}/record-periods/_query`, query)
export const queryTaskGroups = (query: Query, options?: { signal?: AbortSignal }) =>
  request.post<Page<TaskGroup>>(`${prefix}/task-groups/_query`, query, options)
/** 当前条件完整导出，由后端统一处理权限和数量上限。 */
export async function exportTaskGroups(query: Query, progress?: (status: RecordExportStatus) => void) {
  // 固定点击导出时的项目上下文，避免等待期间切换筛选导致找不到任务或下载范围变化。
  const options = { timeout: 0, headers: { 'X-Patrol-Project': selectedProject() || '' } }
  const created = await request.post<RecordExportStatus>(`${prefix}/task-groups/export-jobs`, query, options)
  if (!created.success) throw new Error('error.patrol_record_export_failed')
  const id = await waitForRecordExport(created.result, async jobId => {
    const response = await request.get<RecordExportStatus>(`${prefix}/task-groups/export-jobs/${encodeURIComponent(jobId)}`, undefined, options)
    if (!response.success) throw new Error('error.patrol_record_export_failed')
    return response.result
  }, progress)
  const response = await request.get<ArrayBuffer>(`${prefix}/task-groups/export-jobs/${encodeURIComponent(id)}/file`, undefined,
    { ...options, responseType: 'arraybuffer' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = '点位巡更记录.xlsx'; document.body.appendChild(anchor); anchor.click(); anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
export const queryExecutions = (query: Query) =>
  request.post<Page<Execution>>(`${prefix}/executions/_query`, query)
export const previewTasks = (planId: string, date: string) =>
  request.post<Task[]>(`${prefix}/tasks/_preview`, { planId, date })
export const generateTasks = (planId: string, date: string) =>
  request.post<Task[]>(`${prefix}/tasks/_generate`, { planId, date })
export const submitExecution = (value: CollectionMetadata & {
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

export const uploadImage = (file: File, purpose: 'example' | 'evidence' = 'example', projectId?: string) => {
  const body = new FormData()
  body.append('file', file)
  return request.post<AttachmentReceipt>(`${prefix}/attachments/${purpose}`, body, projectOptions(projectId))
}
export const previewImage = (id: string, projectId?: string) =>
  request.get<{ dataUrl: string }>(`${prefix}/attachments/${encodeURIComponent(id)}/preview`, undefined, projectOptions(projectId))
