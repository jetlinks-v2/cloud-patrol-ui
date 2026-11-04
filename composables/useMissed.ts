import { computed, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { groupMissed, applyMissed, auditMissed, withdrawMissed, missedHistory } from '../api/missed'
import { canApplyMissed, missedState, type MissedItem, type MissedEvent } from '../model/missed'
/** 组详情只操作选中真实次数；处理失败保留输入，成功后重新读取权威状态。 */
export function useMissed(groupId: Ref<string>, changed: () => void) {
  const { t } = useI18n()
  const rows = ref<MissedItem[]>([]), selected = ref<string[]>([]), loading = ref(false), saving = ref(false), failed = ref(false)
  const status = ref<string>(), action = ref<'apply' | 'approve' | 'reject'>(), remark = ref(''), inputError = ref(false)
  const actionFailed = ref(false)
  const events = ref<MissedEvent[]>(), historyLoading = ref(false), historyFailed = ref(false)
  const filtered = computed(() => status.value ? rows.value.filter(row => missedState(row) === status.value) : rows.value)
  const chosen = computed(() => rows.value.filter(row => selected.value.includes(row.id)))
  const canApply = computed(() => chosen.value.length > 0 && chosen.value.every(canApplyMissed))
  const canAudit = computed(() => chosen.value.length > 0 && chosen.value.every(row => missedState(row) === 'pending'))
  let epoch = 0
  async function load() {
    const key = ++epoch; loading.value = true; failed.value = false
    try {
      const response = await groupMissed(groupId.value)
      if (key !== epoch) return
      if (response.success) { rows.value = response.result; selected.value = [] }
      else failed.value = true
    } catch { if (key === epoch) failed.value = true }
    finally { if (key === epoch) loading.value = false }
  }
  function begin(value: 'apply' | 'approve' | 'reject') { action.value = value; remark.value = ''; inputError.value = false; actionFailed.value = false }
  async function save() {
    if (saving.value || !action.value) return
    const text = remark.value.trim()
    inputError.value = action.value !== 'approve' && !text || text.length > 500
    if (inputError.value) return
    saving.value = true; actionFailed.value = false
    try {
      const response = action.value === 'apply' ? await applyMissed(chosen.value.map(row => row.id), text)
        : await auditMissed(chosen.value, action.value === 'approve', text)
      if (!response.success) { actionFailed.value = true; return }
      action.value = undefined; onlyMessage(t('Patrol.saved'), 'success'); await load(); changed()
    } catch { actionFailed.value = true } finally { saving.value = false }
  }
  async function withdraw(row: MissedItem) {
    if (saving.value) return
    saving.value = true; actionFailed.value = false
    try { const response = await withdrawMissed(row); if (response.success) { await load(); changed() } }
    catch { actionFailed.value = true }
    finally { saving.value = false }
  }
  async function history(row: MissedItem) {
    events.value = []; historyLoading.value = true; historyFailed.value = false
    try { const response = await missedHistory(row.id); if (response.success) events.value = response.result; else historyFailed.value = true }
    catch { historyFailed.value = true }
    finally { historyLoading.value = false }
  }
  watch(groupId, () => { action.value = undefined; events.value = undefined; void load() }, { immediate: true })
  watch(status, () => { selected.value = [] })
  return { actionFailed, rows: filtered, selected, loading, saving, failed, status, action, remark, inputError, events, historyLoading, historyFailed,
    canApply, canAudit, load, begin, save, withdraw, history }
}
