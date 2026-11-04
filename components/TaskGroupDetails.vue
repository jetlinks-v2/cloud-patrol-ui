<template>
  <a-descriptions :column="2" bordered>
    <a-descriptions-item :label="t('Patrol.belongDate')">{{ group.belongDate }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.point')">{{ group.pointName }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.post')">{{ group.postName }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.taskPeriod')" :span="2">{{ dateTime(group.startTime) }} ～ {{ dateTime(group.endTime) }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.category')">{{ group.categoryName || '—' }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.level')">{{ group.levelName || '—' }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.progress')">{{ group.completedCount ?? 0 }}/{{ group.requiredCount ?? 0 }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.lastTime')">{{ dateTime(group.lastExecutionTime) }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.taskGroupId')" :span="2">{{ group.id }}</a-descriptions-item>
  </a-descriptions>
  <a-typography-title :level="5">{{ t('Patrol.periodTasks') }}</a-typography-title>
  <j-pro-table :columns="columns" :request="queryRecordPeriods" :params="params" mode="TABLE"
    type="PAGE" row-key="id" :alert-show="false" :scroll="{ x: 1300 }"
    :default-params="{ sorts: [{ name: 'periodNo', order: 'asc' }, { name: 'id', order: 'asc' }] }">
    <template #period="row">{{ dateTime(row.startTime) }} ～ {{ dateTime(row.endTime) }}</template>
    <template #category="row">{{ row.categoryName || '—' }}</template>
    <template #state="row">{{ t(`Patrol.states.${taskState(row)}`) }}</template>
    <template #last="row">{{ dateTime(row.lastExecutionTime) }}</template>
    <template #actions="row"><a-button type="link" @click="taskId = row.id">{{ t('Patrol.recordDetails') }}</a-button></template>
  </j-pro-table>
  <a-typography-title :level="5">{{ t('Patrol.executionHistory') }}</a-typography-title>
  <a-button v-if="taskId" type="link" @click="taskId = undefined">{{ t('Patrol.allPeriods') }}</a-button>
  <ExecutionHistory :task-group-id="group.id" :task-id="taskId" />
  <a-typography-title :level="5">{{ t('Patrol.missed.title') }}</a-typography-title>
  <MissedRecords :task-group-id="group.id" @changed="refresh" />
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem, TypographyTitle as ATypographyTitle } from 'ant-design-vue'
import type { TaskGroup } from '../api/types'
import { queryRecordPeriods, queryTaskGroups } from '../api/patrol'
import { dateTime, taskState } from '../model/display'
import ExecutionHistory from './ExecutionHistory.vue'
import MissedRecords from './MissedRecords.vue'
const props = defineProps<{ group: TaskGroup }>()
const emit = defineEmits<{ changed: [] }>()
const group = ref(props.group), version = ref(0)
watch(() => props.group, value => { group.value = value })
const { t } = useI18n(), taskId = ref<string>()
const params = computed(() => ({ _refresh: version.value, terms: [{ column: 'taskGroupId', termType: 'eq', value: props.group.id }] }))
async function refresh() {
  version.value++
  emit('changed')
  const response = await queryTaskGroups({ terms: [{ column: 'id', termType: 'eq', value: props.group.id }], pageSize: 1 })
  if (response.success && response.result.data[0]) group.value = response.result.data[0]
}
const columns = computed(() => [
  { title: t('Patrol.periodNo'), dataIndex: 'periodNo', key: 'periodNo', width: 85 },
  { title: t('Patrol.periodTasks'), dataIndex: 'period', key: 'period', scopedSlots: true, width: 310 },
  { title: t('Patrol.category'), dataIndex: 'categoryId', key: 'category', scopedSlots: true, width: 150 },
  { title: t('Patrol.level'), dataIndex: 'levelName', key: 'levelName', width: 150 },
  { title: t('Patrol.state'), dataIndex: 'state', key: 'state', scopedSlots: true, width: 85 },
  { title: t('Patrol.calendar.lastTime'), dataIndex: 'lastExecutionTime', key: 'last', scopedSlots: true, width: 180 },
  { title: t('Patrol.requiredCount'), dataIndex: 'requiredCount', key: 'requiredCount', width: 90 },
  { title: t('Patrol.completedCount'), dataIndex: 'completedCount', key: 'completedCount', width: 90 },
  { title: t('Patrol.actions'), dataIndex: 'actions', key: 'actions', scopedSlots: true, width: 135 },
])
</script>
