<template>

  <FullPage class="patrol-records" :flex="true">
    <ProjectFilterBar>
      <ConditionFilter :fields="fields" @change="filterChanged" />
      <a-button @click="version++">{{ t('Patrol.refresh') }}</a-button>
    </ProjectFilterBar>
    <a-alert v-if="exportFailed" type="error" show-icon :message="t('Patrol.statistics.exportFailed')" />
    <j-pro-table :columns="columns" :request="queryTaskGroups" :params="tableParams"
      mode="TABLE" type="PAGE" row-key="id" :alert-show="false" :scroll="{ x: 1480 }"
      :body-style="{ flex: '1 1 0', height: '0', minHeight: 0 }"
      :default-params="{ sorts: [{ name: 'belongDate', order: 'desc' }, { name: 'id', order: 'asc' }] }">
      <template #headerLeftRender><a-button :loading="exporting" @click="exportRecords">{{ t('Patrol.statistics.export') }}</a-button></template>
      <template #categoryName="row">{{ row.categoryName || '—' }}</template>
      <template #levelName="row">{{ row.levelName || '—' }}</template>
      <template #roleName="row">{{ row.roleId ? row.roleName : t('Patrol.allStaffPatrol') }}</template>
      <template #progress="row">{{ row.completedCount ?? 0 }}/{{ row.requiredCount ?? 0 }}</template>
      <template #last="row">{{ dateTime(row.lastExecutionTime) }}</template>
      <template #actions="row"><a-button type="link" @click="selected = row">{{ t('Patrol.details') }}</a-button></template>
    </j-pro-table>
    <a-drawer :open="!!selected" :title="t('Patrol.taskGroupDetails')" :width="1200" @close="selected = undefined">
      <TaskGroupDetails v-if="selected" :key="selected.id" :group="selected" @changed="version++" />
    </a-drawer>
  </FullPage>

</template>
<script setup lang="ts">
import { patrolOptionSource } from '../../../composables/usePatrolOptionSource'
import ProjectFilterBar from '../../../components/ProjectFilterBar.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Drawer as ADrawer, Alert as AAlert } from 'ant-design-vue'
import ConditionFilter, { type ConditionFilterField, type ConditionFilterChangePayload } from '@jetlinks-web-core/components/ConditionFilter'
import { queryTaskGroups, exportTaskGroups } from '../../../api/patrol'
import type { Query, TaskGroup } from '../../../api/types'
import TaskGroupDetails from '../../../components/TaskGroupDetails.vue'
import { dateTime } from '../../../model/display'
import { groupMissedTerm } from '../../../model/record-filters'
const { t } = useI18n()
const version = ref(0)
const params = ref<Query>({ terms: [] }), selected = ref<TaskGroup>()
// 表格监听 params；只在实际筛选或刷新变化时生成新对象，打开详情等渲染不重复分页。
const tableParams = computed(() => ({ ...params.value, _refresh: version.value }))
function filterChanged({ filter }: ConditionFilterChangePayload) {
  if (JSON.stringify(filter.terms) !== JSON.stringify(params.value.terms)) params.value = { terms: filter.terms }
}
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
  { title: t('Patrol.post'), dataIndex: 'roleName', search: { type: 'string', defaultTermType: 'like' } },
  // rename 将虚拟筛选列与任务组 id 对应，防止转换后的关联条件被规范化过程丢弃。
  { title: t('Patrol.missed.applicationFilter'), dataIndex: 'missedApplication', search: {
    type: 'select', rename: 'id', defaultTermType: 'eq', termTypeOptions: ['eq'],
    options: ['pending', 'applied'].map(value => ({ value, label: t(`Patrol.missed.${value === 'pending' ? 'states.pending' : 'applied'}`) })),
    handleParamsItem: ({ value }) => groupMissedTerm(value as 'pending' | 'applied'),
  } },
])
const columns = computed(() => [
  { title: t('Patrol.projects.label'), dataIndex: 'projectName', key: 'projectName', width: 160, ellipsis: true },
  { title: t('Patrol.point'), dataIndex: 'pointName', key: 'pointName', width: 220, ellipsis: true },
  { title: t('Patrol.category'), dataIndex: 'categoryName', key: 'categoryName', scopedSlots: true, width: 150, ellipsis: true },
  { title: t('Patrol.level'), dataIndex: 'levelName', key: 'levelName', scopedSlots: true, width: 150, ellipsis: true },
  { title: t('Patrol.belongDate'), dataIndex: 'belongDate', key: 'belongDate', width: 120 },
  { title: t('Patrol.post'), dataIndex: 'roleName', key: 'roleName', scopedSlots: true, width: 180, ellipsis: true },
  { title: t('Patrol.periodCount'), dataIndex: 'periodCount', key: 'periodCount', width: 100 },
  { title: t('Patrol.progress'), dataIndex: 'progress', key: 'progress', scopedSlots: true, width: 120 },
  { title: t('Patrol.calendar.lastTime'), dataIndex: 'lastExecutionTime', key: 'last', scopedSlots: true, width: 180 },
  { title: t('Patrol.actions'), dataIndex: 'actions', key: 'actions', scopedSlots: true, width: 100 },
])
</script>
<style scoped>
.patrol-records { display: flex; flex-direction: column; gap: var(--space-3, 16px); min-height: 0; overflow: hidden; }
.patrol-records > .patrol-filter-bar { flex: none; }
.patrol-records > :deep(.jtable-body-spin) { min-width: 0; }
</style>
