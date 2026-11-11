<script setup lang="ts">
import { Alert, Button, Input, Modal, Spin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'
import { dateTime } from '../../model/display'
import { canApplyMissed, missedState } from '../../model/missed'
import { useMobileMissed } from '../useMobileMissed'
const { t, te } = useI18n()
const emit = defineEmits<{ busy: [value: boolean] }>()
const { from, to, rows, selection, state, loading, saving, error, userId, reason, open, invalid, events,
  historyLoading, submittable, load, apply, withdraw, history } = useMobileMissed()
watch(saving, value => emit('busy', value))
watch(state, () => { selection.value = [] })
</script>
<template>
  <form class="history-filters" @submit.prevent="load">
    <label class="filter-wide"><span>{{ t('Patrol.missed.status') }}</span><select v-model="state"><option value="">{{ t('Mobile.all') }}</option>
      <option v-for="value in ['none', 'pending', 'approved', 'rejected', 'withdrawn']" :key="value" :value="value">{{ t(`Patrol.missed.states.${value}`) }}</option>
    </select></label>
    <div class="filter-date-range"><span>{{ t('Mobile.filterDate') }}</span><input v-model="from" type="date" required :max="to" :aria-label="t('Patrol.missed.createdFrom')" /><span class="date-separator" aria-hidden="true">—</span><input v-model="to" type="date" required :min="from" :aria-label="t('Patrol.missed.createdTo')" /></div>
    <div class="history-filter-actions filter-wide"><Button html-type="submit" type="primary" :loading="loading" :disabled="saving">{{ t('Mobile.search') }}</Button></div>
  </form>
  <Alert v-if="error" class="notice" type="error" :message="te(error) ? t(error) : error" show-icon />
  <div v-if="loading" class="empty"><Spin /></div>
  <p v-else-if="!rows.length && !error" class="empty">{{ t('Patrol.missed.empty') }}</p>
  <section v-for="item in rows" :key="item.id" class="panel">
    <div class="card-heading"><h2>{{ item.pointName || '—' }}</h2><span>{{ t(`Patrol.missed.states.${missedState(item)}`) }}</span></div>
    <p class="muted">{{ item.roleName }} · {{ t('Patrol.missed.occurrence') }} {{ item.occurrenceNo }}</p>
    <p>{{ dateTime(item.periodStartTime) }} ～ {{ dateTime(item.periodEndTime) }}</p>
    <label v-if="canApplyMissed(item)"><input v-model="selection" type="checkbox" :value="item.id" :disabled="saving" /> {{ t('Patrol.missed.select') }}</label>
    <dl v-if="item.applicationId" class="missed-summary">
      <dt>{{ t('Patrol.missed.applicant') }}</dt><dd>{{ item.applicantName || '—' }}</dd>
      <dt>{{ t('Patrol.missed.applyTime') }}</dt><dd>{{ dateTime(item.applyTime) }}</dd>
      <dt>{{ t('Patrol.missed.reason') }}</dt><dd>{{ item.reason }}</dd>
      <template v-if="item.auditTime"><dt>{{ t('Patrol.missed.auditor') }}</dt><dd>{{ item.auditorName || '—' }}</dd>
        <dt>{{ t('Patrol.missed.auditTime') }}</dt><dd>{{ dateTime(item.auditTime) }}</dd>
        <dt>{{ t('Patrol.missed.auditRemark') }}</dt><dd>{{ item.auditRemark || '—' }}</dd></template>
    </dl>
    <Button type="link" @click="history(item)">{{ t('Patrol.missed.history') }}</Button>
    <Button v-if="missedState(item) === 'pending' && item.applicantId === userId" type="link" :disabled="saving" @click="withdraw(item)">{{ t('Patrol.missed.withdraw') }}</Button>
  </section>
  <Button block type="primary" :disabled="!submittable || saving" @click="reason = ''; invalid = false; open = true">{{ t('Patrol.missed.apply') }} ({{ selection.length }})</Button>
  <Modal :open="open" :title="t('Patrol.missed.apply')" :ok-text="t('Mobile.confirm')" :cancel-text="t('Mobile.cancel')" :confirm-loading="saving" :mask-closable="false" @ok="apply" @cancel="!saving && (open = false)">
    <Input.TextArea v-model:value="reason" :rows="4" :maxlength="500" show-count :placeholder="t('Patrol.missed.reason')" />
    <Alert v-if="invalid" type="error" :message="t('Patrol.missed.reasonRequired')" />
  </Modal>
  <Modal :open="!!events" :title="t('Patrol.missed.history')" :footer="null" @cancel="events = undefined">
    <Spin :spinning="historyLoading"><div v-for="event in events" :key="event.id" class="panel">
      <p>{{ t(`Patrol.missed.actions.${event.action}`) }} · {{ event.actorName || '—' }}</p>
      <p>{{ dateTime(event.createTime) }}</p><p>{{ event.remark || '—' }}</p>
    </div></Spin>
  </Modal>
</template>
<style scoped>
.missed-summary { display:grid; grid-template-columns:5.5em minmax(0,1fr); gap:8px; font-size:14px; }
.missed-summary dt { color:#737373; }
.missed-summary dd { margin:0; overflow-wrap:anywhere; white-space:pre-wrap; }
input[type=checkbox] { width:18px; height:18px; vertical-align:middle; }
</style>
