import { ref, shallowRef, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { queryConfig, saveConfig } from '../api/patrol'
import { draftOf } from '../model/resources'
import type { ConfigEntity, Resource, Query, Term } from '../api/types'
/** 页面编排只维护编辑副本和筛选；列表分页、loading、空态由宿主 ProTable 负责。 */
export function useConfiguration(resource: Resource) {
  const { t } = useI18n()
  const saveFailed = ref(false)
  const visible = ref(false),
    saving = ref(false),
    version = ref(0)
  const draft = shallowRef<ConfigEntity>(draftOf(resource))
  const terms = ref<Term[]>([])
  const params = computed(() => ({ terms: terms.value, _refresh: version.value }))
  const load = (query: Query) => queryConfig(resource, query)
  const edit = (source?: ConfigEntity) => {
    draft.value = draftOf(resource, source)
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
  return { saveFailed, visible, saving, draft, params, terms, load, edit, save }
}
