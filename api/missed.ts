import { request } from './request'
import type { MissedItem, MissedEvent } from '../model/missed'
import { missedDecisions } from '../model/missed'
const prefix = '/park/patrol/missed'
export const groupMissed = (taskGroupId: string) => request.post<MissedItem[]>(`${prefix}/group`, { taskGroupId })
export const applyMissed = (itemIds: string[], reason: string) => request.post<number>(`${prefix}/apply`, { itemIds, reason })
export const auditMissed = (items: MissedItem[], approved: boolean, remark: string) => request.post<number>(`${prefix}/audit`, { items: missedDecisions(items), approved, remark })
export const withdrawMissed = (item: MissedItem) => request.post<number>(`${prefix}/withdraw`, { itemId: item.id, applicationId: item.applicationId })
export const missedHistory = (id: string) => request.get<MissedEvent[]>(`${prefix}/${encodeURIComponent(id)}/history`)
