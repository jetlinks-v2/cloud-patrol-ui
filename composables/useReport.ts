import { ref, onMounted, onBeforeUnmount } from 'vue'
import { businessTime } from '../model/display'
import { reportSummary, type Summary } from '../api/patrol'
/** 失败不显示旧范围的统计；快速刷新只接受最后一次请求的结果。 */
export function useReport() {
  const range = ref<[string, string]>([
    businessTime().subtract(6, 'day').format('YYYY-MM-DD'),
    businessTime().format('YYYY-MM-DD'),
  ])
  const result = ref<Summary>(),
    loading = ref(false),
    failed = ref(false)
  let generation = 0
  async function reload() {
    if (!range.value?.[0] || !range.value?.[1]) return
    const current = ++generation
    loading.value = true
    failed.value = false
    result.value = undefined
    try {
      const response = await reportSummary(...range.value)
      if (current !== generation) return
      if (response.success) result.value = response.result
      else failed.value = true
    } catch {
      if (current === generation) failed.value = true
    } finally {
      if (current === generation) loading.value = false
    }
  }
  onMounted(reload)
  onBeforeUnmount(() => {
    generation++
  })
  return { range, result, loading, failed, reload }
}
