<template>
  <a-space direction="vertical" class="statistics-page" :size="16">
    <ProjectFilterBar>
      <a-range-picker v-model:value="range" value-format="YYYY-MM-DD" :allow-clear="false" />
      <label class="filter"><span>{{ t('Patrol.category') }}</span><RemoteSelect resource="categories" v-model="categoryIds" multiple /></label>
      <label class="filter"><span>{{ t('Patrol.level') }}</span><RemoteSelect resource="levels" v-model="levelIds" multiple /></label>
      <a-button :loading="loading" @click="reload">{{ t('Patrol.refresh') }}</a-button>
      <a-button @click="reset">{{ t('Patrol.statistics.reset') }}</a-button>
    </ProjectFilterBar>
    <div class="heading">
      <div><h2>{{ t('Patrol.overview.title') }}</h2><span class="muted">{{ t('Patrol.overview.scopeHint') }}</span></div>
      <a-space><span v-if="report" class="muted">{{ t('Patrol.overview.asOf') }} {{ dateTime(report.generatedAt) }}</span>
        <a-button :loading="exporting" :disabled="loading || !report" @click="exportReport">{{ t('Patrol.statistics.export') }}</a-button></a-space>
    </div>
    <a-alert v-if="failed || exportFailed" type="error" show-icon :message="t(exportFailed ? 'Patrol.statistics.exportFailed' : 'Patrol.loadFailed')" />
    <a-spin :spinning="loading">
      <template v-if="report">
        <div class="metrics">
          <button v-for="item in metrics" :key="item.key" class="metric" :class="item.tone" @click="openDrill(item.metric)">
            <span>{{ t(`Patrol.overview.${item.key}`) }}</span><strong>{{ report.total[item.key] }}</strong>
            <small v-if="item.key === 'completed'">{{ t('Patrol.overview.executed') }} {{ report.total.executed }} · {{ t('Patrol.overview.credited') }} {{ report.total.credited }}</small>
            <small v-else>{{ t(`Patrol.overview.${item.key}Hint`) }}</small>
          </button>
        </div>
        <div class="rate-summary">
          <a-tooltip v-for="rate in rates" :key="rate.key" :title="t(`Patrol.overview.${rate.key}Hint`)">
            <button class="rate-panel" @click="openDrill(rate.metric)">
              <span>{{ t(`Patrol.overview.${rate.key}`) }}</span>
              <strong>{{ percent(report.total[rate.key]) }}</strong>
              <a-progress v-if="report.total[rate.key] != null" :percent="report.total[rate.key] ?? 0" :show-info="false" size="small" />
              <small>{{ rateBase(report.total) }}</small>
            </button>
          </a-tooltip>
        </div>
        <a-card class="section" :title="t('Patrol.overview.pointDays')" size="small">
          <div class="states"><a-button @click="openDrill('all')">{{ t('Patrol.overview.all') }} {{ report.total.pointDays }}</a-button>
            <a-button v-for="item in states" :key="item.key" @click="openDrill(item.metric)">{{ t(`Patrol.overview.${item.key}`) }} {{ report.total[item.key] }}</a-button></div>
          <p class="muted explanation">{{ t('Patrol.overview.pointHint') }}</p>
        </a-card>
        <a-card class="section" :title="t('Patrol.overview.projects')" size="small">
          <template #extra><a-button type="link" @click="openDrill()">{{ t('Patrol.overview.taskDetails') }}</a-button></template>
          <a-table :data-source="projects" :columns="projectColumns" row-key="projectId" size="middle" :pagination="false" :scroll="{x:1700}">
            <template #headerCell="{column}"><a-tooltip v-if="isRate(column.key)" :title="t(`Patrol.overview.${column.key}Hint`)">{{ column.title }}</a-tooltip><template v-else>{{ column.title }}</template></template>
            <template #bodyCell="{column, record}">
              <template v-if="column.key === 'projectName'">{{ record.projectName || t('Patrol.overview.unknownProject') }}</template>
              <template v-else-if="isRate(column.key)">
                <a-tooltip :title="rateBase(record.counts)"><a-button type="link" size="small" @click="openDrill('due', record.projectId)">{{ percent(record.counts[column.key]) }}</a-button></a-tooltip>
              </template>
              <a-button v-else-if="metricFor(column.key)" type="link" size="small" @click="openDrill(metricFor(column.key), record.projectId)">{{ countValue(record.counts, column.key) }}</a-button>
            </template>
          </a-table>
        </a-card>
        <a-card v-if="report.days.length" class="section" :title="t('Patrol.overview.days')" size="small">
          <a-table :data-source="report.days" :columns="dayColumns" row-key="date" size="small" :pagination="{pageSize:7, showSizeChanger:false}" :scroll="{x:1100}">
            <template #headerCell="{column}"><a-tooltip v-if="isRate(column.key)" :title="t(`Patrol.overview.${column.key}Hint`)">{{ column.title }}</a-tooltip><template v-else>{{ column.title }}</template></template>
            <template #bodyCell="{column,record}">
              <a-tooltip v-if="isRate(column.key)" :title="rateBase(record.counts)"><a-button type="link" size="small" @click="openDrill('due', undefined, record.date)">{{ percent(record.counts[column.key]) }}</a-button></a-tooltip>
              <a-button v-else-if="metricFor(column.key)" type="link" size="small" @click="openDrill(metricFor(column.key), undefined, record.date)">{{ countValue(record.counts, column.key) }}</a-button>
            </template>
          </a-table>
        </a-card>
        <a-card class="section" :title="t('Patrol.overview.people')" size="small">
          <p class="muted">{{ t('Patrol.overview.peopleHint') }}</p>
          <a-table :data-source="report.people" :columns="personColumns" row-key="userId" size="small" :pagination="{pageSize:10}" :scroll="{x:700}">
            <template #bodyCell="{column,record}"><template v-if="column.key === 'lastTime'">{{ dateTime(record.lastTime) }}</template></template>
          </a-table>
        </a-card>
      </template>
      <a-empty v-else-if="!loading && !failed" />
    </a-spin>
    <a-drawer v-model:open="drillOpen" :title="t('Patrol.overview.taskDetails')" width="min(1250px, 96vw)">
      <a-alert v-if="drillFailed" type="error" :message="t('Patrol.loadFailed')" />
      <p>{{ drillRange?.from }} ～ {{ drillRange?.to }} · {{ t(`Patrol.overview.metric.${drillMetric}`) }}</p><p class="muted">{{ t('Patrol.overview.drillHint') }}</p>
      <a-table :data-source="drillRows" :columns="detailColumns" row-key="id" :loading="drillLoading" size="small" :scroll="{x:1200}"
        :pagination="{current:drillPage, pageSize:20, total:drillTotal, showSizeChanger:false}" @change="page => loadDrill(page.current)">
        <template #bodyCell="{column,record}">
          <template v-if="column.key === 'state'"><a-tag :color="stateColor(record.state)">{{ t(`Patrol.overview.state.${record.state}`) }}</a-tag></template>
          <template v-else-if="metricFor(column.key)">{{ countValue(record.counts, column.key) }}</template>
          <template v-else-if="column.key === 'categoryNames'">{{ record.categoryNames.join('、') || '—' }}</template>
          <template v-else-if="column.key === 'levelNames'">{{ record.levelNames.join('、') || '—' }}</template>
          <a-button v-else-if="column.key === 'actions'" type="link" @click="openDetail(record as StatisticsPointDay)">{{ t('Patrol.details') }}</a-button>
        </template>
      </a-table>
    </a-drawer>
    <a-drawer v-model:open="detailOpen" :title="`${selectedPoint?.pointName || ''} · ${selectedPoint?.date || ''}`" width="min(1100px, 94vw)">
      <a-alert v-if="detailFailed" type="error" :message="t('Patrol.loadFailed')" />
      <a-spin :spinning="detailLoading"><StatisticsFactDetails v-if="detail" :detail="detail" /></a-spin>
    </a-drawer>
  </a-space>
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { Space as ASpace, RangePicker as ARangePicker, Button as AButton, Alert as AAlert, Table as ATable,
  Spin as ASpin, Card as ACard, Empty as AEmpty, Drawer as ADrawer, Tag as ATag, Tooltip as ATooltip, Progress as AProgress } from 'ant-design-vue'
import RemoteSelect from './RemoteSelect.vue'
import ProjectFilterBar from './ProjectFilterBar.vue'
import { dateTime } from '../model/display'
import { useStatisticsOverview } from '../composables/statistics/useStatisticsOverview'
import type { StatisticsMetric, StatisticsCounts, StatisticsPointDay } from '../api/statistics'
const StatisticsFactDetails = defineAsyncComponent(() => import('./statistics/StatisticsFactDetails.vue'))
const {t} = useI18n()
const {range, categoryIds, levelIds, report, projects, loading, failed, exporting, exportFailed, reload, reset, exportReport,
  drillOpen, drillLoading, drillFailed, drillRows, drillTotal, drillPage, drillMetric, drillRange, loadDrill, openDrill,
  detailOpen, detailLoading, detailFailed, detail, selectedPoint, openDetail} = useStatisticsOverview()
type Metric = {key: keyof StatisticsCounts; metric: StatisticsMetric; tone?: string}
const metrics: Metric[] = [{key:'expected',metric:'all'}, {key:'completed',metric:'completed',tone:'success'},
  {key:'overdue',metric:'overdue',tone:'danger'}, {key:'notDue',metric:'notDue'}]
const states: Metric[] = [{key:'completedPoints',metric:'finished'}, {key:'ongoingPoints',metric:'ongoing'},
  {key:'pendingPoints',metric:'pending'}, {key:'missedPoints',metric:'missed'}, {key:'absentPoints',metric:'absent'}, {key:'abnormalPoints',metric:'anomaly'}]
type RateKey = 'dueFulfillmentRate'
const rates: {key: RateKey; metric: StatisticsMetric}[] = [{key:'dueFulfillmentRate',metric:'due'}]
const isRate = (key: unknown): key is RateKey => key === 'dueFulfillmentRate'
const percent = (value?: number | null) => value == null ? '—' : `${value.toFixed(2)}%`
const rateBase = (counts: StatisticsCounts) => counts.dueExpected > 0
  ? `${counts.dueCompleted} / ${counts.dueExpected} · ${t('Patrol.overview.dueBasis')}` : t('Patrol.overview.noDue')
// 百分比由后端完整计数计算。排序只改变项目展示顺序，不将无分母数据当成零履约。
const rateColumns = () => rates.map(rate => ({...column(rate.key), width:150, dataIndex:['counts',rate.key],
  sorter:(a: {counts:StatisticsCounts},b: {counts:StatisticsCounts}) => (a.counts[rate.key] ?? -1) - (b.counts[rate.key] ?? -1)}))
const column = (key: string, metric?: StatisticsMetric) => ({title:t(`Patrol.overview.${key}`), key, dataIndex:key, metric})
const projectColumns = computed(() => [{...column('projectName'),fixed:'left' as const,width:180}, ...rateColumns(), {...column('pointDays','all'),dataIndex:['counts','pointDays']}, ...[...metrics, ...states.filter(s => ['finished','missed','absent','anomaly'].includes(s.metric))]
  .map(m => ({...column(m.key, m.metric),title:t(`Patrol.overview.project.${m.key}`),dataIndex:['counts',m.key]}))])
const dayColumns = computed(() => [column('date'), ...rateColumns(), ...metrics.map(m => ({...column(m.key,m.metric),dataIndex:['counts',m.key]}))])
const personColumns = computed(() => ['userName','executionCount','abnormalCount','pointCount','lastTime'].map(key => column(key)))
const detailColumns = computed(() => [column('projectName'), column('pointName'),column('date'), column('categoryNames'),column('levelNames'),{...column('pointStateLabel'),key:'state'},
  ...metrics.map(m => ({...column(m.key), count:true})), column('actions')])
const metricFor = (key: unknown): StatisticsMetric | undefined => key === 'pointDays' ? 'all'
  : [...metrics, ...states].find(item => item.key === key)?.metric
const countValue = (counts: StatisticsCounts, key: unknown) =>
  typeof key === 'string' && key in counts ? counts[key as keyof StatisticsCounts] : '—'
const stateColor = (state: string) => ({completed:'green',missed:'orange',absent:'red',pending:'default',ongoing:'blue'}[state] || 'default')
</script>
<style scoped>
.statistics-page {width:100%} .filter {display:flex;align-items:center;gap:8px;margin:0} .filter>span {white-space:nowrap} .filter :deep(.ant-select){width:180px!important}
.heading {display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap} h2 {font-size:20px;margin:0 0 4px}
.muted {color:var(--ant-color-text-secondary,#8c8c8c);font-size:12px}.metrics {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.metric {text-align:left;background:var(--ant-color-bg-container,#fff);border:1px solid var(--ant-color-border-secondary,#f0f0f0);border-radius:8px;padding:20px;cursor:pointer;color:inherit}
.metric:hover {border-color:var(--ant-color-primary,#1677ff)} .metric span,.metric strong,.metric small {display:block}.metric strong {font-size:32px;line-height:1.5;font-weight:600}.metric small {color:#8c8c8c}.success strong {color:#389e0d}.danger strong {color:#cf1322}
.section {margin-top:16px}.states {display:flex;flex-wrap:wrap;gap:10px}.explanation {margin:12px 0 0}
.rate-summary {display:grid;grid-template-columns:1fr;gap:16px;margin-top:16px}
.rate-panel {display:grid;grid-template-columns:1fr auto;gap:8px;text-align:left;border:1px solid var(--ant-color-border-secondary,#f0f0f0);border-radius:8px;background:var(--ant-color-bg-container,#fff);padding:16px 20px;color:inherit;cursor:pointer}
.rate-panel:hover {border-color:var(--ant-color-primary,#1677ff)}.rate-panel strong {font-size:24px}.rate-panel :deep(.ant-progress),.rate-panel small {grid-column:1/-1}.rate-panel small {color:var(--ant-color-text-secondary,#8c8c8c)}
@media(max-width:900px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
