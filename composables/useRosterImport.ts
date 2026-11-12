import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { selectedProject } from './useProjects'
import { downloadRosterTemplate, importRosterMonth } from '../api/rosters'
/** 模板下载与导入共享月份；整月替换前由页面显式确认。 */
export function useRosterImport() {
  const { t } = useI18n()
  const projectId = ref(selectedProject())
  const month = ref(dayjs().format('YYYY-MM')), file = ref<File>()
  const busy = ref(false), failed = ref(false), imported = ref<number>()
  // 换月后必须重新选择对应模板，避免沿用上月文件或成功提示。
  watch([month, projectId], () => { file.value = undefined; failed.value = false; imported.value = undefined }, { flush: 'sync' })
  async function run(action: () => Promise<unknown>) {
    if (busy.value) return
    busy.value = true; failed.value = false
    try { await action() } catch { failed.value = true } finally { busy.value = false }
  }
  const download = () => run(async () => { if (projectId.value) await downloadRosterTemplate(month.value, projectId.value) })
  const submit = () => run(async () => {
    if (!file.value || !projectId.value) return
    const response = await importRosterMonth(month.value, file.value, projectId.value)
    if (!response.success) { failed.value = true; return }
    imported.value = response.result
    onlyMessage(t('Patrol.imported', { count: response.result }), 'success')
  })
  function selectFile(value: File) { file.value = value; imported.value = undefined; failed.value = false; return false }
  return { projectId, month, file, busy, failed, imported, download, submit, selectFile }
}
