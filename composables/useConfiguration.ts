import { ref, shallowRef, computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { queryConfig, saveConfig } from '../api/patrol'
import { getPointAssignments } from '../api/assignments'
import { draftOf } from '../model/resources'
import type { ConfigEntity, Resource, Query, Term } from '../api/types'
/** 页面编排只维护编辑副本和筛选；列表分页、loading、空态由宿主 ProTable 负责。 */
export function useConfiguration(resource: Resource, point?: ConfigEntity, categoryId?: Ref<string | undefined>) {
  const { t } = useI18n()
  const saveFailed = ref(false)
  const visible = ref(false),
    saving = ref(false),
    version = ref(0)
  const draft = shallowRef<ConfigEntity>(draftOf(resource))
  const terms = ref<Term[]>([])
  const params = computed(() => ({ terms: [...terms.value, ...(resource === 'points' && categoryId?.value ? [{ column: 'categoryId', termType: 'eq', value: categoryId.value }] : []), ...(point?.id ? [{ column: 'pointId', termType: 'eq', value: point.id }] : [])], _refresh: version.value }))
  const load = async (query: Query) => {
    const response = await queryConfig(resource, query)
    if (resource !== 'points' || !response.success || !response.result.data.length) return response
    const rows = response.result.data
    // 仅批量读取本页点位的有效岗位，避免每个单元格单独查询指派关系。
    const details = await getPointAssignments(rows.map(row => row.id!))
    if (!details.success) throw new Error(t('Patrol.loadFailed'))
    const posts = new Map(details.result.map(detail => [detail.pointId, detail.assignments.map(row => row.postId!)]))
    rows.forEach(row => { row.assignedPostIds = posts.get(row.id!) ?? [] })
    return response
  }
  const edit = (source?: ConfigEntity) => {
    draft.value = draftOf(resource, source)
    if (resource === 'points' && !source && categoryId?.value) draft.value.categoryId = categoryId.value
    if (point?.id) {
      draft.value.pointId = point.id
      if (!source) draft.value.name = point.name
    }
    visible.value = true
  }
  async function save(value: ConfigEntity) {
    if (saving.value) return
    saving.value = true
    saveFailed.value = false
    try {
      const response = await saveConfig(resource, value)
      if (!response.success) {
        saveFailed.value = true
        return
      }
      onlyMessage(t('Patrol.saved'), 'success')
      visible.value = false
      version.value++
    } catch {
      saveFailed.value = true
    } finally {
      saving.value = false
    }
  }
  return { saveFailed, visible, saving, draft, params, terms, load, edit, save, reload: () => { version.value++ } }
}
