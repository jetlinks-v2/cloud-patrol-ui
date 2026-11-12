import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { getPointAssignments, savePointConfiguration, type RoleRule } from '../api/assignments'
import { assignmentDraft } from '../model/assignments'
import type { ConfigEntity } from '../api/types'
import { commonPointCategories, initialPointCategory } from '../model/point-categories'
/** 打开只读回填；角色和规则共用草稿，联合保存由后端事务一次提交。 */
export function usePointAssignments(points: ConfigEntity[], done: () => void, preferredCategory?: string) {
  const { t } = useI18n()
  const loading = ref(false), failed = ref(false), saving = ref(false), saveFailed = ref(false)
  const roleIds = ref<string[]>([]), ruleDrafts = ref<RoleRule[]>([])
  const rules = computed(() => roleIds.value.map(id => ruleDrafts.value.find(rule => rule.roleId === id)!))
  // 未保存前移除再选回角色，仍保留刚填写的规则；切换分类才重新载入。
  function updateRoles(ids?: string[]) {
    const selected = ids ?? []
    for (const id of selected) {
      if (!ruleDrafts.value.some(rule => rule.roleId === id)) ruleDrafts.value.push({ roleId: id })
    }
    roleIds.value = selected
  }
  const categoryIds = commonPointCategories(points)
  const categoryId = ref(initialPointCategory(points, preferredCategory))
  let generation = 0
  async function load() {
    const current = ++generation
    roleIds.value = []; ruleDrafts.value = []; saveFailed.value = false
    if (!categoryId.value) { loading.value = false; failed.value = false; return }
    loading.value = true; failed.value = false
    try {
      const response = await getPointAssignments(points.map(point => point.id!), categoryId.value)
      if (current !== generation) return
      if (!response.success) { failed.value = true; return }
      const draft = assignmentDraft(response.result)
      ruleDrafts.value = draft.rules; roleIds.value = draft.roleIds
    } catch { if (current === generation) failed.value = true }
    finally { if (current === generation) loading.value = false }
  }
  async function save() {
    if (saving.value || loading.value || failed.value || !categoryId.value) return
    if (points.length > 100 || roleIds.value.filter(Boolean).length > 20) { onlyMessage(t('Patrol.assignmentLimit'), 'warning'); return }
    saving.value = true; saveFailed.value = false
    try {
      const ids = points.map(point => point.id!)
      const response = await savePointConfiguration(ids, rules.value, categoryId.value)
      if (!response.success) { saveFailed.value = true; return }
      onlyMessage(t('Patrol.saved'), 'success'); done()
      return true
    } catch { saveFailed.value = true }
    finally { saving.value = false }
  }
  watch(categoryId, load, { immediate: true })
  onBeforeUnmount(() => { generation++ })
  return { loading, failed, saving, saveFailed, roleIds, rules, updateRoles, categoryIds, categoryId, load, save }
}
