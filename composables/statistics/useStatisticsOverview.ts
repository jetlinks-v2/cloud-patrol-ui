import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { businessTime } from '../../model/display'
import { selectedProject } from '../useProjects'
import { queryStatistics, queryStatisticsTasks, queryStatisticsDetail, exportStatistics,
  type StatisticsReport, type StatisticsRange, type StatisticsMetric, type StatisticsPointDay, type StatisticsDetail } from '../../api/statistics'

/** 默认上月同日至今天，使用业务时区；月底自动落到上月最后一天。 */
export function defaultStatisticsRange(now = Date.now()): [string, string] {
  const end = businessTime(now)
  return [end.subtract(1, 'month').format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
}

/** 项目按到期履约率降序，同率优先展示应巡量大的项目；无已到期任务排在最后。 */
export function compareProjectFulfillment(a: StatisticsReport['projects'][number], b: StatisticsReport['projects'][number]) {
  const left = a.counts.dueFulfillmentRate, right = b.counts.dueFulfillmentRate
  if (left == null && right != null) return 1
  if (right == null && left != null) return -1
  return (right ?? 0) - (left ?? 0) || b.counts.expected - a.counts.expected
    || (a.projectName || '').localeCompare(b.projectName || '', 'zh-CN') || a.projectId.localeCompare(b.projectId)
}

/** 所有区域消费同一次查询快照；筛选变化立即清除旧报表和下钻，晚到响应不能覆盖当前范围。 */
export function useStatisticsOverview() {
  const range = ref<[string, string]>(defaultStatisticsRange())
  const categoryIds = ref<string[]>([]), levelIds = ref<string[]>([])
  const report = ref<StatisticsReport>(), snapshot = ref<StatisticsRange>()
  const projects = computed(() => [...(report.value?.projects || [])].sort(compareProjectFulfillment))
  const loading = ref(false), failed = ref(false), exporting = ref(false), exportFailed = ref(false)
  const drillOpen = ref(false), drillLoading = ref(false), drillFailed = ref(false)
  const drillRows = ref<StatisticsPointDay[]>([]), drillTotal = ref(0), drillPage = ref(1)
  const drillMetric = ref<StatisticsMetric>('all'), drillRange = ref<StatisticsRange>()
  const detailOpen = ref(false), detailLoading = ref(false), detailFailed = ref(false), detail = ref<StatisticsDetail>()
  const selectedPoint = ref<StatisticsPointDay>()
  let version = 0, drillVersion = 0, detailVersion = 0
  function closeDrill() {
    drillOpen.value = false; detailOpen.value = false; drillVersion++; detailVersion++
  }
  async function reload() {
    const current = ++version
    closeDrill(); loading.value = true; failed.value = false; report.value = undefined; snapshot.value = undefined
    const input: StatisticsRange = {from: range.value[0], to: range.value[1], categoryIds: [...(categoryIds.value || [])],
      levelIds: [...(levelIds.value || [])], projectId: selectedProject()}
    try {
      const response = await queryStatistics(input)
      if (current !== version) return
      if (response.success) { report.value = response.result; snapshot.value = input } else failed.value = true
    } catch { if (current === version) failed.value = true }
    finally { if (current === version) loading.value = false }
  }
  async function loadDrill(page = 1) {
    if (!drillRange.value) return
    const current = ++drillVersion
    detailOpen.value = false; detailVersion++
    drillLoading.value = true; drillFailed.value = false; drillRows.value = []; drillTotal.value = 0; drillPage.value = page
    try {
      const response = await queryStatisticsTasks(drillRange.value, drillMetric.value, page - 1, 20)
      if (current !== drillVersion) return
      if (response.success) { drillRows.value = response.result.data; drillTotal.value = response.result.total } else drillFailed.value = true
    } catch { if (current === drillVersion) drillFailed.value = true }
    finally { if (current === drillVersion) drillLoading.value = false }
  }
  function openDrill(metric: StatisticsMetric = 'all', projectId?: string, date?: string) {
    if (!snapshot.value) return
    drillRange.value = {...snapshot.value, projectId: projectId ?? snapshot.value.projectId,
      ...(date ? {from: date, to: date} : {})}
    drillMetric.value = metric; drillOpen.value = true; void loadDrill()
  }
  async function openDetail(point: StatisticsPointDay) {
    if (!drillRange.value) return
    const current = ++detailVersion
    selectedPoint.value = point; detail.value = undefined; detailOpen.value = true; detailLoading.value = true; detailFailed.value = false
    try {
      const response = await queryStatisticsDetail({...drillRange.value, projectId: point.projectId, from: point.date, to: point.date}, point.pointId)
      if (current !== detailVersion) return
      if (response.success) detail.value = response.result; else detailFailed.value = true
    } catch { if (current === detailVersion) detailFailed.value = true }
    finally { if (current === detailVersion) detailLoading.value = false }
  }
  async function exportReport() {
    if (exporting.value || loading.value || !snapshot.value) return
    exporting.value = true; exportFailed.value = false
    try { await exportStatistics({...snapshot.value}) } catch { exportFailed.value = true }
    finally { exporting.value = false }
  }
  function reset() { range.value = defaultStatisticsRange(); categoryIds.value = []; levelIds.value = [] }
  watch([range, categoryIds, levelIds], reload, {immediate: true})
  onBeforeUnmount(() => { version++; drillVersion++; detailVersion++ })
  return {range, categoryIds, levelIds, report, projects, snapshot, loading, failed, exporting, exportFailed, reload, reset, exportReport,
    drillOpen, drillLoading, drillFailed, drillRows, drillTotal, drillPage, drillMetric, drillRange, loadDrill, openDrill,
    detailOpen, detailLoading, detailFailed, detail, selectedPoint, openDetail}
}
