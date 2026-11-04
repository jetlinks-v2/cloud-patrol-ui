import { ref } from 'vue'
import { exportPoints } from '../api/points'
import type { Query } from '../api/types'
export function usePointExport() {
  const exporting = ref(false), exportFailed = ref(false)
  async function download(query: Query) {
    if (exporting.value) return
    exporting.value = true; exportFailed.value = false
    try { await exportPoints(query) } catch { exportFailed.value = true } finally { exporting.value = false }
  }
  return { exporting, exportFailed, download }
}
