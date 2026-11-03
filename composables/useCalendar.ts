import { ref, watch, onBeforeUnmount, computed } from 'vue'
import type { Dayjs } from 'dayjs'
import { businessTime } from '../model/display'
import { calendarMonth, calendarDay, exportCalendarDay, type CalendarMonth, type CalendarDetail } from '../api/calendar'
/** 月切换、日期切换各自拒绝过期响应；失败清空旧数据，不把旧月份冒充当前月份。 */
export function useCalendar() {
  const month = ref<Dayjs>(businessTime()), selectedDate = ref('')
  const result = ref<CalendarMonth>(), detail = ref<CalendarDetail>()
  const loading = ref(false), failed = ref(false), dayLoading = ref(false), dayFailed = ref(false)
  const exporting = ref(false), exportFailed = ref(false)
  const days = computed(() => new Map(result.value?.days.map(day => [day.date, day])))
  let monthVersion = 0, dayVersion = 0
  async function reload() {
    const version = ++monthVersion
    loading.value = true; failed.value = false; result.value = undefined
    try { const response = await calendarMonth(month.value.format('YYYY-MM'))
      if (version !== monthVersion) return
      if (response.success) result.value = response.result; else failed.value = true
    } catch { if (version === monthVersion) failed.value = true }
    finally { if (version === monthVersion) loading.value = false }
  }
  async function openDay(date: string) {
    selectedDate.value = date
    const version = ++dayVersion
    dayLoading.value = true; dayFailed.value = false; detail.value = undefined; exportFailed.value = false
    try { const response = await calendarDay(date)
      if (version !== dayVersion) return
      if (response.success) detail.value = response.result; else dayFailed.value = true
    } catch { if (version === dayVersion) dayFailed.value = true }
    finally { if (version === dayVersion) dayLoading.value = false }
  }
  function closeDay() { selectedDate.value = ''; dayVersion++ }
  async function exportDay() {
    if (exporting.value || !selectedDate.value) return
    exporting.value = true; exportFailed.value = false
    try { await exportCalendarDay(selectedDate.value) }
    catch { exportFailed.value = true }
    finally { exporting.value = false }
  }
  watch(() => month.value.format('YYYY-MM'), () => { closeDay(); void reload() }, { immediate: true })
  onBeforeUnmount(() => { monthVersion++; dayVersion++ })
  return { month, selectedDate, result, detail, days, loading, failed, dayLoading, dayFailed,
    exporting, exportFailed, reload, openDay, closeDay, exportDay }
}
