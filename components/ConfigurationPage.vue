<template>
  <div class="patrol-page">
    <ConditionFilter :fields="fields" @change="filterChanged" />
    <a-alert v-if="exportFailed" type="error" :message="t('Patrol.exportFailed')" />
    <j-pro-table
      :columns="columns"
      :row-selection="rowSelection"
      :request="load"
      :params="params"
      mode="TABLE"
      type="PAGE"
      row-key="id"
      :alert-show="false"
      :scroll="{ x: resource === 'points' ? 2310 : 1100 }"
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
          :has-permission="savePermission(resource)"
          @click="openEditor()"
          >{{ t('Patrol.add') }}</j-permission-button
        ><a-button v-if="canExportConfiguration(resource)" :loading="exporting" @click="download(resource, exportQuery)">{{ t('Patrol.export') }}</a-button
        ><slot name="toolbar" :selected="selected" :query="exportQuery" /></template
      >
      <template #category="row"><ConfigReference resource="categories" :id="categoryId || row.categoryIds || row.categoryId" /></template>
      <template #parent="row"><ConfigReference resource="categories" :id="row.parentId" /></template>
      <template #assignedPosts="row"><ConfigReference resource="posts" :id="row.assignedPostIds" /></template>
      <template #tags="row"><ConfigReference resource="tags" :id="row.tagIds" /></template>
      <template #members="row"><ConfigReference resource="persons" :id="row.userIds" /></template>
      <template #rule="row"><RuleSummary :rule="row.rule" /></template>
      <template #creatorName="row">{{ row.creatorName || '—' }}</template>
      <template #modifierName="row">{{ row.modifierName || '—' }}</template>
      <template #modifyTime="row">{{ dateTime(row.modifyTime) }}</template>
      <template #color="row"><a-tag :color="row.colorHex">{{ row.colorHex }}</a-tag></template>
      <template #items="row">{{ row.items?.length ?? 0 }}</template>
      <template #post="row"><ConfigReference resource="posts" :id="row.postId" /></template>
      <template #standard="row"><ConfigReference resource="standards" :id="row.standardId" /></template>
      <template #level="row"><ConfigReference resource="levels" :id="row.levelId" /></template>
      <template #trigger="row">{{ t(`Patrol.triggers.${row.triggerChildCode}`) }}</template>
      <template #enabled="row"
        ><a-tag :color="row.enabled ? 'success' : 'default'">{{
          t(row.enabled ? 'Patrol.active' : 'Patrol.inactive')
        }}</a-tag></template
      >
      <template #actions="row"
        ><a-button type="link" @click="openEditor(row, true)">{{ t('Patrol.details') }}</a-button
        ><j-permission-button
          type="link"
          :has-permission="savePermission(resource)"
          @click="openEditor(row)"
          >{{ t('Patrol.edit') }}</j-permission-button
        ><a-button v-if="resource === 'levels'" type="link" @click="historyId = row.id">{{ t('Patrol.configHistory.title') }}</a-button
        ><ConfigDelete v-if="canDeleteConfiguration(resource)" :resource="resource" :id="row.id" @deleted="refresh" /><slot name="actions" :row="row" /></template
      >
    </j-pro-table>
    <ConfigHistory v-if="historyId && resource === 'levels'" :resource="resource" :id="historyId" @close="historyId = undefined" />
    <ConfigEditor
      v-if="visible"
      :resource="resource"
      :value="draft"
      :saving="saving"
      :save-failed="saveFailed"
      :readonly="readonly"
      :point="point"
      @close="visible = false"
      @save="save"
    />
  </div>
</template>
<script setup lang="ts">
import ConfigReference from './ConfigReference.vue'
import RuleSummary from './RuleSummary.vue'
import { dateTime } from '../model/display'
import { computed, ref, defineAsyncComponent, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert as AAlert, Button as AButton, Tag as ATag } from 'ant-design-vue'
import ConditionFilter, {
  type ConditionFilterChangePayload,
  type ConditionFilterField,
  createQueryNoPagingOptionSource,
} from '@jetlinks-web-core/components/ConditionFilter'
import { useConfiguration } from '../composables/useConfiguration'
import { canDeleteConfiguration } from '../api/config-delete'
import ConfigDelete from './ConfigDelete.vue'
import { useConfigExport, canExportConfiguration } from '../composables/useConfigExport'
import { savePermission } from '../model/resources'
import { pointTagsTerm, pointPostsTerm } from '../model/point-filters'
import type { ConfigEntity, Resource, Query } from '../api/types'
const ConfigEditor = defineAsyncComponent(() => import('./ConfigEditor.vue'))
const ConfigHistory = defineAsyncComponent(() => import('./ConfigHistory.vue'))
const historyId = ref<string>()
const readonly = ref(false)
const props = defineProps<{ resource: Resource; point?: ConfigEntity; categoryId?: string; categoriesInSidebar?: boolean; selectable?: boolean }>()
const { t } = useI18n()
const { exporting, exportFailed, download } = useConfigExport()
const { saveFailed, visible, saving, draft, params, terms, load, edit, save, reload } = useConfiguration(
  props.resource, props.point, toRef(props, 'categoryId')
)
const selected = ref<ConfigEntity[]>([])
const exportQuery = computed<Query>(() => ({ terms: params.value.terms,
  sorts: [{ name: 'createTime', order: 'desc' }, { name: 'id', order: 'asc' }] }))
const rowSelection = computed(() => props.selectable ? {
  selectedRowKeys: selected.value.map(row => row.id!),
  preserveSelectedRowKeys: true,
  onChange: (_keys: (string | number)[], rows: ConfigEntity[]) => { selected.value = rows },
} : undefined)
watch([terms, () => props.categoryId], () => { selected.value = [] })
function refresh() { selected.value = []; reload() }
defineExpose({ refresh })
function openEditor(row?: ConfigEntity, readOnly = false) {
  readonly.value = readOnly
  edit(row)
}
// 仅传递加载函数。不要将候选缓存 Ref 放进字段定义，候选变化会触发宿主深度监听重置编辑中的条件。
const referenceOptions = (resource: 'categories' | 'tags' | 'posts') => {
  const { loadOptions, loadSelectedOptions } = createQueryNoPagingOptionSource({
    url: `/park/patrol/${resource}/_query`, queryMode: 'paging', sorts: [{ name: 'name', order: 'asc' }],
  })
  return { loadOptions, loadSelectedOptions }
}
const categoryOptions = referenceOptions('categories'), tagOptions = referenceOptions('tags'), postOptions = referenceOptions('posts')
const fields = computed<ConditionFilterField[]>(() => {
  const categoryField: ConditionFilterField = { title: t('Patrol.category'), dataIndex: 'categoryId', search: { type: 'select', defaultTermType: 'in', termTypeOptions: ['in', 'nin'], optionPanel: { ...categoryOptions, multiple: true, optionFields: { value: 'id', label: 'name' } } } }
  const pointFields: ConditionFilterField[] = props.resource === 'points' ? [
    { title: t('Patrol.code'), dataIndex: 'code', search: { type: 'string', defaultTermType: 'like' } },
    ...(!props.categoriesInSidebar ? [categoryField] : []),
    { title: t('Patrol.tags'), dataIndex: 'tagIds', search: { type: 'select', defaultTermType: 'in', termTypeOptions: ['in', 'nin'], optionPanel: { ...tagOptions, multiple: true, optionFields: { value: 'id', label: 'name' } }, handleParamsItem: (record) => pointTagsTerm(record.value, record.termType === 'nin') } },
    // 关联条件最终查询点位 id；rename 同时让公共筛选组件识别转换后的列。
    { title: t('Patrol.post'), dataIndex: 'postIds', search: { type: 'select', rename: 'id', defaultTermType: 'in', termTypeOptions: ['in', 'nin'], optionPanel: { ...postOptions, multiple: true, optionFields: { value: 'id', label: 'name' } }, handleParamsItem: (record) => pointPostsTerm(record.value, record.termType === 'nin') } },
    { title: t('Patrol.nfc'), dataIndex: 'nfcCode', search: { type: 'string', defaultTermType: 'like' } },
    { title: t('Patrol.location'), dataIndex: 'location', search: { type: 'string', defaultTermType: 'like' } },
  ] : []
  return [
    { title: t(`Patrol.names.${props.resource}`), dataIndex: 'name', search: { type: 'string', defaultTermType: 'like' } },
    ...pointFields,
    { title: t('Patrol.enabled'), dataIndex: 'enabled', search: { type: 'select', defaultTermType: 'eq', termTypeOptions: ['eq', 'not'], options: [
      { label: t('Patrol.active'), value: true }, { label: t('Patrol.inactive'), value: false },
    ] } },
    { title: t('Patrol.modifyTime'), dataIndex: 'modifyTime', search: { type: 'date', defaultTermType: 'btw' } },
  ]
})
const columns = computed(() => [
  { title: t(`Patrol.names.${props.resource}`), dataIndex: 'name', key: 'name', ellipsis: true, width: 180 },
  ...(props.resource === 'points'
    ? [
        { title: t('Patrol.code'), dataIndex: 'code', key: 'code', width: 150, ellipsis: true },
        { title: t('Patrol.post'), dataIndex: 'assignedPostIds', key: 'assignedPosts', scopedSlots: true, width: 180 },
        { title: t('Patrol.category'), dataIndex: 'categoryId', key: 'category', scopedSlots: true, width: 160 },
        { title: t('Patrol.tags'), dataIndex: 'tagIds', key: 'tags', scopedSlots: true, width: 160 },
        { title: t('Patrol.nfc'), dataIndex: 'nfcCode', key: 'nfcCode', width: 160, ellipsis: true },
        { title: t('Patrol.location'), dataIndex: 'location', key: 'location', width: 200, ellipsis: true },
      ]
    : []),
  ...(props.resource === 'categories' ? [{ title: t('Patrol.parent'), dataIndex: 'parentId', key: 'parent', scopedSlots: true }] : []),
  ...(props.resource === 'levels' ? [{ title: t('Patrol.rule'), dataIndex: 'rule', key: 'rule', scopedSlots: true, width: 400 }] : []),
  ...(props.resource === 'standards' ? [{ title: t('Patrol.itemCount'), dataIndex: 'items', key: 'items', scopedSlots: true }] : []),
  ...(props.resource === 'posts' ? [{ title: t('Patrol.members'), dataIndex: 'userIds', key: 'members', scopedSlots: true }] : []),
  ...(props.resource === 'plans' ? [
    { title: t('Patrol.post'), dataIndex: 'postId', key: 'post', scopedSlots: true },
    { title: t('Patrol.standard'), dataIndex: 'standardId', key: 'standard', scopedSlots: true },
    { title: t('Patrol.level'), dataIndex: 'levelId', key: 'level', scopedSlots: true },
    { title: t('Patrol.effectiveFrom'), dataIndex: 'effectiveFrom', key: 'effectiveFrom' },
    { title: t('Patrol.effectiveTo'), dataIndex: 'effectiveTo', key: 'effectiveTo' },
  ] : []),
  ...(props.resource === 'warnings' ? [
    { title: t('Patrol.warningCode'), dataIndex: 'warningCode', key: 'warningCode' },
    { title: t('Patrol.triggerCondition'), dataIndex: 'triggerChildCode', key: 'trigger', scopedSlots: true },
    { title: t('Patrol.color'), dataIndex: 'colorHex', key: 'color', scopedSlots: true },
  ] : []),
  ...(props.resource === 'rosters'
    ? [{ title: t('Patrol.businessDate'), dataIndex: 'businessDate', key: 'businessDate' }]
    : []),
  ...(props.resource === 'levels' ? [{ title: t('Patrol.modifier'), dataIndex: 'modifierName', key: 'modifierName', scopedSlots: true, width: 140 }] : []),
  ...(props.resource === 'warnings' ? [{ title: t('Patrol.creator'), dataIndex: 'creatorName', key: 'creatorName', scopedSlots: true, width: 140 }] : []),
  { title: t('Patrol.modifyTime'), dataIndex: 'modifyTime', key: 'modifyTime', scopedSlots: true, width: 180 },
  { title: t('Patrol.enabled'), dataIndex: 'enabled', key: 'enabled', scopedSlots: true, width: 100 },
  { title: t('Patrol.description'), dataIndex: 'description', key: 'description', ellipsis: true, width: 180 },
  {
    title: t('Patrol.actions'),
    key: 'actions',
    dataIndex: 'actions',
    scopedSlots: true,
    width: props.resource === 'points' ? 510 : props.resource === 'levels' ? 340 : canDeleteConfiguration(props.resource) ? 240 : 180,
    fixed: 'right',
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
