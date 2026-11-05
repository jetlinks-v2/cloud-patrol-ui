import type { PointAssignments, RoleRule } from '../api/assignments'
/** 批量规则只在岗位集合相同时回填第一点位；各点位原规则可以不同，保存统一覆盖。 */
export function assignmentDraft(details: PointAssignments[]) {
  const first = details[0]?.assignments ?? []
  const roleIds = first.map(row => row.roleId ?? '')
  const samePosts = roleIds.length > 0 && details.every(detail => {
    const ids = detail.assignments.map(row => row.roleId ?? '')
    return ids.length === roleIds.length && roleIds.every(id => ids.includes(id))
  })
  const rules: RoleRule[] = first.map(row => ({ roleId: row.roleId ?? '', levelId: row.levelId, standardId: row.standardId }))
  return { roleIds, samePosts, rules }
}
