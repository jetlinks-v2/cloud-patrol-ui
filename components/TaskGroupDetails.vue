<template>
  <a-descriptions :column="2" bordered>
    <a-descriptions-item :label="t('Patrol.taskGroupId')">{{ group.id }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.belongDate')">{{ group.belongDate }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.point')">{{ group.pointName }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.post')">{{ group.postName }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.taskPeriod')" :span="2">{{ dateTime(group.startTime) }} ～ {{ dateTime(group.endTime) }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.requiredCount')">{{ group.requiredCount }}</a-descriptions-item>
  </a-descriptions>
  <a-typography-title :level="5">{{ t('Patrol.periodTasks') }}</a-typography-title>
  <j-pro-table :columns="columns" :request="queryRecordPeriods" :params="params" mode="TABLE"
    type="PAGE" row-key="id" :alert-show="false" :scroll="{ x: 1300 }"
    :default-params="{ sorts: [{ name: 'periodNo', order: 'asc' }, { name: 'id', order: 'asc' }] }">
    <template #period="row">{{ dateTime(row.startTime) }} ～ {{ dateTime(row.endTime) }}</template>
    <template #category="row"><ConfigReference resource="categories" :id="row.categoryId" /></template>
    <template #state="row">{{ t(`Patrol.states.${taskState(row)}`) }}</template>
    <template #last="row">{{ dateTime(row.lastExecutionTime) }}</template>
    <template #actions="row"><a-button type="link" @click="taskId = row.id">{{ t('Patrol.recordDetails') }}</a-button></template>
  </j-pro-table>
  <a-typography-title :level="5">{{ t('Patrol.executionHistory') }}</a-typography-title>
  <a-button v-if="taskId" type="link" @click="taskId = undefined">{{ t('Patrol.allPeriods') }}</a-button>
  <ExecutionHistory :task-group-id="group.id" :task-id="taskId" />
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem, TypographyTitle as ATypographyTitle } from 'ant-design-vue'
import type { TaskGroup } from '../api/types'
import { queryRecordPeriods } from '../api/patrol'
import { dateTime, taskState } from '../model/display'
import ExecutionHistory from './ExecutionHistory.vue'
import ConfigReference from './ConfigReference.vue'
const props = defineProps<{ group: TaskGroup }>()
const { t } = useI18n(), taskId = ref<string>()
const params = computed(() => ({ terms: [{ column: 'taskGroupId', termType: 'eq', value: props.group.id }] }))
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
