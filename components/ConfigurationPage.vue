<template>
  <div class="patrol-page">
    <a-alert v-if="saveFailed" type="error" :message="t('Patrol.saveFailed')" />
    <ConditionFilter :fields="fields" @change="filterChanged" />
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
          { name: 'createTime', order: 'desc' },
          { name: 'id', order: 'asc' },
        ],
      }"
    >
      <template #headerLeftRender
        ><j-permission-button
          type="primary"
          :has-permission="`${permission(resource)}:save`"
          @click="openEditor()"
          >{{ t('Patrol.add') }}</j-permission-button
        ></template
      >
      <template #enabled="row"
        ><a-tag :color="row.enabled ? 'success' : 'default'">{{
          t(row.enabled ? 'Patrol.active' : 'Patrol.inactive')
        }}</a-tag></template
      >
      <template #actions="row"
        ><a-button type="link" @click="openEditor(row, true)">{{ t('Patrol.details') }}</a-button
        ><j-permission-button
          type="link"
          :has-permission="`${permission(resource)}:save`"
          @click="openEditor(row)"
          >{{ t('Patrol.edit') }}</j-permission-button
        ></template
      >
    </j-pro-table>
    <ConfigEditor
      v-if="visible"
      :resource="resource"
      :value="draft"
      :saving="saving"
      :readonly="readonly"
      @close="visible = false"
      @save="save"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Tag as ATag, Alert as AAlert } from 'ant-design-vue'
import ConditionFilter, {
  type ConditionFilterChangePayload,
} from '@jetlinks-web-core/components/ConditionFilter'
import { useConfiguration } from '../composables/useConfiguration'
import { permission } from '../model/resources'
import type { ConfigEntity, Resource } from '../api/types'
const ConfigEditor = defineAsyncComponent(() => import('./ConfigEditor.vue'))
const readonly = ref(false)
const props = defineProps<{ resource: Resource }>()
const { t } = useI18n()
const { saveFailed, visible, saving, draft, params, terms, load, edit, save } = useConfiguration(
  props.resource
)
function openEditor(row?: ConfigEntity, readOnly = false) {
  readonly.value = readOnly
  edit(row)
}
const fields = computed(() => [
  {
    title: t('Patrol.name'),
    dataIndex: 'name',
    search: { type: 'string', defaultTermType: 'like' },
  },
])
const columns = computed(() => [
  { title: t('Patrol.name'), dataIndex: 'name', key: 'name', ellipsis: true },
  ...(props.resource === 'points'
    ? [
        { title: t('Patrol.code'), dataIndex: 'code', key: 'code' },
        { title: t('Patrol.location'), dataIndex: 'location', key: 'location' },
      ]
    : []),
  ...(props.resource === 'rosters'
    ? [{ title: t('Patrol.businessDate'), dataIndex: 'businessDate', key: 'businessDate' }]
    : []),
  { title: t('Patrol.enabled'), dataIndex: 'enabled', key: 'enabled', scopedSlots: true },
  { title: t('Patrol.description'), dataIndex: 'description', key: 'description', ellipsis: true },
  {
    title: t('Patrol.actions'),
    key: 'actions',
    dataIndex: 'actions',
    scopedSlots: true,
    width: 180,
  },
])
function filterChanged({ filter }: ConditionFilterChangePayload) {
  terms.value = filter.terms
}
</script>
<style scoped>
.patrol-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 16px);
  height: 100%;
  min-height: 0;
}
</style>
