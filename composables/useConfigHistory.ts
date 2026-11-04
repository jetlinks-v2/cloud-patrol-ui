import { ref, onScopeDispose, watch, type Ref } from 'vue'
import { configurationHistory, type AuditedConfig, type ConfigHistory } from '../api/config-history'
/** 切换对象或关闭后丢弃迟到的响应；分页由服务端固定对象、应用与资产权限。 */
export function useConfigHistory(resource: Ref<AuditedConfig>, id: Ref<string>) {
  const rows = ref<ConfigHistory[]>([]), loading = ref(false), failed = ref(false), total = ref(0), page = ref(1)
  let version = 0
  async function load(next = 1) {
    const current = ++version; loading.value = true; failed.value = false
    try {
      const response = await configurationHistory(resource.value, id.value, next - 1)
      if (current !== version) return
      if (!response.success) { failed.value = true; return }
      rows.value = response.result.data; total.value = response.result.total; page.value = next
    } catch { if (current === version) failed.value = true }
    finally { if (current === version) loading.value = false }
  }
  watch([resource, id], () => { rows.value = []; total.value = 0; void load() }, { immediate: true })
  onScopeDispose(() => { version++ })
  return { rows, loading, failed, total, page, load }
}
