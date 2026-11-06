<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Button, Form, Input, Select, Switch, TreeSelect, Modal, type FormInstance } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import type { ConfigEntity } from '../../api/types'
import { categoryTree } from '../../model/categories'
import MobileProjectFilter from '../components/MobileProjectFilter.vue'
const props = defineProps<{ value: ConfigEntity; categories: ConfigEntity[]; tags: ConfigEntity[]; canSave: boolean; canConfigure: boolean; saving: boolean }>()
const emit = defineEmits<{ save: [point: ConfigEntity]; category: [action: 'link' | 'cancel', id: string]; configure: [category: string]; qr: [] }>()
const { t } = useI18n(), form = ref<FormInstance>(), model = reactive<ConfigEntity>({ name: '', enabled: true }), linked = ref<string>()
watch(() => props.value, value => { Object.assign(model, value, { tagIds: [...(value.tagIds || [])] }); linked.value = undefined }, { immediate: true })
const categoryRows = computed(() => props.categories.filter(row => row.projectId === model.projectId))
const categoryOptions = computed(() => categoryTree(categoryRows.value.filter(row => row.enabled)))
const categoryIds = computed(() => props.value.categoryIds || (props.value.categoryId ? [props.value.categoryId] : []))
const currentCategories = computed(() => categoryIds.value.map(id => props.categories.find(row => row.id === id) || { id, name: id }))
const linkOptions = computed(() => categoryTree(categoryRows.value.filter(row => row.enabled && !categoryIds.value.includes(row.id!))))
const tagOptions = computed(() => props.tags.filter(row => row.projectId === model.projectId && (row.enabled || model.tagIds?.includes(row.id!))).map(row => ({ value: row.id!, label: row.name })))
const required = [{ required: true, whitespace: true, message: t('Mobile.required') }]
watch(() => model.categoryId, id => {
  if (model.id) return
  const category = props.categories.find(row => row.id === id)
  if (category) model.projectId = category.projectId
})
watch(() => model.projectId, () => {
  if (model.id) return
  if (!categoryRows.value.some(row => row.id === model.categoryId)) model.categoryId = undefined
  model.tagIds = []
})
async function save() {
  try { await form.value?.validate() } catch { return }
  emit('save', { ...model, tagIds: [...(model.tagIds || [])] })
}
function cancelCategory(id: string) {
  Modal.confirm({ title: t('Mobile.unlinkCategory'), content: t('Patrol.pointCategories.cancelHelp'),
    okText: t('Mobile.confirm'), cancelText: t('Mobile.cancel'), onOk: () => emit('category', 'cancel', id) })
}
</script>
<template>
  <Form ref="form" :model="model" layout="vertical" class="panel point-editor" :disabled="!canSave || saving" @finish="save">
    <Form.Item name="projectId" :rules="required">
      <MobileProjectFilter v-if="!model.id" v-model:value="model.projectId" local disabled />
      <template v-else><label>{{ t('Patrol.projects.label') }}</label><p>{{ value.projectName || value.projectId }}</p></template>
    </Form.Item>
    <Form.Item name="name" :label="t('Mobile.pointName')" :rules="required"><Input v-model:value="model.name" :maxlength="128" /></Form.Item>
    <Form.Item name="code" :label="t('Patrol.code')"><Input v-model:value="model.code" :maxlength="64" :placeholder="t('Mobile.codeAuto')" /></Form.Item>
    <Form.Item v-if="!model.id" name="categoryId" :label="t('Mobile.category')" :rules="required">
      <TreeSelect v-model:value="model.categoryId" :tree-data="categoryOptions" tree-default-expand-all show-search allow-clear tree-node-filter-prop="title" :placeholder="t('Patrol.select')" />
    </Form.Item>
    <Form.Item name="location" :label="t('Mobile.pointLocation')" :rules="required"><Input v-model:value="model.location" :maxlength="255" /></Form.Item>
    <Form.Item :label="t('Patrol.tags')"><Select v-model:value="model.tagIds" mode="multiple" :options="tagOptions" :disabled="saving || !canSave || !tags.length" :placeholder="t('Patrol.select')" /></Form.Item>
    <Form.Item :label="t('Patrol.enabled')"><Switch v-model:checked="model.enabled" /></Form.Item>
    <Form.Item :label="t('Mobile.remark')"><Input.TextArea v-model:value="model.description" :maxlength="512" :rows="3" /></Form.Item>
    <Button v-if="canSave" type="primary" block size="large" :loading="saving" @click="save">{{ t('Patrol.save') }}</Button>
  </Form>
  <template v-if="value.id">
    <section class="panel">
      <div class="card-heading"><h2>{{ t('Mobile.pointQr') }}</h2><Button @click="emit('qr')">{{ t('Mobile.showQr') }}</Button></div>
    </section>
    <section class="panel">
      <h2>{{ t('Mobile.category') }}</h2>
      <div v-for="item in currentCategories" :key="item.id" class="category-relation">
        <span>{{ item.name }}</span><div class="inline-actions">
          <Button v-if="canConfigure" :disabled="saving" @click="emit('configure', item.id!)">{{ t('Patrol.patrolConfiguration') }}</Button>
          <Button v-if="canSave" danger :disabled="saving" @click="cancelCategory(item.id!)">{{ t('Mobile.unlinkCategory') }}</Button>
        </div>
      </div>
      <div v-if="canSave" class="category-link">
        <TreeSelect v-model:value="linked" :tree-data="linkOptions" tree-default-expand-all show-search tree-node-filter-prop="title" :placeholder="t('Patrol.select')" :disabled="saving" />
        <Button :disabled="!linked || saving" @click="emit('category', 'link', linked!)">{{ t('Patrol.pointCategories.link') }}</Button>
      </div>
    </section>
  </template>
</template>
