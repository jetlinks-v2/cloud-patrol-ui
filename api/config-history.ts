import { request } from './request'
import type { Page, PatrolRule } from './types'
export type AuditedConfig = 'levels'
export interface ConfigSnapshot { name: string; enabled: boolean; description?: string | null; rule?: PatrolRule }
export interface ConfigHistory {
  id: string; action: 'create' | 'update'; actorId: string; actorName?: string; createTime: number
  beforeValue?: ConfigSnapshot | null; afterValue: ConfigSnapshot
}
export const configurationHistory = (resource: AuditedConfig, id: string, pageIndex = 0) =>
  request.post<Page<ConfigHistory>>(`/park/patrol/${resource}/${encodeURIComponent(id)}/history/_query`, { pageIndex, pageSize: 10 })
