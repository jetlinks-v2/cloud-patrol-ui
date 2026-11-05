import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { previewPointImport, importPoints, downloadPointTemplate, type PointImportRow } from '../api/points'
import { selectedProject, useProjects } from './useProjects'
import { findOrganization } from '../model/projects'
import { pointImportErrorsCsv } from '../model/point-import'
/** 原文件预检后再提交，提交端重新校验；成功后清空文件，避免误点重复导入。 */
export function usePointImport(saved: () => void) {
  const { t } = useI18n()
  // 导入窗口独立选择归属，不随后台列表筛选变化；切换项目必须重新预检文件。
  const projectId = ref(selectedProject())
  const projectName = computed(() => findOrganization(useProjects().tree.value, projectId.value)?.name ?? projectId.value)
  const file = ref<File>(), rows = ref<PointImportRow[]>([]), busy = ref(false), failed = ref(false)
  watch(projectId, () => { file.value = undefined; rows.value = []; failed.value = false }, { flush: 'sync' })
  const valid = computed(() => !!projectId.value && rows.value.length > 0 && rows.value.every(row => !row.errors.length))
  const validCount = computed(() => rows.value.filter(row => !row.errors.length).length)
  const categoryCount = computed(() => new Set(rows.value.filter(row => !row.errors.length).map(row => row.categoryId)).size)
  const errorCount = computed(() => rows.value.length - validCount.value)
  async function run(action: () => Promise<unknown>) {
    if (busy.value) return
    busy.value = true; failed.value = false
    try { await action() } catch { failed.value = true } finally { busy.value = false }
  }
  function selectFile(value: File) {
    if (busy.value || !projectId.value) return false
    rows.value = []; file.value = undefined
    if (!/\.(xlsx|xls)$/i.test(value.name) || value.size > 10 * 1024 * 1024) {
      onlyMessage(t('Patrol.pointImport.fileInvalid'), 'error'); return false
    }
    file.value = value
    void run(async () => {
      const response = await previewPointImport(value, projectId.value!)
      if (!response.success) { failed.value = true; return }
      rows.value = response.result.rows
    })
    return false
  }
  const download = () => run(async () => { if (projectId.value) await downloadPointTemplate(projectId.value) })
  function downloadErrors() {
    const csv = pointImportErrorsCsv(rows.value, [t('Patrol.pointImport.row'), t('Patrol.category'),
      t('Patrol.names.points'), t('Patrol.location'), t('Patrol.pointImport.validation')],
      code => t(`Patrol.pointImport.errors.${code}`))
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = t('Patrol.pointImport.errorFile'); link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const submit = () => run(async () => {
    if (!file.value || !valid.value || !projectId.value) return
    const response = await importPoints(file.value, projectId.value!)
    if (!response.success) { failed.value = true; return }
    file.value = undefined; rows.value = []
    onlyMessage(t('Patrol.imported', { count: response.result }), 'success'); saved()
  })
  return { projectId, projectName, file, rows, busy, failed, valid, validCount, categoryCount, errorCount, selectFile, download, downloadErrors, submit }
}
