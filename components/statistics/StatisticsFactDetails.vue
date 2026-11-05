<template>
  <a-space direction="vertical" style="width:100%" :size="20">
    <section><h3>{{ t('Patrol.overview.periods') }}</h3>
      <a-table :columns="columns" :data-source="detail.periods" row-key="id" size="small" :pagination="false" :scroll="{x:950}">
        <template #bodyCell="{column,record}">
          <template v-if="column.key === 'time'">{{ dateTime(record.startTime) }} ～ {{ dateTime(record.endTime) }}</template>
          <template v-else-if="column.key === 'role'">{{ record.roleId ? record.roleName : t('Patrol.allStaffPatrol') }}</template>
          <template v-else-if="column.key === 'progress'">{{ record.completedCount }} / {{ record.requiredCount }}</template>
          <template v-else-if="column.key === 'state'">{{ t(`Patrol.states.${taskState(record as Task)}`) }}</template>
        </template>
      </a-table>
    </section>
    <section><h3>{{ t('Patrol.overview.executions') }}</h3>
      <a-empty v-if="!detail.executions.length" :description="t('Patrol.overview.noExecutions')" />
      <a-collapse v-else>
        <a-collapse-panel v-for="record in detail.executions" :key="record.id" :header="`${record.userName} · ${dateTime(record.receiveTime)}`">
          <p>{{ t('Patrol.taskGroupId') }}：{{ record.taskGroupId || '—' }} · {{ t('Patrol.periodNo') }}：{{ record.periodNo || '—' }}</p>
          <p v-if="record.remark">{{ record.remark }}</p>
          <InspectionResults :record="record" />
        </a-collapse-panel>
      </a-collapse>
    </section>
  </a-space>
</template>
<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {Space as ASpace, Table as ATable, Empty as AEmpty, Collapse as ACollapse, CollapsePanel as ACollapsePanel} from 'ant-design-vue'
import InspectionResults from '../InspectionResults.vue'
import {dateTime, taskState} from '../../model/display'
import type {Task} from '../../api/types'
import type {StatisticsDetail} from '../../api/statistics'
defineProps<{detail: StatisticsDetail}>()
const {t} = useI18n()
const columns = computed(() => [
  {title:t('Patrol.taskGroupId'),dataIndex:'taskGroupId',key:'taskGroupId'},
  {title:t('Patrol.periodNo'),dataIndex:'periodNo',key:'periodNo'},
  {title:t('Patrol.overview.periodTime'),key:'time'},
  {title:t('Patrol.post'),key:'role'},
  {title:t('Patrol.overview.progress'),key:'progress'},
  {title:t('Patrol.overview.stateLabel'),key:'state'},
])
</script>
