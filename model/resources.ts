import type { Resource, ConfigEntity } from '../api/types'
export const resources: Resource[] = [
  'categories',
  'points',
  'standards',
  'posts',
  'rosters',
  'plans',
]
export const resourceNames: Record<Resource, string> = {
  categories: 'category',
  points: 'point',
  standards: 'standard',
  posts: 'post',
  rosters: 'roster',
  plans: 'plan',
}
export const resourceTypes: Record<Resource, string> = {
  categories: 'patrolCategory',
  points: 'patrolPoint',
  standards: 'patrolStandard',
  posts: 'patrolPost',
  rosters: 'patrolRoster',
  plans: 'patrolPlan',
}
export const permission = (resource: Resource) => `patrol-${resourceNames[resource]}`
/** 编辑基于副本；枚举对象只取 value 提交，不能把显示对象写回后端枚举。 */
export function draftOf(resource: Resource, source?: ConfigEntity): ConfigEntity {
  const draft: ConfigEntity = source
    ? (JSON.parse(JSON.stringify(source)) as ConfigEntity)
    : { name: '', enabled: true, description: '' }
  if (resource === 'standards') draft.items ??= []
  if (resource === 'posts') draft.userIds ??= []
  if (resource === 'plans') {
    draft.rule ??= { weekly: {}, dates: {}, cooldownMinutes: 0 }
    draft.rosterPolicy =
      typeof draft.rosterPolicy === 'object'
        ? draft.rosterPolicy.value
        : draft.rosterPolicy ?? 'optional'
  }
  return draft
}
