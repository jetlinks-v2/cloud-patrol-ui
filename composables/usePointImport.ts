import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { previewPointImport, importPoints, downloadPointTemplate, type PointImportRow } from '../api/points'
/** 原文件预检后再提交，提交端重新校验；成功后清空文件，避免误点重复导入。 */
export function usePointImport(saved: () => void) {
  const { t } = useI18n()
  const file = ref<File>(), rows = ref<PointImportRow[]>([]), busy = ref(false), failed = ref(false)
  const valid = computed(() => rows.value.length > 0 && rows.value.every(row => !row.errors.length))
  async function run(action: () => Promise<unknown>) {
    if (busy.value) return
    busy.value = true; failed.value = false
    try { await action() } catch { failed.value = true } finally { busy.value = false }
  }
  function selectFile(value: File) {
    if (busy.value) return false
    rows.value = []; file.value = undefined
    if (!/\.(xlsx|xls)$/i.test(value.name) || value.size > 10 * 1024 * 1024) {
      onlyMessage(t('Patrol.pointImport.fileInvalid'), 'error'); return false
    }
    file.value = value
    void run(async () => {
      const response = await previewPointImport(value)
      if (!response.success) { failed.value = true; return }
      rows.value = response.result.rows
    })
    return false
  }
  const download = () => run(downloadPointTemplate)
  const submit = () => run(async () => {
    if (!file.value || !valid.value) return
    const response = await importPoints(file.value)
    if (!response.success) { failed.value = true; return }
    file.value = undefined; rows.value = []
    onlyMessage(t('Patrol.imported', { count: response.result }), 'success'); saved()
  })
  return { file, rows, busy, failed, valid, selectFile, download, submit }
}
