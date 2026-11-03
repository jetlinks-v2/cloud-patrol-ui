<template>
  <div class="patrol-page">
    <ConditionFilter :fields="fields" @change="filterChanged" />
    <j-pro-table
      :columns="columns"
      :request="load"
      :params="params"
      mode="TABLE"
      type="PAGE"
      row-key="id"
      :alert-show="false"
      :scroll="{ x: 1100 }"
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
        ><slot name="toolbar" /></template
      >
      <template #category="row"><ConfigReference resource="categories" :id="row.categoryId" /></template>
      <template #parent="row"><ConfigReference resource="categories" :id="row.parentId" /></template>
      <template #tags="row"><ConfigReference resource="tags" :id="row.tagIds" /></template>
      <template #members="row"><ConfigReference resource="persons" :id="row.userIds" /></template>
      <template #rule="row"><RuleSummary :rule="row.rule" /></template>
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
        ><slot name="actions" :row="row" /></template
      >
    </j-pro-table>
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
import { computed, ref, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Tag as ATag } from 'ant-design-vue'
import ConditionFilter, {
  type ConditionFilterChangePayload,
  type ConditionFilterField,
  createQueryNoPagingOptionSource,
} from '@jetlinks-web-core/components/ConditionFilter'
import { useConfiguration } from '../composables/useConfiguration'
import { savePermission } from '../model/resources'
import type { ConfigEntity, Resource } from '../api/types'
const ConfigEditor = defineAsyncComponent(() => import('./ConfigEditor.vue'))
const readonly = ref(false)
const props = defineProps<{ resource: Resource; point?: ConfigEntity }>()
const { t } = useI18n()
const { saveFailed, visible, saving, draft, params, terms, load, edit, save } = useConfiguration(
  props.resource, props.point
)
function openEditor(row?: ConfigEntity, readOnly = false) {
  readonly.value = readOnly
  edit(row)
}
// 引用筛选复用宿主远程选项，提交 ID，并支持按已选 ID 回查名称。
const categoryOptions = createQueryNoPagingOptionSource({
  url: '/park/patrol/categories/_query', queryMode: 'paging',
  sorts: [{ name: 'name', order: 'asc' }],
})
const fields = computed<ConditionFilterField[]>(() => [
  { title: t(`Patrol.names.${props.resource}`), dataIndex: 'name', search: { type: 'string', defaultTermType: 'like' } },
  ...(props.resource === 'points' ? [
    { title: t('Patrol.code'), dataIndex: 'code', search: { type: 'string', defaultTermType: 'like' } },
    { title: t('Patrol.category'), dataIndex: 'categoryId', search: { type: 'select', defaultTermType: 'in', termTypeOptions: ['in', 'nin'], optionPanel: { ...categoryOptions, multiple: true, optionFields: { value: 'id', label: 'name' } } } },
    { title: t('Patrol.nfc'), dataIndex: 'nfcCode', search: { type: 'string', defaultTermType: 'like' } },
    { title: t('Patrol.location'), dataIndex: 'location', search: { type: 'string', defaultTermType: 'like' } },
  ] : []),
  { title: t('Patrol.enabled'), dataIndex: 'enabled', search: { type: 'select', defaultTermType: 'eq', termTypeOptions: ['eq', 'not'], options: [
    { label: t('Patrol.active'), value: true }, { label: t('Patrol.inactive'), value: false },
  ] } },
  { title: t('Patrol.modifyTime'), dataIndex: 'modifyTime', search: { type: 'date', defaultTermType: 'btw' } },
])
const columns = computed(() => [
  { title: t(`Patrol.names.${props.resource}`), dataIndex: 'name', key: 'name', ellipsis: true, width: 180 },
  ...(props.resource === 'points'
    ? [
        { title: t('Patrol.code'), dataIndex: 'code', key: 'code', width: 150 },
        { title: t('Patrol.category'), dataIndex: 'categoryId', key: 'category', scopedSlots: true },
        { title: t('Patrol.tags'), dataIndex: 'tagIds', key: 'tags', scopedSlots: true },
        { title: t('Patrol.nfc'), dataIndex: 'nfcCode', key: 'nfcCode' },
        { title: t('Patrol.location'), dataIndex: 'location', key: 'location' },
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
  { title: t('Patrol.modifyTime'), dataIndex: 'modifyTime', key: 'modifyTime', scopedSlots: true, width: 180 },
  { title: t('Patrol.enabled'), dataIndex: 'enabled', key: 'enabled', scopedSlots: true },
  { title: t('Patrol.description'), dataIndex: 'description', key: 'description', ellipsis: true },
  {
    title: t('Patrol.actions'),
    key: 'actions',
    dataIndex: 'actions',
    scopedSlots: true,
    width: props.resource === 'points' ? 360 : 180,
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
