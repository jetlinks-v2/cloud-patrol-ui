<template>

  <div class="patrol-calendar">
    <ProjectFilterBar>
      <a-month-picker v-model:value="month" :allow-clear="false" />
      <a-button :loading="loading" @click="reload">{{ t('Patrol.refresh') }}</a-button>
    </ProjectFilterBar>
    <a-alert v-if="failed" type="error" :message="t('Patrol.loadFailed')" />
    <a-descriptions v-if="result" bordered :column="2">
      <a-descriptions-item v-for="key in summaryKeys" :key="key" :label="t(`Patrol.calendar.${key}`)">{{ result.summary[key] }}</a-descriptions-item>
    </a-descriptions>
    <p v-if="result">{{ t('Patrol.calendar.monthlyPointHint') }}</p>
    <a-spin :spinning="loading">
      <a-calendar :value="month" @panel-change="panelChange" @select="selectDate">
        <template #dateCellRender="{ current }">
          <template v-if="days.get(current.format('YYYY-MM-DD'))">
            <div v-for="shift in days.get(current.format('YYYY-MM-DD'))!.shifts.slice(0, 3)" :key="`${shift.name}-${shift.startTime}-${shift.endTime}`" class="calendar-shift">
              {{ shift.name }} {{ time(shift.startTime) }}～{{ time(shift.endTime) }} · {{ shift.staffCount }}{{ t('Patrol.calendar.personUnit') }}
            </div>
            <div v-if="days.get(current.format('YYYY-MM-DD'))!.shifts.length > 3">{{ t('Patrol.calendar.moreShifts', { count: days.get(current.format('YYYY-MM-DD'))!.shifts.length - 3 }) }}</div>
            <div v-if="!days.get(current.format('YYYY-MM-DD'))!.shifts.length">{{ t('Patrol.calendar.unscheduled') }}</div>
            <div class="calendar-points" :title="t('Patrol.calendar.pointProgress')" :aria-label="t('Patrol.calendar.pointProgressValue', {
              completed: days.get(current.format('YYYY-MM-DD'))!.completedPointCount,
              expected: days.get(current.format('YYYY-MM-DD'))!.pointCount,
            })">{{ days.get(current.format('YYYY-MM-DD'))!.completedPointCount }}/{{ days.get(current.format('YYYY-MM-DD'))!.pointCount }}</div>
            <div v-if="days.get(current.format('YYYY-MM-DD'))!.missedPointCount" class="calendar-exception">{{ t('Patrol.calendar.missedPointCount') }} {{ days.get(current.format('YYYY-MM-DD'))!.missedPointCount }}</div>
            <div v-if="days.get(current.format('YYYY-MM-DD'))!.absentPointCount" class="calendar-exception">{{ t('Patrol.calendar.absentPointCount') }} {{ days.get(current.format('YYYY-MM-DD'))!.absentPointCount }}</div>
          </template>
        </template>
      </a-calendar>
    </a-spin>
    <a-drawer :open="!!selectedDate" :title="selectedDate" :width="1150" @close="closeDay">
      <a-space direction="vertical" style="width: 100%">
        <a-button :loading="exporting" :disabled="dayLoading || !detail" @click="exportDay">{{ t('Patrol.calendar.exportDay') }}</a-button>
        <a-alert v-if="dayFailed || exportFailed" type="error" :message="t('Patrol.loadFailed')" />
        <a-button v-if="dayFailed" @click="openDay(selectedDate)">{{ t('Patrol.refresh') }}</a-button>
        <a-spin :spinning="dayLoading"><CalendarDayDetails v-if="detail" :detail="detail" /></a-spin>
      </a-space>
    </a-drawer>
  </div>

</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Dayjs } from 'dayjs'
import { MonthPicker as AMonthPicker, Button as AButton, Space as ASpace, Calendar as ACalendar,
  Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem, Alert as AAlert, Spin as ASpin, Drawer as ADrawer } from 'ant-design-vue'
import CalendarDayDetails from '../../../components/CalendarDayDetails.vue'
import ProjectFilterBar from '../../../components/ProjectFilterBar.vue'
import { useCalendar } from '../../../composables/useCalendar'
import { businessTime } from '../../../model/display'
const { t } = useI18n()
const { month, selectedDate, result, detail, days, loading, failed, dayLoading, dayFailed, exporting, exportFailed,
  reload, openDay, closeDay, exportDay } = useCalendar()
const summaryKeys = ['scheduledDayCount', 'staffCount', 'pointCount', 'completedPointCount', 'missedPointCount', 'absentPointCount'] as const
const time = (value: number) => businessTime(value).format('HH:mm')
function panelChange(value: string | Dayjs) { if (typeof value !== 'string') month.value = value }
function selectDate(date: Dayjs, info: { source: string }) {
  if (info.source === 'date' && date.format('YYYY-MM') === month.value.format('YYYY-MM')) void openDay(date.format('YYYY-MM-DD'))
}
</script>
<style scoped>
.patrol-calendar { display: flex; flex-direction: column; gap: var(--space-3, 16px); }
.calendar-shift { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
.calendar-points { font-size: 14px; font-weight: 600; }
.calendar-exception { color: var(--ant-error-color, #ff4d4f); font-size: 12px; }
</style>
