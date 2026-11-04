<template>
  <a-space direction="vertical" style="width:100%" :size="16">
    <a-space wrap>
      <span>{{ t('Patrol.statistics.period') }}</span>
      <a-range-picker v-model:value="range" value-format="YYYY-MM-DD" :allow-clear="false" />
      <span>{{ t('Patrol.category') }}</span>
      <div style="width:240px"><RemoteSelect resource="categories" v-model="categoryIds" multiple /></div>
      <a-button :loading="loading" @click="reload">{{ t('Patrol.refresh') }}</a-button>
      <a-button @click="reset">{{ t('Patrol.statistics.reset') }}</a-button>
      <a-button :loading="exporting" :disabled="loading || !report" @click="exportReport">{{ t('Patrol.statistics.export') }}</a-button>
    </a-space>
    <a-alert type="info" :message="t(people ? 'Patrol.statistics.peopleHint' : 'Patrol.statistics.hint')" />
    <a-alert v-if="failed || exportFailed" type="error" :message="t(exportFailed ? 'Patrol.statistics.exportFailed' : 'Patrol.loadFailed')" />
    <a-descriptions v-if="report" :title="t('Patrol.statistics.total')" bordered size="small" :column="4">
      <a-descriptions-item v-for="metric in totals" :key="metric.label" :label="metric.label">{{ metric.value }}</a-descriptions-item>
    </a-descriptions>
    <a-table :loading="loading" :data-source="rows" :columns="columns" row-key="id" :pagination="{ pageSize: 20 }" :scroll="{ x: 1000 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'period'">{{ report?.from }} ～ {{ report?.to }}</template>
        <template v-else-if="column.key === 'remainingTasks'">{{ record.taskCount - record.completedTasks }}</template>
        <template v-else-if="column.key === 'rate'">{{ (qualification ? record.qualification : record.coverage).toFixed(2) }}%</template>
      </template>
    </a-table>
  </a-space>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Space as ASpace, RangePicker as ARangePicker, Button as AButton, Alert as AAlert, Table as ATable,
  Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem } from 'ant-design-vue'
import RemoteSelect from './RemoteSelect.vue'
import { useStatistics } from '../composables/useStatistics'
const props = defineProps<{ people?: boolean; qualification?: boolean }>()
const { t } = useI18n()
const { range, categoryIds, rows, report, loading, failed, exporting, exportFailed, reload, reset, exportReport } = useStatistics(!!props.people, !!props.qualification)
const totals = computed(() => {
  const row = report.value?.total
  if (!row) return []
  return props.qualification ? [
    { label: t('Patrol.calendar.pointCount'), value: row.pointCount },
    { label: t('Patrol.windowCount'), value: row.taskCount },
    { label: t('Patrol.completeWindows'), value: row.completedTasks },
    { label: t('Patrol.statistics.remainingTasks'), value: row.taskCount - row.completedTasks },
    { label: t('Patrol.statistics.qualification'), value: `${row.qualification.toFixed(2)}%` },
  ] : [
    { label: t('Patrol.requiredCount'), value: row.expected },
    { label: t('Patrol.completedCount'), value: row.completed },
    { label: t('Patrol.statistics.remaining'), value: row.missing },
    { label: t('Patrol.statistics.coverage'), value: `${row.coverage.toFixed(2)}%` },
  ]
})
const columns = computed(() => [
  { title: t(props.people ? 'Patrol.statistics.appointed' : 'Patrol.point'), dataIndex: 'name', key: 'name' },
  { title: t('Patrol.statistics.period'), key: 'period', width: 250 },
  { title: t('Patrol.calendar.pointCount'), dataIndex: 'pointCount', key: 'pointCount' },
  ...(props.qualification ? [
    { title: t('Patrol.windowCount'), dataIndex: 'taskCount', key: 'taskCount' },
    { title: t('Patrol.completeWindows'), dataIndex: 'completedTasks', key: 'completedTasks' },
    { title: t('Patrol.statistics.remainingTasks'), key: 'remainingTasks' },
  ] : [
    { title: t('Patrol.requiredCount'), dataIndex: 'expected', key: 'expected' },
    { title: t('Patrol.completedCount'), dataIndex: 'completed', key: 'completed' },
    { title: t('Patrol.statistics.remaining'), dataIndex: 'missing', key: 'missing' },
  ]),
  { title: t(props.qualification ? 'Patrol.statistics.qualification' : 'Patrol.statistics.coverage'), key: 'rate' },
])
</script>
