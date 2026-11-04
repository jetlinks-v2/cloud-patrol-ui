import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { getPointAssignments, assignPointPosts, configurePointRules, type PostRule } from '../api/assignments'
import { assignmentDraft } from '../model/assignments'
import type { ConfigEntity } from '../api/types'
export type AssignmentMode = 'posts' | 'rules'
/** 单点和批量共用同一事务入口；规则编辑前必须确认所有点位的岗位一致。 */
export function usePointAssignments(points: ConfigEntity[], mode: AssignmentMode, done: () => void) {
  const { t } = useI18n()
  const loading = ref(false), failed = ref(false), saving = ref(false), saveFailed = ref(false), samePosts = ref(false)
  const postIds = ref<string[]>([]), rules = ref<PostRule[]>([])
  async function load() {
    loading.value = true; failed.value = false
    try {
      const response = await getPointAssignments(points.map(point => point.id!))
      if (!response.success) { failed.value = true; return }
      const draft = assignmentDraft(response.result)
      postIds.value = draft.postIds; rules.value = draft.rules; samePosts.value = draft.samePosts
    } catch { failed.value = true }
    finally { loading.value = false }
  }
  async function save() {
    if (saving.value || loading.value || failed.value) return
    if (points.length > 100 || postIds.value.length > 20) { onlyMessage(t('Patrol.assignmentLimit'), 'warning'); return }
    saving.value = true; saveFailed.value = false
    try {
      const ids = points.map(point => point.id!)
      const response = mode === 'posts' ? await assignPointPosts(ids, postIds.value) : await configurePointRules(ids, rules.value)
      if (!response.success) { saveFailed.value = true; return }
      onlyMessage(t('Patrol.saved'), 'success'); done()
    } catch { saveFailed.value = true }
    finally { saving.value = false }
  }
  onMounted(load)
  return { loading, failed, saving, saveFailed, samePosts, postIds, rules, load, save }
}
