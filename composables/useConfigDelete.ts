import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { deleteConfiguration, type RemovableConfig } from '../api/config-delete'

/** 失败保留原列表和重试入口；成功后由页面刷新，避免客户端伪删除。 */
export function useConfigDelete(deleted: () => void) {
  const { t } = useI18n()
  const deleting = ref(false), failed = ref(false)
  async function remove(resource: RemovableConfig, id: string) {
    if (deleting.value) return
    deleting.value = true; failed.value = false
    try {
      const response = await deleteConfiguration(resource, id)
      if (!response.success) { failed.value = true; return }
      onlyMessage(t('Patrol.configDelete.succeeded'), 'success'); deleted()
    } catch { failed.value = true }
    finally { deleting.value = false }
  }
  return { deleting, failed, remove }
}
