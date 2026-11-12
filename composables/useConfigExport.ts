import { ref } from 'vue'
import { exportConfiguration, type ExportableConfig } from '../api/config-transfer'
import type { Query, Resource } from '../api/types'
export const canExportConfiguration = (resource: Resource): resource is ExportableConfig =>
  resource === 'levels' || resource === 'standards' || resource === 'tags'
export function useConfigExport() {
  const exporting = ref(false), exportFailed = ref(false)
  async function download(resource: ExportableConfig, query: Query) {
    if (exporting.value) return
    exporting.value = true; exportFailed.value = false
    try { await exportConfiguration(resource, query) } catch { exportFailed.value = true }
    finally { exporting.value = false }
  }
  return { exporting, exportFailed, download }
}
