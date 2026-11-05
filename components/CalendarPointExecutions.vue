<template>
  <a-table :columns="columns" :data-source="tasks" row-key="id" size="small" :pagination="{ pageSize: 10 }" :scroll="{ x: 1000 }">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'role'">{{ record.roleId ? record.roleName : t('Patrol.allStaffPatrol') }}</template>
      <template v-if="column.key === 'period'">{{ dateTime(record.startTime) }} ～ {{ dateTime(record.endTime) }}</template>
      <template v-if="column.key === 'progress'">{{ record.completedCount }}/{{ record.requiredCount }}</template>
      <template v-if="column.key === 'last'">{{ dateTime(record.lastExecutionTime) }}</template>
      <template v-if="column.key === 'status'">{{ t(`Patrol.states.${taskState(record as Task)}`) }}</template>
    </template>
  </a-table>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Table as ATable } from 'ant-design-vue'
import type { Task } from '../api/types'
import { dateTime, taskState } from '../model/display'
defineProps<{ tasks: Task[] }>()
const { t } = useI18n()
const columns = computed(() => [
  { title: t('Patrol.post'), key: 'role' },
  { title: t('Patrol.periodTasks'), key: 'period', width: 310 },
  { title: t('Patrol.category'), dataIndex: 'categoryName' },
  { title: t('Patrol.level'), dataIndex: 'levelName' },
  { title: t('Patrol.calendar.progress'), key: 'progress' },
  { title: t('Patrol.calendar.lastTime'), key: 'last' },
  { title: t('Patrol.state'), key: 'status' },
])
</script>
