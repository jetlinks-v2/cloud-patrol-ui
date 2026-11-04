import { ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { getPointAssignments, assignPointPosts, configurePointRules, type PostRule } from '../api/assignments'
import { assignmentDraft } from '../model/assignments'
import type { ConfigEntity } from '../api/types'
import { commonPointCategories, initialPointCategory } from '../model/point-categories'
export type AssignmentMode = 'posts' | 'rules'
/** 单点和批量共用同一事务入口；规则编辑前必须确认所有点位的岗位一致。 */
export function usePointAssignments(points: ConfigEntity[], mode: AssignmentMode, done: () => void, preferredCategory?: string) {
  const { t } = useI18n()
  const loading = ref(false), failed = ref(false), saving = ref(false), saveFailed = ref(false), samePosts = ref(false)
  const postIds = ref<string[]>([]), rules = ref<PostRule[]>([])
  const categoryIds = commonPointCategories(points)
  const categoryId = ref(initialPointCategory(points, preferredCategory))
  let generation = 0
  async function load() {
    const current = ++generation
    postIds.value = []; rules.value = []; samePosts.value = false; saveFailed.value = false
    if (!categoryId.value) { loading.value = false; failed.value = false; return }
    loading.value = true; failed.value = false
    try {
      const response = await getPointAssignments(points.map(point => point.id!), categoryId.value)
      if (current !== generation) return
      if (!response.success) { failed.value = true; return }
      const draft = assignmentDraft(response.result)
      postIds.value = draft.postIds; rules.value = draft.rules; samePosts.value = draft.samePosts
    } catch { if (current === generation) failed.value = true }
    finally { if (current === generation) loading.value = false }
  }
  async function save() {
    if (saving.value || loading.value || failed.value || !categoryId.value) return
    if (points.length > 100 || postIds.value.length > 20) { onlyMessage(t('Patrol.assignmentLimit'), 'warning'); return }
    saving.value = true; saveFailed.value = false
    try {
      const ids = points.map(point => point.id!)
      const response = mode === 'posts' ? await assignPointPosts(ids, postIds.value, categoryId.value) : await configurePointRules(ids, rules.value, categoryId.value)
      if (!response.success) { saveFailed.value = true; return }
      onlyMessage(t('Patrol.saved'), 'success'); done()
    } catch { saveFailed.value = true }
    finally { saving.value = false }
  }
  watch(categoryId, load, { immediate: true })
  onBeforeUnmount(() => { generation++ })
  return { loading, failed, saving, saveFailed, samePosts, postIds, rules, categoryIds, categoryId, load, save }
}
