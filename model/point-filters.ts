import type { Term } from '../api/types'
/** 标签、岗位采用后端标准 termType；筛选作用于全量查询，不过滤当前页。 */
export function pointTagsTerm(value: unknown, excluded: boolean) {
  return { column: 'tagIds', termType: `patrol-point-tags${excluded ? '$not' : ''}`, value } satisfies Term
}
export function pointRolesTerm(value: unknown, excluded: boolean) {
  return { column: 'id', termType: `patrol-point-plan${excluded ? '$not' : ''}`, value: { 'roleId$in': value, enabled: true } } satisfies Term
}
