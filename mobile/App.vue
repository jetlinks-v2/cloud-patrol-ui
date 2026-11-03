<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Alert, Button, ConfigProvider, Input, Spin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { businessTime, dateTime } from '../model/display'
import { enumValue } from '../model/standards'
import CheckForm from './components/CheckForm.vue'
import RecordDetails from './components/RecordDetails.vue'
import PointGrid from './components/PointGrid.vue'
import { pointGroups, type PointGroup } from './points'
import { useMobilePatrol } from './useMobilePatrol'
import { host } from './transport'
import { useWebView } from './useWebView'
const { t, te } = useI18n()
const { date, tab, mine, categories, rows, records, selected, record, success, loading, sending, uploading,
  error, draft, errors, images, total, locked, reason, load, open, leave, changeAnswer, upload, preview, submit } = useMobilePatrol()
const point = ref<PointGroup>(), now = ref(Date.now())
const activePoint = computed(() => pointGroups(rows.value, '', '', categories.value, now.value).find(item => item.id === point.value?.id) || point.value)
const detail = computed(() => !!selected.value || !!record.value || !!point.value)
const screen = computed(() => ({
  key: selected.value ? `task:${selected.value.task.id}` : record.value ? `record:${record.value.id}` : point.value ? `point:${point.value.id}` : tab.value,
  depth: selected.value || record.value ? (point.value || tab.value === 'history' ? 2 : 1) : point.value || tab.value === 'history' ? 1 : 0,
}))
const { keyboardOpen } = useWebView(screen, locked, back)
const heading = computed(() => t(selected.value ? 'Mobile.inspectionTitle' : record.value ? 'Mobile.recordTitle'
  : point.value ? 'Mobile.pointDetails' : tab.value === 'history' ? 'Mobile.historyTitle' : 'Mobile.pointsTitle'))
let timer: ReturnType<typeof setInterval>
function back() {
  if (locked.value) return
  if (selected.value || record.value) leave()
  else if (point.value) point.value = undefined
  else if (tab.value === 'history') { date.value = businessTime().format('YYYY-MM-DD'); tab.value = 'tasks' }
  else if (host.back) host.back()
  else if (window.history.length > 1) window.history.back()
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (selected.value && (draft.value.pending || draft.value.remark || draft.value.answers.some(answer => answer.value || answer.attachmentId))) {
    event.preventDefault(); event.returnValue = ''
  }
}
function resume() {
  now.value = Date.now()
  if (document.hidden || detail.value || locked.value || loading.value) return
  const today = businessTime().format('YYYY-MM-DD')
  if (tab.value === 'tasks' && date.value !== today) date.value = today
  else void load()
}
watch([date, tab, mine], () => { if (!selected.value && !record.value) void load() })
onMounted(() => {
  void load(); window.addEventListener('beforeunload', beforeUnload)
  document.addEventListener('visibilitychange', resume); window.addEventListener('pageshow', resume)
  timer = setInterval(() => { now.value = Date.now(); if (!error.value) resume() }, 60000)
})
onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnload); clearInterval(timer)
  document.removeEventListener('visibilitychange', resume); window.removeEventListener('pageshow', resume)
})
</script>
<template>
  <ConfigProvider :theme="{ token: { colorPrimary: '#6ca95b', borderRadius: 6 } }">
    <div class="mobile-patrol" :class="{ 'keyboard-open': keyboardOpen }">
      <header class="app-header">
        <button type="button" class="header-back" :aria-label="t('Mobile.back')" :disabled="locked" @click="back"><span /></button>
        <h1>{{ heading }}</h1>
        <button v-if="!detail && tab === 'tasks'" type="button" class="header-action" @click="tab = 'history'">{{ t('Mobile.recordsEntry') }}</button>
      </header>
      <main :class="{ 'has-submit': selected, 'points-home': !detail && tab === 'tasks' }">
        <Alert v-if="error" class="notice" type="error" show-icon :message="te(error) ? t(error) : error" />
        <template v-if="!detail && tab === 'tasks'">
          <PointGrid v-if="!error" :rows="rows" :categories="categories" :mine="mine" :loading="loading" :now="now"
            @mine="mine = $event" @select="point = $event" />
          <div class="point-refresh"><button type="button" class="text-button" :disabled="loading" @click="load()">{{ t(loading ? 'Mobile.loading' : 'Mobile.refresh') }}</button></div>
        </template>
        <template v-else-if="!detail && tab === 'history'">
          <label class="date-filter"><span>{{ t('Mobile.date') }}</span><input v-model="date" type="date" required :disabled="loading" /></label>
          <div v-if="loading && !records.length" class="empty"><Spin /></div>
          <div v-else-if="error" class="empty"><Button @click="load()">{{ t('Mobile.retry') }}</Button></div>
          <template v-else>
            <div v-if="!records.length" class="empty"><p>{{ t('Mobile.emptyHistory') }}</p></div>
            <button v-for="item in records" :key="item.id" type="button" class="panel history-card" @click="record = item">
              <div class="card-heading"><h2>{{ item.pointName }}</h2><span :class="`result-${enumValue(item.result)}`">{{ t(`Mobile.${enumValue(item.result) || 'not_evaluated'}`) }}</span></div>
              <p class="muted">{{ dateTime(item.receiveTime) }}<span aria-hidden="true">　›</span></p>
            </button>
            <Button v-if="records.length < total" block :loading="loading" @click="load(true)">{{ t('Mobile.more') }}</Button>
          </template>
        </template>
        <template v-else-if="selected">
          <section class="panel"><h2>{{ selected.task.pointName || selected.task.name }}</h2><p class="muted">{{ selected.task.postName }}</p>
            <p class="time-window">{{ dateTime(selected.task.startTime) }} — {{ dateTime(selected.task.endTime) }}</p>
            <p>{{ t('Mobile.progress', { done: selected.task.completedCount, total: selected.task.requiredCount }) }}</p>
            <Alert v-if="!selected.executable" type="warning" :message="t(reason(selected.reason))" show-icon />
          </section>
          <form @submit.prevent="submit">
            <CheckForm :items="selected.task.standardSnapshot" :answers="draft.answers" :errors="errors" :images="images"
              :locked="locked || !selected.executable" @answer="changeAnswer" @upload="upload" @preview="preview" />
            <section class="panel"><label for="patrol-remark">{{ t('Mobile.remark') }}</label>
              <Input.TextArea id="patrol-remark" v-model:value="draft.remark" :maxlength="1000" :rows="3" :disabled="locked || !selected.executable" :placeholder="t('Mobile.remarkHint')" /></section>
            <footer class="submit-bar"><Button type="primary" html-type="submit" block size="large" :loading="sending" :disabled="uploading || !selected.executable && !draft.pending">
              {{ t(sending ? 'Mobile.submitting' : uploading ? 'Mobile.uploading' : draft.pending ? 'Mobile.retrySubmit' : 'Mobile.submit') }}</Button></footer>
          </form>
        </template>
        <template v-else-if="record">
          <Alert v-if="success" class="notice" type="success" show-icon :message="t('Mobile.saved')" :description="t('Mobile.savedHint')" />
          <RecordDetails :record="record" :images="images" @preview="preview" />
        </template>
        <template v-else-if="activePoint">
          <section class="panel point-summary"><span class="summary-pin" aria-hidden="true">⌖</span><h2>{{ activePoint.name }}</h2></section>
          <h3 class="section-title">{{ t('Mobile.window') }}</h3>
          <section v-for="row in activePoint.rows" :key="row.task.id" class="panel">
            <h3>{{ row.task.postName }}</h3>
            <p class="time-window">{{ dateTime(row.task.startTime) }} — {{ dateTime(row.task.endTime) }}</p>
            <p class="muted">{{ row.executable ? t('Mobile.legendReady') : t(reason(row.reason)) }}</p>
            <div class="task-bottom"><span>{{ t('Mobile.progress', { done: row.task.completedCount, total: row.task.requiredCount }) }}</span>
              <Button :type="row.executable ? 'primary' : 'default'" @click="open(row)">{{ t(row.executable ? 'Mobile.start' : 'Mobile.details') }}</Button></div>
          </section>
        </template>
      </main>
    </div>
  </ConfigProvider>
</template>
