import { ref, computed } from 'vue'
import { businessTime } from '../model/display'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { previewTasks, generateTasks, queryTasks } from '../api/patrol'
import type { Task, Term } from '../api/types'
export function useTasks() {
  const { t } = useI18n()
  const planId = ref<string>(),
    date = ref(businessTime().format('YYYY-MM-DD'))
  const failed = ref(false)
  const working = ref(false),
    preview = ref<Task[] | null>(null),
    terms = ref<Term[]>([]),
    revision = ref(0)
  const params = computed(() => ({ terms: terms.value, _refresh: revision.value }))
  async function run(generate: boolean) {
    if (!planId.value || !date.value || working.value) return
    working.value = true
    failed.value = false
    try {
      const response = await (generate ? generateTasks : previewTasks)(planId.value, date.value)
      if (!response.success) {
        failed.value = true
        return
      }
      preview.value = response.result
      if (generate) {
        revision.value++
        onlyMessage(t('Patrol.generated'), 'success')
      }
    } catch {
      failed.value = true
    } finally {
      working.value = false
    }
  }
  return { failed, planId, date, working, preview, terms, params, run, load: queryTasks }
}
