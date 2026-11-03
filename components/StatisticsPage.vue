<template>
  <a-space direction="vertical" style="width:100%">
    <a-space>
      <a-range-picker v-model:value="range" value-format="YYYY-MM-DD" :allow-clear="false" />
      <div style="width:240px"><RemoteSelect resource="categories" v-model="categoryIds" multiple /></div>
      <a-button :loading="loading" @click="reload">{{ t('Patrol.refresh') }}</a-button>
    </a-space>
    <a-alert type="info" :message="t(people ? 'Patrol.statistics.peopleHint' : 'Patrol.statistics.hint')" />
    <a-alert v-if="failed" type="error" :message="t('Patrol.loadFailed')" />
    <a-table :loading="loading" :data-source="rows" :columns="columns" row-key="id" :pagination="{ pageSize: 20 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'rate'">{{ (qualification ? record.qualification : record.coverage).toFixed(2) }}%</template>
      </template>
    </a-table>
  </a-space>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Space as ASpace, RangePicker as ARangePicker, Button as AButton, Alert as AAlert, Table as ATable } from 'ant-design-vue'
import RemoteSelect from './RemoteSelect.vue'
import { useStatistics } from '../composables/useStatistics'
const props = defineProps<{ people?: boolean; qualification?: boolean }>()
const { t } = useI18n()
const { range, categoryIds, rows, loading, failed, reload } = useStatistics(!!props.people)
const columns = computed(() => [
  { title: t(props.people ? 'Patrol.statistics.appointed' : 'Patrol.point'), dataIndex: 'name', key: 'name' },
  { title: t('Patrol.calendar.pointCount'), dataIndex: 'pointCount', key: 'pointCount' },
  ...(props.qualification ? [
    { title: t('Patrol.windowCount'), dataIndex: 'taskCount', key: 'taskCount' },
    { title: t('Patrol.completeWindows'), dataIndex: 'completedTasks', key: 'completedTasks' },
  ] : [
    { title: t('Patrol.requiredCount'), dataIndex: 'expected', key: 'expected' },
    { title: t('Patrol.completedCount'), dataIndex: 'completed', key: 'completed' },
    { title: t('Patrol.statistics.remaining'), dataIndex: 'missing', key: 'missing' },
  ]),
  { title: t(props.qualification ? 'Patrol.statistics.qualification' : 'Patrol.statistics.coverage'), key: 'rate' },
])
</script>
