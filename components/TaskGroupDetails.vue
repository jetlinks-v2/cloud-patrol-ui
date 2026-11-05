<template>
  <div class="task-group-details">
  <a-descriptions :column="2" bordered>
    <a-descriptions-item :label="t('Patrol.belongDate')">{{ group.belongDate }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.point')">{{ group.pointName }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.post')">{{ group.roleId ? group.roleName : t('Patrol.allStaffPatrol') }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.taskPeriod')" :span="2">{{ dateTime(group.startTime) }} ～ {{ dateTime(group.endTime) }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.category')">{{ group.categoryName || '—' }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.level')">{{ group.levelName || '—' }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.progress')">{{ group.completedCount ?? 0 }}/{{ group.requiredCount ?? 0 }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.lastTime')">{{ dateTime(group.lastExecutionTime) }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.taskGroupId')" :span="2">{{ group.id }}</a-descriptions-item>
  </a-descriptions>
  <a-typography-title :level="5">{{ t('Patrol.periodTasks') }}</a-typography-title>
  <j-pro-table :columns="columns" :request="queryRecordPeriods" :params="params" mode="TABLE"
    type="PAGE" row-key="id" size="small" :alert-show="false" :scroll="{ x: 720, y: false }"
    :body-style="{ padding: 0, height: 'auto' }"
    :default-params="{ sorts: [{ name: 'periodNo', order: 'asc' }, { name: 'id', order: 'asc' }] }">
    <template #period="row">{{ dateTime(row.startTime) }} {{ t('Patrol.periodTo') }} {{ dateTime(row.endTime) }}</template>
    <template #progress="row">{{ row.completedCount ?? 0 }}/{{ row.requiredCount ?? 0 }}</template>
    <template #state="row">{{ t(`Patrol.states.${taskState(row)}`) }}</template>
  </j-pro-table>
  <a-typography-title :level="5">{{ t('Patrol.patrolRecords') }}</a-typography-title>
  <ExecutionHistory :task-group-id="group.id" :point-location="pointLocation" />
  <a-typography-title :level="5">{{ t('Patrol.missed.title') }}</a-typography-title>
  <MissedRecords :task-group-id="group.id" @changed="refresh" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem, TypographyTitle as ATypographyTitle } from 'ant-design-vue'
import type { TaskGroup } from '../api/types'
import { queryConfig, queryRecordPeriods, queryTaskGroups } from '../api/patrol'
import { dateTime, taskState } from '../model/display'
import ExecutionHistory from './ExecutionHistory.vue'
import MissedRecords from './MissedRecords.vue'
const props = defineProps<{ group: TaskGroup }>()
const emit = defineEmits<{ changed: [] }>()
const group = ref(props.group), version = ref(0)
watch(() => props.group, value => { group.value = value })
const { t } = useI18n()
const pointLocation = ref('')
// 位置取当前点位配置，不将它伪装成打卡时的定位快照；切换任务时丢弃旧请求结果。
watch(() => [props.group.pointId, props.group.projectId] as const, async ([pointId, projectId], _, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  pointLocation.value = ''
  if (!pointId) return
  try {
    const response = await queryConfig('points', { pageSize: 1, terms: [{ column: 'id', termType: 'eq', value: pointId }] }, projectId)
    if (active && response.success) pointLocation.value = response.result.data[0]?.location || ''
  } catch { /* 点位已删除或无配置查看权限时保留空值，巡更事实仍可查看。 */ }
}, { immediate: true })
const params = computed(() => ({ _refresh: version.value, terms: [{ column: 'taskGroupId', termType: 'eq', value: props.group.id }] }))
async function refresh() {
  version.value++
  emit('changed')
  const response = await queryTaskGroups({ terms: [{ column: 'id', termType: 'eq', value: props.group.id }], pageSize: 1 })
  if (response.success && response.result.data[0]) group.value = response.result.data[0]
}
const columns = computed(() => [
  { title: t('Patrol.belongPeriod'), dataIndex: 'period', key: 'period', scopedSlots: true, width: 460 },
  { title: t('Patrol.patrolCount'), dataIndex: 'progress', key: 'progress', scopedSlots: true, width: 130 },
  { title: t('Patrol.state'), dataIndex: 'state', key: 'state', scopedSlots: true, width: 130 },
])
</script>
<style scoped>
.task-group-details > :deep(.ant-typography) { margin: 20px 0 12px; }
.task-group-details :deep(.jtable-body-spin),
.task-group-details :deep(.jtable-body),
.task-group-details :deep(.jtable-content-spin),
.task-group-details :deep(.ant-spin-nested-loading),
.task-group-details :deep(.ant-spin-container),
.task-group-details :deep(.jtable-box),
.task-group-details :deep(.ant-table-wrapper),
.task-group-details :deep(.ant-table),
.task-group-details :deep(.ant-table-container),
.task-group-details :deep(.ant-table-content) { height: auto; flex: none; }
</style>
