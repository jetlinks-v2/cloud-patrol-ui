import { request } from './request'
import type { ConfigEntity } from './types'
export interface PointAssignments { pointId: string; categoryId?: string; assignments: ConfigEntity[] }
export interface RoleRule { roleId: string; levelId?: string; standardId?: string }
const prefix = '/park/patrol/point-assignments'
export const getPointAssignments = (pointIds: string[], categoryId?: string) => request.post<PointAssignments[]>(`${prefix}/_detail`, { pointIds, categoryId })
export const getPointAssignmentSummary = (pointIds: string[]) => request.post<PointAssignments[]>(`${prefix}/_summary`, { pointIds })
export const assignPointRoles = (pointIds: string[], roleIds: string[], categoryId?: string) => request.post(`${prefix}/roles`, { pointIds, roleIds, categoryId })
export const configurePointRules = (pointIds: string[], rules: RoleRule[], categoryId?: string) => request.post(`${prefix}/rules`, { pointIds, rules, categoryId })
export const savePointConfiguration = (pointIds: string[], rules: RoleRule[], categoryId?: string) => request.post(`${prefix}/configuration`, { pointIds, rules, categoryId })
