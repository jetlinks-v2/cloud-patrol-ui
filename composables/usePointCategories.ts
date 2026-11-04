import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import type { ConfigEntity } from '../api/types'
import { changePointCategory } from '../api/point-categories'
import { commonPointCategories, initialPointCategory } from '../model/point-categories'

/** 分类关系调整与点位启停分别保存；取消仅提交所选共同分类。 */
export function usePointCategories(points: ConfigEntity[], action: 'link' | 'cancel', preferred: string | undefined, done: () => void) {
  const { t } = useI18n()
  const allowedIds = action === 'cancel' ? commonPointCategories(points) : undefined
  const categoryId = ref(action === 'cancel' ? initialPointCategory(points, preferred) : undefined)
  const saving = ref(false), failed = ref(false)
  async function save() {
    if (saving.value || !categoryId.value || (allowedIds && !allowedIds.includes(categoryId.value))) return
    saving.value = true; failed.value = false
    try {
      const response = await changePointCategory(action, points.map(point => point.id!), categoryId.value)
      if (!response.success) { failed.value = true; return }
      onlyMessage(t('Patrol.saved'), 'success'); done()
    } catch { failed.value = true }
    finally { saving.value = false }
  }
  return { allowedIds, categoryId, saving, failed, save }
}
