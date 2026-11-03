<template>
  <div class="patrol-records">
    <ConditionFilter :fields="fields" @change="({ filter }) => (params = { terms: filter.terms })" />
    <j-pro-table :columns="columns" :request="queryTaskGroups" :params="params"
      mode="TABLE" type="PAGE" row-key="id" :alert-show="false" :scroll="{ x: 1200 }"
      :default-params="{ sorts: [{ name: 'belongDate', order: 'desc' }, { name: 'id', order: 'asc' }] }">
      <template #period="row">{{ dateTime(row.startTime) }} ～ {{ dateTime(row.endTime) }}</template>
      <template #actions="row"><a-button type="link" @click="selected = row">{{ t('Patrol.details') }}</a-button></template>
    </j-pro-table>
    <a-drawer :open="!!selected" :title="t('Patrol.taskGroupDetails')" :width="1200" @close="selected = undefined">
      <TaskGroupDetails v-if="selected" :key="selected.id" :group="selected" />
    </a-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Drawer as ADrawer } from 'ant-design-vue'
import ConditionFilter from '@jetlinks-web-core/components/ConditionFilter'
import { queryTaskGroups } from '../../../api/patrol'
import type { Query, TaskGroup } from '../../../api/types'
import TaskGroupDetails from '../../../components/TaskGroupDetails.vue'
import { dateTime } from '../../../model/display'
const { t } = useI18n()
const params = ref<Query>({ terms: [] }), selected = ref<TaskGroup>()
const fields = computed(() => [
  { title: t('Patrol.point'), dataIndex: 'pointName', search: { type: 'string', defaultTermType: 'like' } },
  { title: t('Patrol.belongDate'), dataIndex: 'belongDate', search: { type: 'date', defaultTermType: 'btw' } },
  { title: t('Patrol.post'), dataIndex: 'postName', search: { type: 'string', defaultTermType: 'like' } },
])
const columns = computed(() => [
  { title: t('Patrol.point'), dataIndex: 'pointName', key: 'pointName' },
  { title: t('Patrol.belongDate'), dataIndex: 'belongDate', key: 'belongDate' },
  { title: t('Patrol.taskPeriod'), dataIndex: 'period', key: 'period', scopedSlots: true, width: 330 },
  { title: t('Patrol.post'), dataIndex: 'postName', key: 'postName' },
  { title: t('Patrol.periodCount'), dataIndex: 'periodCount', key: 'periodCount' },
  { title: t('Patrol.requiredCount'), dataIndex: 'requiredCount', key: 'requiredCount' },
  { title: t('Patrol.actions'), dataIndex: 'actions', key: 'actions', scopedSlots: true, width: 100 },
])
</script>
<style scoped>
.patrol-records { display: flex; flex-direction: column; gap: var(--space-3, 16px); height: 100%; min-height: 0; }
</style>
