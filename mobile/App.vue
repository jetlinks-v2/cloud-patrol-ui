<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Alert, Button, ConfigProvider, Input, Spin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { businessTime, dateTime } from '../model/display'
import { enumValue } from '../model/standards'
import CheckForm from './components/CheckForm.vue'
import RecordDetails from './components/RecordDetails.vue'
import PointGrid from './components/PointGrid.vue'
import MobileProjectFilter from './components/MobileProjectFilter.vue'
import { patrolProject } from './projectScope'
import MobileMissed from './components/MobileMissed.vue'
import PatrolHome from './components/PatrolHome.vue'
import { homeSummary, homeTasks, type HomeTaskState } from './home'
import { pointGroups, type PointGroup } from './points'
import { useMobilePatrol } from './useMobilePatrol'
import { host } from './transport'
import { useWebView } from './useWebView'
const ScanPage = defineAsyncComponent(() => import('./scan/ScanPage.vue'))
const PointManagement = defineAsyncComponent(() => import('./management/PointManagement.vue'))
defineProps<{ standalone?: boolean; loggingOut?: boolean }>()
const emit = defineEmits<{ logout: [] }>()
const { t, te } = useI18n()
const { date, tab, mine, missedCount, missedError, historyScope, canReadProjectHistory, people, categories, levels, historyFilters, filterError, searchHistory, loadHistoryOptions, rows, records, selected, record, success, loading, sending, uploading,
  error, draft, errors, images, total, locked, reason, load, open, leave, changeAnswer, upload, preview, submit, scanPoint } = useMobilePatrol()
const point = ref<PointGroup>(), now = ref(Date.now()), missedOpen = ref(false), missedBusy = ref(false), scanOpen = ref(false)
const offlineOpen = ref(false)
const management = ref<{ back(): void }>(), managementBusy = ref(false)
const managementScreen = ref({ key: 'manage', depth: 1, title: 'Mobile.entries.manage' })
const summary = computed(() => homeSummary(rows.value, date.value, now.value))
const taskState = ref<HomeTaskState>()
const visibleTasks = computed(() => taskState.value ? homeTasks(rows.value, date.value, now.value, taskState.value) : rows.value)
const activePoint = computed(() => pointGroups(visibleTasks.value, '', '', categories.value, now.value, taskState.value === 'completed').find(item => item.id === point.value?.id) || point.value)
const detail = computed(() => !!selected.value || !!record.value || !!point.value || missedOpen.value || scanOpen.value || offlineOpen.value)
const screen = computed(() => ({
  key: offlineOpen.value ? 'offline' : scanOpen.value ? 'scan' : missedOpen.value ? 'missed' : selected.value ? `task:${selected.value.task.id}` : record.value ? `record:${record.value.id}` : point.value ? `point:${point.value.id}` : tab.value === 'manage' ? managementScreen.value.key : tab.value,
  depth: offlineOpen.value ? 1 : missedOpen.value ? (tab.value === 'home' ? 1 : 2) : scanOpen.value ? 2 : selected.value || record.value ? (point.value ? 3 : tab.value === 'home' ? 1 : 2) : point.value ? 2 : tab.value === 'manage' ? managementScreen.value.depth : tab.value === 'home' ? 0 : 1,
}))
const { keyboardOpen } = useWebView(screen, computed(() => locked.value || missedBusy.value || managementBusy.value), back)
watch(() => screen.value.key, () => { void nextTick(() => window.scrollTo(0, 0)) })
const heading = computed(() => t(offlineOpen.value ? 'Mobile.offlineTitle' : scanOpen.value ? 'Mobile.scanTitle' : missedOpen.value ? 'Patrol.missed.title' : selected.value ? 'Mobile.inspectionTitle' : record.value ? 'Mobile.recordTitle'
  : point.value ? 'Mobile.pointDetails' : tab.value === 'manage' ? managementScreen.value.title : tab.value === 'home' ? 'Mobile.homeTitle' : tab.value === 'history' ? 'Mobile.historyTitle' : 'Mobile.pointsTitle'))
let timer: ReturnType<typeof setInterval>
function back() {
  if (locked.value || missedBusy.value || managementBusy.value) return
  if (offlineOpen.value) offlineOpen.value = false
  else if (scanOpen.value) scanOpen.value = false
  else if (missedOpen.value) { missedOpen.value = false; void load() }
  else if (selected.value || record.value) leave()
  else if (point.value) point.value = undefined
  else if (tab.value === 'manage' && managementScreen.value.depth > 1) management.value?.back()
  else if (tab.value !== 'home') { date.value = businessTime().format('YYYY-MM-DD'); tab.value = 'home' }
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
  if ((tab.value === 'tasks' || tab.value === 'home') && date.value !== today) date.value = today
  else void load()
}
watch([date, tab, mine], () => { if (!selected.value && !record.value) void load() })
watch([tab, patrolProject], ([value]) => { if (value === 'history') void loadHistoryOptions() })
watch(historyScope, () => { historyFilters.value.userId = undefined; searchHistory() })
// 切项目清除关联筛选与旧列表，再发一次查询，避免旧项目结果或筛选残留。
watch(patrolProject, () => {
  taskState.value = undefined
  historyFilters.value.categoryId = ''; historyFilters.value.levelId = ''; historyFilters.value.userId = undefined
  rows.value = []; records.value = []; total.value = 0
  if (selected.value || record.value) return
  if (tab.value === 'history') searchHistory()
  else void load()
})
function enter(page: 'tasks' | 'history' | 'manage' | 'missed' | 'offline') {
  if (page === 'tasks') taskState.value = undefined
  if (page === 'offline') offlineOpen.value = true
  else if (page === 'missed') missedOpen.value = true
  else tab.value = page
}
function enterTasks(state: HomeTaskState) {
  taskState.value = state; mine.value = true
  date.value = businessTime().format('YYYY-MM-DD'); tab.value = 'tasks'
}
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
        <button type="button" class="header-back" :aria-label="t('Mobile.back')" :disabled="locked || missedBusy || managementBusy" @click="back"><span /></button>
        <h1>{{ heading }}</h1>
        <button v-if="!detail && tab === 'tasks'" type="button" class="header-action" @click="tab = 'history'">{{ t('Mobile.recordsEntry') }}</button>
        <button v-else-if="standalone && !detail && tab === 'home'" type="button" class="header-action" :disabled="loggingOut || locked || missedBusy || managementBusy" @click="emit('logout')">{{ t('Mobile.logout') }}</button>
      </header>
      <main :class="{ 'has-submit': selected, 'points-home': !detail && tab === 'tasks' }">
        <MobileProjectFilter v-if="!detail && !(tab === 'manage' && managementScreen.depth > 1)" :disabled="locked || loading || managementBusy" />
        <Alert v-if="!patrolProject && !offlineOpen" class="notice" type="info" show-icon :message="t('Mobile.chooseProjectFirst')" />
        <Alert v-if="error" class="notice" type="error" show-icon :message="te(error) ? t(error) : error" />
        <section v-if="offlineOpen" class="panel offline-notice">
          <h2>{{ t('Mobile.offlineTitle') }}</h2><p>{{ t('Mobile.offlineHint') }}</p>
          <Button type="primary" block @click="tab = 'tasks'; offlineOpen = false">{{ t('Mobile.onlinePatrol') }}</Button>
        </section>
        <PatrolHome v-else-if="!detail && tab === 'home'" :summary="summary" :missed="missedCount" :loading="loading" :failed="!!error" :missed-failed="missedError" :project-selected="!!patrolProject" @enter="enter" @tasks="enterTasks" @refresh="load()" />
        <div v-else-if="!patrolProject" class="empty">{{ t('Mobile.chooseProjectFirst') }}</div>
        <ScanPage v-else-if="scanOpen" :resolve="scanPoint" @select="open($event); scanOpen = false" />
        <MobileMissed v-else-if="missedOpen" @busy="missedBusy = $event" />
        <PointManagement v-else-if="!detail && tab === 'manage'" ref="management" @screen="managementScreen = $event" @busy="managementBusy = $event" />
        <template v-else-if="!detail && tab === 'tasks'">
          <div v-if="taskState" class="task-state-filter"><strong>{{ t(`Mobile.homeStats.${taskState}`) }}</strong><Button type="link" @click="taskState = undefined">{{ t('Mobile.all') }}</Button></div>
          <div class="point-refresh"><Button type="primary" :disabled="locked || loading" @click="scanOpen = true">{{ t('Mobile.scanTitle') }}</Button><Button type="link" @click="missedOpen = true">{{ t('Patrol.missed.title') }}</Button></div>
          <PointGrid v-if="!error" :rows="visibleTasks" :categories="categories" :mine="mine" :loading="loading" :now="now" :include-ended="taskState === 'completed'"
            @mine="mine = $event" @select="point = $event" />
          <div class="point-refresh"><button type="button" class="text-button" :disabled="loading" @click="load()">{{ t(loading ? 'Mobile.loading' : 'Mobile.refresh') }}</button></div>
        </template>
        <template v-else-if="!detail && tab === 'history'">
          <div v-if="canReadProjectHistory" class="people-tabs history-scope">
            <button type="button" :class="{ active: historyScope === 'mine' }" @click="historyScope = 'mine'">{{ t('Mobile.myHistory') }}</button>
            <button type="button" :class="{ active: historyScope === 'authorized' }" @click="historyScope = 'authorized'">{{ t('Mobile.projectHistory') }}</button>
          </div>
          <form class="panel history-filters" @submit.prevent="searchHistory()">
            <label><span>{{ t('Mobile.historyFrom') }}</span><input v-model="historyFilters.from" type="date" required :max="historyFilters.to" /></label>
            <label><span>{{ t('Mobile.historyTo') }}</span><input v-model="historyFilters.to" type="date" required :min="historyFilters.from" /></label>
            <label><span>{{ t('Mobile.pointName') }}</span><Input v-model:value="historyFilters.pointName" :maxlength="128" :placeholder="t('Mobile.namePlaceholder')" /></label>
            <label><span>{{ t('Mobile.category') }}</span><select v-model="historyFilters.categoryId"><option value="">{{ t('Mobile.all') }}</option><option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
            <label><span>{{ t('Mobile.level') }}</span><select v-model="historyFilters.levelId"><option value="">{{ t('Mobile.all') }}</option><option v-for="item in levels" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
            <label v-if="historyScope === 'authorized' && canReadProjectHistory"><span>{{ t('Mobile.user') }}</span><select v-model="historyFilters.userId"><option :value="undefined">{{ t('Mobile.all') }}</option><option v-for="item in people" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
            <Alert v-if="filterError" type="warning" :message="t('Mobile.filterOptionsFailed')" />
            <div class="history-filter-actions"><Button html-type="submit" type="primary" :loading="loading">{{ t('Mobile.search') }}</Button><Button :disabled="loading" @click="searchHistory(true)">{{ t('Mobile.reset') }}</Button></div>
          </form>
          <div v-if="loading && !records.length" class="empty"><Spin /></div>
          <div v-else-if="error" class="empty"><Button @click="load()">{{ t('Mobile.retry') }}</Button></div>
          <template v-else>
            <div v-if="!records.length" class="empty"><p>{{ t(historyScope === 'authorized' && canReadProjectHistory ? 'Mobile.emptyProjectHistory' : 'Mobile.emptyHistory') }}</p></div>
            <button v-for="item in records" :key="item.id" type="button" class="panel history-card" @click="record = item">
              <div class="card-heading"><h2>{{ item.pointName }}</h2><span :class="`result-${enumValue(item.result)}`">{{ t(`Mobile.${enumValue(item.result) || 'not_evaluated'}`) }}</span></div>
              <p class="muted">{{ item.categoryName || '—' }} · {{ item.levelName || '—' }}</p>
              <p class="muted">{{ t('Mobile.user') }}：{{ item.userName || '—' }} · {{ item.projectName || '—' }}</p>
              <p class="muted">{{ t('Mobile.window') }}：{{ dateTime(item.periodStartTime) }} ～ {{ dateTime(item.periodEndTime) }}</p>
              <p class="muted">{{ t('Mobile.received') }}：{{ dateTime(item.receiveTime) }}<span aria-hidden="true">　›</span></p>
            </button>
            <Button v-if="records.length < total" block :loading="loading" @click="load(true)">{{ t('Mobile.more') }}</Button>
          </template>
        </template>
        <template v-else-if="selected">
          <section class="panel"><h2>{{ selected.task.pointName || selected.task.name }}</h2><p class="muted">{{ selected.task.roleId ? selected.task.roleName : t('Patrol.allStaffPatrol') }}</p>
            <p v-if="selected.task.projectName || selected.task.categoryName || selected.task.levelName" class="muted">{{ [selected.task.projectName, selected.task.categoryName, selected.task.levelName].filter(Boolean).join(' · ') }}</p>
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
          <section class="panel point-summary"><span class="summary-pin" aria-hidden="true">⌖</span><h2>{{ activePoint.name }}</h2><p v-if="activePoint.rows[0]?.task.projectName || activePoint.rows[0]?.task.categoryName" class="muted">{{ [activePoint.rows[0]?.task.projectName, activePoint.rows[0]?.task.categoryName].filter(Boolean).join(' · ') }}</p></section>
          <h3 class="section-title">{{ t('Mobile.window') }}</h3>
          <section v-for="row in activePoint.rows" :key="row.task.id" class="panel">
            <h3>{{ row.task.roleId ? row.task.roleName : t('Patrol.allStaffPatrol') }}</h3>
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
