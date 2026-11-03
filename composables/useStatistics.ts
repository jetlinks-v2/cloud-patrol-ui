import { ref, watch, onBeforeUnmount } from 'vue'
import { businessTime } from '../model/display'
import { queryStatistics, type StatisticsRow } from '../api/statistics'
export function useStatistics(people: boolean) {
  const range = ref<[string, string]>([businessTime().startOf('month').format('YYYY-MM-DD'), businessTime().format('YYYY-MM-DD')])
  const categoryIds = ref<string[]>([]), rows = ref<StatisticsRow[]>([]), loading = ref(false), failed = ref(false)
  let version = 0
  async function reload() {
    const current = ++version
    loading.value = true; failed.value = false; rows.value = []
    try {
      const response = await queryStatistics(people, range.value[0], range.value[1], categoryIds.value)
      if (current !== version) return
      if (response.success) rows.value = response.result; else failed.value = true
    } catch { if (current === version) failed.value = true }
    finally { if (current === version) loading.value = false }
  }
  watch([range, categoryIds], reload, { immediate: true })
  onBeforeUnmount(() => { version++ })
  return { range, categoryIds, rows, loading, failed, reload }
}
