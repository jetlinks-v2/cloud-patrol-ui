import type { Resource, ConfigEntity } from '../api/types'
import { normalizeItem } from './standards.ts'
import { defaultRule } from './rule-editor.ts'
export const resources: Resource[] = [
  'levels',
  'warnings',
  'categories',
  'points',
  'standards',
  'posts',
  'rosters',
  'plans',
]
export const resourceNames: Record<Resource, string> = {
  levels: 'level',
  tags: 'tag',
  warnings: 'warning',
  categories: 'category',
  points: 'point',
  standards: 'standard',
  posts: 'post',
  rosters: 'roster',
  plans: 'plan',
}
export const resourceTypes: Record<Resource, string> = {
  levels: 'patrolLevel',
  tags: 'patrolTag',
  warnings: 'patrolWarning',
  categories: 'patrolCategory',
  points: 'patrolPoint',
  standards: 'patrolStandard',
  posts: 'patrolPost',
  rosters: 'patrolRoster',
  plans: 'patrolPlan',
}
/** 前端按钮权限按菜单 code 索引，后端资源权限由 baseMenu 的 permissions 映射。 */
export const permission = (resource: Resource) => `patrol/${resource}`
/** 编辑基于副本；枚举对象只取 value 提交，不能把显示对象写回后端枚举。 */
export function draftOf(resource: Resource, source?: ConfigEntity): ConfigEntity {
  const draft: ConfigEntity = source
    ? (JSON.parse(JSON.stringify(source)) as ConfigEntity)
    : { name: '', enabled: true, description: '' }
  if (resource === 'standards') draft.items = (draft.items ?? []).map(normalizeItem)
  if (resource === 'posts') draft.userIds ??= []
  if (resource === 'points') { draft.tagIds ??= []; delete draft.assignedPostIds }
  if (resource === 'warnings') {
    draft.triggerParentCode ??= 'route'
    draft.triggerChildCode ??= 'route_missed_point'
    draft.colorHex ??= '#409EFF'
  }
  if (resource === 'levels') draft.rule ??= defaultRule()
  if (resource === 'plans') {
    draft.rule ??= defaultRule()
    draft.rosterPolicy =
      typeof draft.rosterPolicy === 'object'
        ? draft.rosterPolicy.value
        : draft.rosterPolicy ?? 'optional'
  }
  return draft
}

/** 内部配置没有独立菜单，操作授权归属点位管理的具体按钮。 */
export const savePermission = (resource: Resource) => ({ posts: "patrol/points:posts", plans: "patrol/points:assign", rosters: "patrol/points:importRoster" } as Partial<Record<Resource, string>>)[resource] ?? `${permission(resource)}:save`
