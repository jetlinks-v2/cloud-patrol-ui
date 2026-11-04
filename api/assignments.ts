import { request as host, type Request } from '@jetlinks-web/core'
const request: Pick<Request, 'post'> = host
import type { ConfigEntity } from './types'
export interface PointAssignments { pointId: string; categoryId?: string; assignments: ConfigEntity[] }
export interface PostRule { postId: string; levelId?: string; standardId?: string }
const prefix = '/park/patrol/point-assignments'
export const getPointAssignments = (pointIds: string[], categoryId?: string) => request.post<PointAssignments[]>(`${prefix}/_detail`, { pointIds, categoryId })
export const getPointAssignmentSummary = (pointIds: string[]) => request.post<PointAssignments[]>(`${prefix}/_summary`, { pointIds })
export const assignPointPosts = (pointIds: string[], postIds: string[], categoryId?: string) => request.post(`${prefix}/posts`, { pointIds, postIds, categoryId })
export const configurePointRules = (pointIds: string[], rules: PostRule[], categoryId?: string) => request.post(`${prefix}/rules`, { pointIds, rules, categoryId })
