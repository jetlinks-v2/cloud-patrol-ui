import { request as host, type Request } from '@jetlinks-web/core'
import type { Page, PatrolRule } from './types'
export type AuditedConfig = 'levels'
export interface ConfigSnapshot { name: string; enabled: boolean; description?: string | null; rule?: PatrolRule }
export interface ConfigHistory {
  id: string; action: 'create' | 'update'; actorId: string; actorName?: string; createTime: number
  beforeValue?: ConfigSnapshot | null; afterValue: ConfigSnapshot
}
const request: Pick<Request, 'post'> = host
export const configurationHistory = (resource: AuditedConfig, id: string, pageIndex = 0) =>
  request.post<Page<ConfigHistory>>(`/park/patrol/${resource}/${encodeURIComponent(id)}/history/_query`, { pageIndex, pageSize: 10 })
