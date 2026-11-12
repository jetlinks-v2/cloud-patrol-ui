<template>
  <a-descriptions bordered :column="3">
    <a-descriptions-item :label="t('Patrol.calendar.staffCount')">{{ detail.staffCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.shiftCount')">{{ detail.shiftCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.pointCount')">{{ detail.pointCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.completedPointCount')">{{ detail.completedPointCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.missedPointCount')">{{ detail.missedPointCount }}</a-descriptions-item>
    <a-descriptions-item :label="t('Patrol.calendar.absentPointCount')">{{ detail.absentPointCount }}</a-descriptions-item>
  </a-descriptions>
  <a-tabs>
    <a-tab-pane key="staff" :tab="t('Patrol.calendar.staff')">
      <a-table :columns="staffColumns" :data-source="detail.staff" row-key="id" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'person'">{{ record.userName || '—' }}</template>
          <template v-if="column.key === 'telephone'">{{ detail.staffTelephones?.[record.userId] || '—' }}</template>
          <template v-if="column.key === 'shift'">{{ record.shiftName || record.name }}</template>
          <template v-if="column.key === 'period'">{{ dateTime(record.startTime) }} ～ {{ dateTime(record.endTime) }}</template>
          <template v-if="column.key === 'status'">{{ t(record.rest ? 'Patrol.rest' : 'Patrol.calendar.scheduled') }}</template>
        </template>
      </a-table>
    </a-tab-pane>
    <a-tab-pane key="points" :tab="t('Patrol.calendar.points')">
      <a-alert type="info" show-icon :message="t('Patrol.calendar.pointHint')" style="margin-bottom:12px" />
      <a-table :columns="pointColumns" :data-source="points" row-key="key" :pagination="{ pageSize: 10 }" :scroll="{ x: 800 }">
        <template #expandedRowRender="{ record }"><CalendarPointExecutions :tasks="record.tasks" /></template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roles'">{{ [...record.roles, ...(record.allStaff ? [t('Patrol.allStaffPatrol')] : [])].join('、') || '—' }}</template>
          <template v-if="column.key === 'status'">{{ t(`Patrol.calendar.pointStatus.${record.status}`) }}</template>
          <template v-if="column.key === 'missed'">
            <a-tag v-if="record.missed" color="error">{{ t('Patrol.calendar.hasMissed') }}</a-tag>
            <a-tag v-else-if="record.absent" color="error">{{ t('Patrol.calendar.absent') }}</a-tag>
            <span v-else>—</span>
          </template>
        </template>
      </a-table>
    </a-tab-pane>
  </a-tabs>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem, Tabs as ATabs, TabPane as ATabPane, Table as ATable, Alert as AAlert, Tag as ATag } from 'ant-design-vue'
import type { CalendarDetail } from '../api/calendar'
import { dateTime } from '../model/display'
import { calendarPoints } from '../model/calendar'
import CalendarPointExecutions from './CalendarPointExecutions.vue'
const props = defineProps<{ detail: CalendarDetail }>()
const { t } = useI18n()
const points = computed(() => calendarPoints(props.detail.tasks))
const staffColumns = computed(() => [
  { title: t('Patrol.person'), key: 'person' }, { title: t('Patrol.calendar.telephone'), key: 'telephone' },
  { title: t('Patrol.shiftName'), key: 'shift' },
  { title: t('Patrol.periodTasks'), key: 'period' }, { title: t('Patrol.state'), key: 'status' },
])
const pointColumns = computed(() => [
  { title: t('Patrol.projects.label'), dataIndex: 'projectName' },
  { title: t('Patrol.point'), dataIndex: 'pointName' },
  { title: t('Patrol.post'), key: 'roles' },
  { title: t('Patrol.state'), key: 'status' },
  { title: t('Patrol.calendar.missedStatus'), key: 'missed' },
])
</script>
