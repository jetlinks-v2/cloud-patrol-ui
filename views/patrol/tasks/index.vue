<template>
  <div class="patrol-tasks">
    <a-space wrap
      ><RemoteSelect resource="plans" v-model="planId" style="width: 260px" /><a-date-picker
        v-model:value="date"
        value-format="YYYY-MM-DD"
      />
      <a-button :disabled="!planId || !date" :loading="working" @click="run(false)">{{
        t('Patrol.preview')
      }}</a-button>
      <j-permission-button
        :has-permission="'patrol-task:generate'"
        type="primary"
        :disabled="!planId || !date"
        :loading="working"
        @click="run(true)"
        >{{ t('Patrol.generate') }}</j-permission-button
      >
    </a-space>
    <a-alert v-if="failed" type="error" :message="t('Patrol.loadFailed')" />
    <ConditionFilter :fields="fields" @change="({ filter }) => (terms = filter.terms)" />
    <j-pro-table
      :columns="columns"
      :request="load"
      :params="params"
      mode="TABLE"
      type="PAGE"
      row-key="id"
      :alert-show="false"
      :default-params="{
        sorts: [
          { name: 'startTime', order: 'desc' },
          { name: 'id', order: 'asc' },
        ],
      }"
    >
      <template #startTime="row">{{ dateTime(row.startTime) }}</template
      ><template #endTime="row">{{ dateTime(row.endTime) }}</template>
      <template #progress="row">{{ row.completedCount }} / {{ row.requiredCount }}</template>
      <template #state="row"
        ><a-tag>{{ t(`Patrol.state.${taskState(row, now.getTime())}`) }}</a-tag></template
      >
    </j-pro-table>
    <a-drawer
      :open="preview !== null"
      :title="t('Patrol.taskPreview')"
      :width="1000"
      @close="preview = null"
    >
      <a-alert type="info" :message="t('Patrol.snapshotHint')" style="margin-bottom: 16px" />
      <a-table
        :columns="previewColumns"
        :data-source="preview || []"
        row-key="id"
        :pagination="{ pageSize: 20 }"
        size="small"
      />
    </a-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import {
  Space as ASpace,
  Button as AButton,
  DatePicker as ADatePicker,
  Drawer as ADrawer,
  Table as ATable,
  Alert as AAlert,
  Tag as ATag,
} from 'ant-design-vue'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import RemoteSelect from '../../../components/RemoteSelect.vue'
import { useTasks } from '../../../composables/useTasks'
import { dateTime, taskState } from '../../../model/display'
const { t } = useI18n()
const now = useNow({ interval: 1000 })
const { failed, planId, date, working, preview, terms, params, run, load } = useTasks()
const fields = computed(() => [
  {
    title: t('Patrol.name'),
    dataIndex: 'name',
    search: { type: 'string', defaultTermType: 'like' },
  },
  {
    title: t('Patrol.point'),
    dataIndex: 'pointName',
    search: { type: 'string', defaultTermType: 'like' },
  },
  {
    title: t('Patrol.businessDate'),
    dataIndex: 'businessDate',
    search: { type: 'string', defaultTermType: 'eq' },
  },
])
const previewColumns = computed(() => [
  { title: t('Patrol.point'), dataIndex: 'pointName' },
  { title: t('Patrol.post'), dataIndex: 'postName' },
  {
    title: t('Patrol.startTime'),
    dataIndex: 'startTime',
    customRender: ({ text }: { text: number }) => dateTime(text),
  },
  {
    title: t('Patrol.endTime'),
    dataIndex: 'endTime',
    customRender: ({ text }: { text: number }) => dateTime(text),
  },
  { title: t('Patrol.requiredCount'), dataIndex: 'requiredCount' },
])
const columns = computed(() => [
  { title: t('Patrol.name'), dataIndex: 'name', key: 'name' },
  { title: t('Patrol.point'), dataIndex: 'pointName', key: 'pointName' },
  { title: t('Patrol.post'), dataIndex: 'postName', key: 'postName' },
  { title: t('Patrol.startTime'), dataIndex: 'startTime', key: 'startTime', scopedSlots: true },
  { title: t('Patrol.endTime'), dataIndex: 'endTime', key: 'endTime', scopedSlots: true },
  { title: t('Patrol.progress'), dataIndex: 'progress', key: 'progress', scopedSlots: true },
  { title: t('Patrol.stateTitle'), dataIndex: 'state', key: 'state', scopedSlots: true },
])
</script>
<style scoped>
.patrol-tasks {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: var(--space-3, 16px);
}
</style>
