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
      :alert-show="false"
      :default-params="{
        sorts: [
          { name: 'receiveTime', order: 'desc' },
          { name: 'id', order: 'asc' },
        ],
      }"
    >
      <template #result="row">{{ t(`Patrol.checkResults.${enumValue(row.result) ?? 'not_evaluated'}`) }}</template>
      <template #receiveTime="row">{{ dateTime(row.receiveTime) }}</template>
      <template #actions="row"
        ><a-button type="link" @click="selected = row">{{
          t('Patrol.details')
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
          <a-descriptions-item :label="t('Patrol.person')">{{
            selected.userName
          }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.receiveTime')">{{
            dateTime(selected.receiveTime)
          }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.periodNo')">{{ selected.periodNo ?? '—' }}</a-descriptions-item>
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
const props = defineProps<{ taskGroupId?: string; taskId?: string }>()
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
  {
    title: t('Patrol.receiveTime'),
    dataIndex: 'receiveTime',
    search: { type: 'date', defaultTermType: 'btw' },
  },
])
const columns = computed(() => [
  { title: t('Patrol.periodNo'), dataIndex: 'periodNo', key: 'periodNo' },
  { title: t('Patrol.point'), dataIndex: 'pointName', key: 'pointName' },
  { title: t('Patrol.person'), dataIndex: 'userName', key: 'userName' },
  {
    title: t('Patrol.receiveTime'),
    dataIndex: 'receiveTime',
    key: 'receiveTime',
    scopedSlots: true,
  },
  { title: t('Patrol.checkResult'), dataIndex: 'result', key: 'result', scopedSlots: true },
  { title: t('Patrol.remark'), dataIndex: 'remark', key: 'remark', ellipsis: true },
  {
    title: t('Patrol.actions'),
    dataIndex: 'actions',
    key: 'actions',
    scopedSlots: true,
    width: 100,
  },
])
</script>
<style scoped>
.patrol-records {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 16px);
  height: 100%;
  min-height: 0;
}
</style>
