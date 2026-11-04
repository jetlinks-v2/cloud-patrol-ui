import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { businessTime } from '../model/display'
import { queryStatistics, exportStatistics, type StatisticsReport } from '../api/statistics'
/** 查询过期响应不覆盖当前周期；表格、总计与周期使用同一服务端报表快照。 */
export function useStatistics(people: boolean, qualification = false) {
  const defaultRange = (): [string, string] => [businessTime().startOf('month').format('YYYY-MM-DD'), businessTime().format('YYYY-MM-DD')]
  const range = ref<[string, string]>(defaultRange()), categoryIds = ref<string[]>([])
  const report = ref<StatisticsReport>(), loading = ref(false), failed = ref(false)
  const exporting = ref(false), exportFailed = ref(false)
  const rows = computed(() => report.value?.rows ?? [])
  let version = 0
  async function reload() {
    const current = ++version
    loading.value = true; failed.value = false; report.value = undefined; exportFailed.value = false
    try {
      const response = await queryStatistics(people, range.value[0], range.value[1], categoryIds.value)
      if (current !== version) return
      if (response.success) report.value = response.result; else failed.value = true
    } catch { if (current === version) failed.value = true }
    finally { if (current === version) loading.value = false }
  }
  async function exportReport() {
    if (exporting.value || loading.value || !report.value) return
    exporting.value = true; exportFailed.value = false
    try { await exportStatistics(people, qualification, range.value[0], range.value[1], categoryIds.value) }
    catch { exportFailed.value = true }
    finally { exporting.value = false }
  }
  function reset() { range.value = defaultRange(); categoryIds.value = [] }
  watch([range, categoryIds], reload, { immediate: true })
  onBeforeUnmount(() => { version++ })
  return { range, categoryIds, rows, report, loading, failed, exporting, exportFailed, reload, reset, exportReport }
}
