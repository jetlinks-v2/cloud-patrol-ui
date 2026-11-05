<template>
  <section>
    <a-space wrap style="margin-bottom:12px">
      <a-select v-model:value="status" allow-clear :placeholder="t('Patrol.missed.status')" style="width:160px" :options="statuses" />
      <a-button :loading="loading" @click="load">{{ t('Patrol.missed.refresh') }}</a-button>
      <j-permission-button has-permission="patrol/records:applyMissed" :disabled="!canApply || saving" @click="begin('apply')">{{ t('Patrol.missed.apply') }}</j-permission-button>
      <j-permission-button has-permission="patrol/records:auditMissed" :disabled="!canAudit || saving" @click="begin('approve')">{{ t('Patrol.missed.approve') }}</j-permission-button>
      <j-permission-button has-permission="patrol/records:auditMissed" :disabled="!canAudit || saving" @click="begin('reject')">{{ t('Patrol.missed.reject') }}</j-permission-button>
    </a-space>
    <a-alert v-if="failed" type="error" show-icon :message="t('Patrol.missed.loadFailed')" />
    <a-alert v-if="actionFailed && !action" type="error" :message="t('Patrol.missed.actionFailed')" />
    <a-table :columns="columns" :data-source="rows" :loading="loading" row-key="id" :scroll="{ x: 1700 }"
      :row-selection="{ selectedRowKeys: selected, onChange: select, getCheckboxProps: (row) => ({ disabled: missedState(row) === 'approved' }) }" :pagination="{ pageSize: 10, showSizeChanger: true }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'period'">{{ dateTime(record.periodStartTime) }} ～ {{ dateTime(record.periodEndTime) }}</template>
        <template v-else-if="column.key === 'status'">{{ t(`Patrol.missed.states.${missedState(rowOf(record))}`) }}</template>
        <template v-else-if="column.key === 'applyTime'">{{ dateTime(record.applyTime) }}</template>
        <template v-else-if="column.key === 'auditTime'">{{ dateTime(record.auditTime) }}</template>
        <template v-else-if="column.key === 'actions'">
          <a-button type="link" @click="history(rowOf(record))">{{ t('Patrol.missed.history') }}</a-button>
          <j-permission-button v-if="missedState(rowOf(record)) === 'pending'" type="link" has-permission="patrol/records:applyMissed" :disabled="saving" @click="withdraw(rowOf(record))">{{ t('Patrol.missed.withdraw') }}</j-permission-button>
        </template>
        <template v-else>{{ typeof column.dataIndex === 'string' ? record[column.dataIndex] || '—' : '—' }}</template>
      </template>
    </a-table>
    <a-modal :open="!!action" :title="t(`Patrol.missed.${action}`)" :confirm-loading="saving" :mask-closable="false" @ok="save" @cancel="!saving && (action = undefined)">
      <a-alert v-if="action === 'approve'" type="info" :message="t('Patrol.missed.approveHint')" style="margin-bottom:12px" />
      <a-alert v-if="actionFailed" type="error" :message="t('Patrol.missed.actionFailed')" />
      <a-textarea v-model:value="remark" :maxlength="500" show-count :rows="4" :placeholder="t(action === 'apply' ? 'Patrol.missed.reason' : 'Patrol.missed.auditRemark')" />
      <a-alert v-if="inputError" type="error" :message="t('Patrol.missed.reasonRequired')" />
    </a-modal>
    <a-modal :open="!!events" :title="t('Patrol.missed.history')" :footer="null" @cancel="events = undefined">
      <a-spin :spinning="historyLoading">
        <a-alert v-if="historyFailed" type="error" :message="t('Patrol.missed.loadFailed')" />
        <a-timeline><a-timeline-item v-for="event in events" :key="event.id">
          {{ t(`Patrol.missed.actions.${event.action}`) }} · {{ event.actorName || '—' }} · {{ dateTime(event.createTime) }}
          <p>{{ event.remark || '—' }}</p>
        </a-timeline-item></a-timeline>
      </a-spin>
    </a-modal>
  </section>
</template>
<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Space as ASpace, Select as ASelect, Table as ATable, Modal as AModal, Alert as AAlert, Textarea as ATextarea, Spin as ASpin, Timeline as ATimeline, TimelineItem as ATimelineItem } from 'ant-design-vue'
import { dateTime } from '../model/display'
import { missedState, type MissedItem } from '../model/missed'
import { useMissed } from '../composables/useMissed'
const props = defineProps<{ taskGroupId: string }>()
const emit = defineEmits<{ changed: [] }>()
const { t } = useI18n()
const { actionFailed, rows, selected, loading, saving, failed, status, action, remark, inputError, events, historyLoading, historyFailed,
  canApply, canAudit, load, begin, save, withdraw, history } = useMissed(toRef(props, 'taskGroupId'), () => emit('changed'))
// Ant Table 的插槽公开为通用对象；该表只接收 MissedItem[]，在组件边界恢复行类型。
const rowOf = (record: Record<string, unknown>) => record as unknown as MissedItem
const select = (keys: (string | number)[]) => { selected.value = keys.map(String) }
const statuses = computed(() => ['none', 'pending', 'approved', 'rejected', 'withdrawn'].map(value => ({ value, label: t(`Patrol.missed.states.${value}`) })))
const columns = computed(() => [
  { title: t('Patrol.missed.occurrence'), key: 'occurrenceNo', dataIndex: 'occurrenceNo', width: 90 },
  { title: t('Patrol.periodTasks'), key: 'period', width: 320 },
  { title: t('Patrol.post'), key: 'roleName', dataIndex: 'roleName', width: 140 },
  { title: t('Patrol.missed.status'), key: 'status', width: 110 },
  { title: t('Patrol.missed.applicant'), key: 'applicantName', dataIndex: 'applicantName', width: 120 },
  { title: t('Patrol.missed.reason'), key: 'reason', dataIndex: 'reason', width: 220 },
  { title: t('Patrol.missed.applyTime'), key: 'applyTime', width: 180 },
  { title: t('Patrol.missed.auditor'), key: 'auditorName', dataIndex: 'auditorName', width: 120 },
  { title: t('Patrol.missed.auditTime'), key: 'auditTime', width: 180 },
  { title: t('Patrol.missed.auditRemark'), key: 'auditRemark', dataIndex: 'auditRemark', width: 220 },
  { title: t('Patrol.actions'), key: 'actions', fixed: 'right' as const, width: 180 },
])
</script>
