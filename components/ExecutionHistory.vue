<template>
  <div class="patrol-records">
    <ConditionFilter
      :fields="fields"
      @change="({ filter }) => (params = { terms: filter.terms })"
    />
    <j-pro-table
      :columns="columns"
      :request="queryExecutions"
      :params="scopedParams"
      mode="TABLE"
      type="PAGE"
      row-key="id"
      size="small"
      :scroll="{ x: 1050, y: false }"
      :body-style="{ padding: 0, height: 'auto' }"
      :alert-show="false"
      :default-params="{
        sorts: [
          { name: 'receiveTime', order: 'desc' },
          { name: 'id', order: 'asc' },
        ],
      }"
    >
      <template #period="row">{{ dateTime(row.periodStartTime) }} {{ t('Patrol.periodTo') }} {{ dateTime(row.periodEndTime) }}</template>
      <template #pointLocation>{{ pointLocation || '—' }}</template>
      <template #collectedTime="row">{{ row.collectedTime == null ? t('Patrol.unrecorded') : dateTime(row.collectedTime) }}</template>
      <template #networkStatus="row">{{ t(`Patrol.networkStates.${enumValue(row.networkStatus) ?? 'unrecorded'}`) }}</template>
      <template #actions="row"
        ><a-button type="link" @click="selected = row">{{
          t('Patrol.view')
        }}</a-button></template
      >
    </j-pro-table>
    <a-drawer
      :open="!!selected"
      :title="t('Patrol.recordDetails')"
      :width="720"
      @close="selected = undefined"
    >
      <template v-if="selected">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item :label="t('Patrol.point')">{{
            selected.pointName
          }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.pointLocation')">{{ pointLocation || '—' }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.person')">{{
            selected.userName
          }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.collectedTime')">{{ selected.collectedTime == null ? t('Patrol.unrecorded') : dateTime(selected.collectedTime) }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.networkStatus')">{{ t(`Patrol.networkStates.${enumValue(selected.networkStatus) ?? 'unrecorded'}`) }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.receiveTime')">{{
            dateTime(selected.receiveTime)
          }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.periodNo')">{{ selected.periodNo ?? '—' }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.periodTasks')">{{ dateTime(selected.periodStartTime) }} ～ {{ dateTime(selected.periodEndTime) }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.category')">{{ selected.categoryName || '—' }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.level')">{{ selected.levelName || '—' }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.remark')">{{
            selected.remark || '—'
          }}</a-descriptions-item>
        </a-descriptions>
        <InspectionResults :key="selected.id" :record="selected" />
      </template>
    </a-drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Button as AButton,
  Drawer as ADrawer,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
} from 'ant-design-vue'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import { queryExecutions } from '../api/patrol'
import { dateTime } from '../model/display'
import { enumValue } from '../model/standards'
import type { Execution, Query } from '../api/types'
import InspectionResults from './InspectionResults.vue'
const props = defineProps<{ taskGroupId?: string; taskId?: string; pointLocation?: string }>()
const { t } = useI18n()
const params = ref<Query>({ terms: [] }),
  selected = ref<Execution>()
const scopedParams = computed<Query>(() => ({ terms: [
  { terms: params.value.terms || [] },
  ...(props.taskGroupId ? [{ column: 'taskGroupId', termType: 'eq', value: props.taskGroupId }] : []),
  ...(props.taskId ? [{ column: 'taskId', termType: 'eq', value: props.taskId }] : []),
] }))
const fields = computed(() => [
  {
    title: t('Patrol.point'),
    dataIndex: 'pointName',
    search: { type: 'string', defaultTermType: 'like' },
  },
  {
    title: t('Patrol.person'),
    dataIndex: 'userName',
    search: { type: 'string', defaultTermType: 'like' },
  },
  { title: t('Patrol.collectedTime'), dataIndex: 'collectedTime', search: { type: 'date', defaultTermType: 'btw' } },
  { title: t('Patrol.networkStatus'), dataIndex: 'networkStatus', search: { type: 'select', defaultTermType: 'eq', termTypeOptions: ['eq', 'not'], options: [
    { label: t('Patrol.networkStates.online'), value: 'online' }, { label: t('Patrol.networkStates.offline'), value: 'offline' },
  ] } },
  {
    title: t('Patrol.receiveTime'),
    dataIndex: 'receiveTime',
    search: { type: 'date', defaultTermType: 'btw' },
  },
])
const columns = computed(() => [
  { title: t('Patrol.belongPeriod'), dataIndex: 'period', key: 'period', scopedSlots: true, width: 350 },
  { title: t('Patrol.patrolTime'), dataIndex: 'collectedTime', key: 'collectedTime', scopedSlots: true, width: 170 },
  { title: t('Patrol.pointLocation'), dataIndex: 'pointLocation', key: 'pointLocation', scopedSlots: true, width: 180 },
  { title: t('Patrol.patrolPerson'), dataIndex: 'userName', key: 'userName', width: 140 },
  { title: t('Patrol.patrolNetworkStatus'), dataIndex: 'networkStatus', key: 'networkStatus', scopedSlots: true, width: 110 },
  {
    title: t('Patrol.actions'),
    dataIndex: 'actions',
    key: 'actions',
    scopedSlots: true,
    width: 80,
    fixed: 'right',
  },
])
</script>
<style scoped>
.patrol-records {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 16px);
}
</style>
