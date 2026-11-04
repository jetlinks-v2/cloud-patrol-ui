import type { PointAssignments, PostRule } from '../api/assignments'
/** 批量规则只在岗位集合相同时回填第一点位；各点位原规则可以不同，保存统一覆盖。 */
export function assignmentDraft(details: PointAssignments[]) {
  const first = details[0]?.assignments ?? []
  const postIds = first.map(row => row.postId!).filter(Boolean)
  const samePosts = postIds.length > 0 && details.every(detail => {
    const ids = detail.assignments.map(row => row.postId)
    return ids.length === postIds.length && postIds.every(id => ids.includes(id))
  })
  const rules: PostRule[] = first.map(row => ({ postId: row.postId!, levelId: row.levelId, standardId: row.standardId }))
  return { postIds, samePosts, rules }
}
