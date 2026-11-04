import { request } from './request'
import type { Resource } from './types'
export type RemovableConfig = 'levels' | 'standards' | 'warnings'
export const canDeleteConfiguration = (resource: Resource): resource is RemovableConfig =>
  resource === 'levels' || resource === 'standards' || resource === 'warnings'
/** 独立逻辑删除接口，不借用保存或停用接口。 */
export const deleteConfiguration = (resource: RemovableConfig, id: string) =>
  request.remove<void>(`/park/patrol/${resource}/${encodeURIComponent(id)}`)
