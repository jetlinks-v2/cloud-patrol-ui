<template>

  <div class="patrol-records">
    <ConditionFilter :fields="fields" @change="({ filter }) => (params = { terms: filter.terms })" />
    <a-alert v-if="exportFailed" type="error" show-icon :message="t('Patrol.statistics.exportFailed')" />
    <j-pro-table :columns="columns" :request="queryTaskGroups" :params="{ ...params, _refresh: version }"
      mode="TABLE" type="PAGE" row-key="id" :alert-show="false" :scroll="{ x: 1200 }"
      :default-params="{ sorts: [{ name: 'belongDate', order: 'desc' }, { name: 'id', order: 'asc' }] }">
      <template #headerLeftRender><a-button :loading="exporting" @click="exportRecords">{{ t('Patrol.statistics.export') }}</a-button></template>
      <template #categoryName="row">{{ row.categoryName || '—' }}</template>
      <template #levelName="row">{{ row.levelName || '—' }}</template>
      <template #progress="row">{{ row.completedCount ?? 0 }}/{{ row.requiredCount ?? 0 }}</template>
      <template #last="row">{{ dateTime(row.lastExecutionTime) }}</template>
      <template #period="row">{{ dateTime(row.startTime) }} ～ {{ dateTime(row.endTime) }}</template>
      <template #actions="row"><a-button type="link" @click="selected = row">{{ t('Patrol.details') }}</a-button></template>
    </j-pro-table>
    <a-drawer :open="!!selected" :title="t('Patrol.taskGroupDetails')" :width="1200" @close="selected = undefined">
      <TaskGroupDetails v-if="selected" :key="selected.id" :group="selected" @changed="version++" />
    </a-drawer>
  </div>

</template>
<script setup lang="ts">
import { patrolOptionSource } from '../../../composables/usePatrolOptionSource'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Drawer as ADrawer, Alert as AAlert } from 'ant-design-vue'
import ConditionFilter, { type ConditionFilterField } from '@jetlinks-web-core/components/ConditionFilter'
import { queryTaskGroups, exportTaskGroups } from '../../../api/patrol'
import type { Query, TaskGroup } from '../../../api/types'
import TaskGroupDetails from '../../../components/TaskGroupDetails.vue'
import { dateTime } from '../../../model/display'
import { groupMissedTerm } from '../../../model/record-filters'
const { t } = useI18n()
const version = ref(0)
const params = ref<Query>({ terms: [] }), selected = ref<TaskGroup>()
const exporting = ref(false), exportFailed = ref(false)
async function exportRecords() {
  if (exporting.value) return
  exporting.value = true; exportFailed.value = false
  try { await exportTaskGroups({ ...params.value, sorts: [{ name: 'belongDate', order: 'desc' }, { name: 'id', order: 'asc' }] }) }
  catch { exportFailed.value = true }
  finally { exporting.value = false }
}
const referenceOptions = patrolOptionSource
const categories = referenceOptions('categories'), levels = referenceOptions('levels')
const fields = computed<ConditionFilterField[]>(() => [
  { title: t('Patrol.point'), dataIndex: 'pointName', search: { type: 'string', defaultTermType: 'like' } },
  { title: t('Patrol.belongDate'), dataIndex: 'belongDate', search: { type: 'date', defaultTermType: 'btw' } },
  ...(['categoryId', 'levelId'] as const).map<ConditionFilterField>(key => ({ title: t(key === 'categoryId' ? 'Patrol.category' : 'Patrol.level'), dataIndex: key, search: { type: 'select', defaultTermType: 'in', termTypeOptions: ['in', 'nin'], optionPanel: { ...(key === 'categoryId' ? categories : levels), multiple: true, optionFields: { value: 'id', label: 'name' } } } })),
  { title: t('Patrol.post'), dataIndex: 'postName', search: { type: 'string', defaultTermType: 'like' } },
  // rename 将虚拟筛选列与任务组 id 对应，防止转换后的关联条件被规范化过程丢弃。
  { title: t('Patrol.missed.applicationFilter'), dataIndex: 'missedApplication', search: {
    type: 'select', rename: 'id', defaultTermType: 'eq', termTypeOptions: ['eq'],
    options: ['pending', 'applied'].map(value => ({ value, label: t(`Patrol.missed.${value === 'pending' ? 'states.pending' : 'applied'}`) })),
    handleParamsItem: ({ value }) => groupMissedTerm(value as 'pending' | 'applied'),
  } },
])
const columns = computed(() => [
  { title: t('Patrol.projects.label'), dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true },
  { title: t('Patrol.point'), dataIndex: 'pointName', key: 'pointName' },
  { title: t('Patrol.category'), dataIndex: 'categoryName', key: 'categoryName', scopedSlots: true },
  { title: t('Patrol.level'), dataIndex: 'levelName', key: 'levelName', scopedSlots: true },
  { title: t('Patrol.belongDate'), dataIndex: 'belongDate', key: 'belongDate' },
  { title: t('Patrol.taskPeriod'), dataIndex: 'period', key: 'period', scopedSlots: true, width: 330 },
  { title: t('Patrol.post'), dataIndex: 'postName', key: 'postName' },
  { title: t('Patrol.periodCount'), dataIndex: 'periodCount', key: 'periodCount' },
  { title: t('Patrol.progress'), dataIndex: 'progress', key: 'progress', scopedSlots: true },
  { title: t('Patrol.calendar.lastTime'), dataIndex: 'lastExecutionTime', key: 'last', scopedSlots: true, width: 180 },
  { title: t('Patrol.actions'), dataIndex: 'actions', key: 'actions', scopedSlots: true, width: 100 },
])
</script>
<style scoped>
.patrol-records { display: flex; flex-direction: column; gap: var(--space-3, 16px); height: 100%; min-height: 0; }
</style>
