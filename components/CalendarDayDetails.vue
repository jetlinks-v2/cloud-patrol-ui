<template>
  <a-descriptions bordered :column="3">
    <a-descriptions-item :label="t('Patrol.calendar.staffCount')">{{ detail.staffCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.shiftCount')">{{ detail.shiftCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.pointCount')">{{ detail.pointCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.requiredCount')">{{ detail.expectedCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.completedCount')">{{ detail.completedCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.overdueMissing')">{{ detail.missedCount }}</a-descriptions-item>
  </a-descriptions>
  <a-tabs>
    <a-tab-pane key="staff" :tab="t('Patrol.calendar.staff')">
      <a-table :columns="staffColumns" :data-source="detail.staff" row-key="id" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'person'">{{ record.userName || record.userId }}</template>
          <template v-if="column.key === 'shift'">{{ record.shiftName || record.name }}</template>
          <template v-if="column.key === 'period'">{{ dateTime(record.startTime) }} ～ {{ dateTime(record.endTime) }}</template>
          <template v-if="column.key === 'status'">{{ t(record.rest ? 'Patrol.rest' : 'Patrol.calendar.scheduled') }}</template>
        </template>
      </a-table>
    </a-tab-pane>
    <a-tab-pane key="tasks" :tab="t('Patrol.periodTasks')">
      <a-table :columns="taskColumns" :data-source="detail.tasks" row-key="id" :pagination="{ pageSize: 10 }" :scroll="{ x: 1100 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'period'">{{ dateTime(record.startTime) }} ～ {{ dateTime(record.endTime) }}</template>
          <template v-if="column.key === 'category'"><ConfigReference resource="categories" :id="record.categoryId" /></template>
          <template v-if="column.key === 'progress'">{{ record.completedCount }}/{{ record.requiredCount }}</template>
          <template v-if="column.key === 'last'">{{ dateTime(record.lastExecutionTime) }}</template>
          <template v-if="column.key === 'status'">{{ t(`Patrol.states.${taskState(record as Task)}`) }}</template>
        </template>
      </a-table>
    </a-tab-pane>
  </a-tabs>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem, Tabs as ATabs, TabPane as ATabPane, Table as ATable } from 'ant-design-vue'
import type { Task } from '../api/types'
import type { CalendarDetail } from '../api/calendar'
import { dateTime, taskState } from '../model/display'
import ConfigReference from './ConfigReference.vue'
defineProps<{ detail: CalendarDetail }>()
const { t } = useI18n()
const staffColumns = computed(() => [
  { title: t('Patrol.person'), key: 'person' }, { title: t('Patrol.shiftName'), key: 'shift' },
  { title: t('Patrol.periodTasks'), key: 'period' }, { title: t('Patrol.state'), key: 'status' },
])
const taskColumns = computed(() => [
  { title: t('Patrol.periodTasks'), key: 'period', width: 310 },
  { title: t('Patrol.point'), dataIndex: 'pointName' },
  { title: t('Patrol.category'), dataIndex: 'categoryId', key: 'category' },
  { title: t('Patrol.level'), dataIndex: 'levelName' },
  { title: t('Patrol.post'), dataIndex: 'postName' },
  { title: t('Patrol.calendar.progress'), key: 'progress' },
  { title: t('Patrol.calendar.lastTime'), key: 'last' }, { title: t('Patrol.state'), key: 'status' },
])
</script>
