<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Alert, Button, Checkbox, Input, QRCode, Select, Spin, TreeSelect } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { categoryTree } from '../../model/categories'
import { pointQrValue, pointQrFilename } from '../../model/point-qr'
import { patrolProject } from '../projectScope'
import { usePointManagement } from './usePointManagement'
import PointEditor from './PointEditor.vue'
const emit = defineEmits<{ screen: [value: { key: string; depth: number; title: string }]; busy: [value: boolean] }>()
const { t, te } = useI18n()
const { rows, categories, tags, roles, levels, standards, name, category, total, loading, saving, error, saved,
  editor, qr, assignmentCategory, rules, assignmentLoading, assignmentError, canSave, canConfigure, canReadConfiguration,
  load, search, edit, close, save, categoryChange, configure, saveRules } = usePointManagement()
const qrCard = ref<HTMLElement>()
const currentRoles = computed(() => rules.value?.map(rule => rule.roleId).filter(Boolean) || [])
const allStaff = computed(() => rules.value?.some(rule => !rule.roleId))
const listCategories = computed(() => categories.value.filter(item => !patrolProject.value || item.projectId === patrolProject.value))
const configurationOptions = (values: typeof levels.value) => values.filter(item => !item.projectId || item.projectId === editor.value?.projectId).map(item => ({ value: item.id!, label: item.name, disabled: !item.enabled }))
function chooseRoles(ids: string[]) {
  rules.value = [...ids, ...(allStaff.value ? [''] : [])].map(roleId => rules.value?.find(rule => rule.roleId === roleId) || { roleId })
}
function chooseAllStaff(checked: boolean) {
  if (!rules.value) return
  rules.value = checked ? [...rules.value.filter(rule => rule.roleId), rules.value.find(rule => !rule.roleId) || { roleId: '' }] : rules.value.filter(rule => rule.roleId)
}
function downloadQr() {
  const canvas = qrCard.value?.querySelector('canvas')
  if (!canvas || !editor.value) return
  const link = document.createElement('a'); link.href = canvas.toDataURL('image/png'); link.download = pointQrFilename(editor.value); link.click()
}
watch([editor, qr, assignmentCategory], () => {
  emit('screen', { key: qr.value ? 'manage:qr' : assignmentCategory.value ? 'manage:configuration' : editor.value ? `manage:point:${editor.value.id || 'new'}` : 'manage',
    depth: qr.value || assignmentCategory.value ? 3 : editor.value ? 2 : 1,
    title: qr.value ? 'Mobile.pointQr' : assignmentCategory.value ? 'Patrol.patrolConfiguration' : editor.value ? editor.value.id ? 'Mobile.editPoint' : 'Mobile.addPoint' : 'Mobile.entries.manage' })
}, { immediate: true, flush: 'sync' })
watch([saving, assignmentLoading], () => emit('busy', saving.value || assignmentLoading.value), { immediate: true })
defineExpose({ back: close })
</script>
<template>
  <Alert v-if="error" type="error" show-icon class="notice" :message="te(error) ? t(error) : error" />
  <template v-if="qr && editor">
    <section ref="qrCard" class="panel point-qr"><QRCode :value="pointQrValue(editor)" :size="240" /><h2>{{ editor.name }}</h2><p class="muted">{{ editor.code }}</p><Button @click="downloadQr">{{ t('Mobile.saveQr') }}</Button></section>
  </template>
  <template v-else-if="assignmentCategory">
    <div v-if="assignmentLoading" class="empty"><Spin /></div>
    <Alert v-if="assignmentError" type="error" class="notice" :message="te(assignmentError) ? t(assignmentError) : assignmentError" />
    <Button v-if="!rules && !assignmentLoading" @click="configure(assignmentCategory)">{{ t('Mobile.retry') }}</Button>
    <template v-if="rules">
      <section class="panel point-editor">
        <p>{{ categories.find(row => row.id === assignmentCategory)?.name }}</p>
        <Alert type="info" show-icon :message="t('Patrol.assignmentPostsHelp')" />
        <label class="section-title">{{ t('Patrol.post') }}</label>
        <Select :value="currentRoles" mode="multiple" :options="roles.map(row => ({ value: row.id!, label: row.name }))" :disabled="saving || !canConfigure" @update:value="chooseRoles($event as string[])" />
        <p><Checkbox :checked="allStaff" :disabled="saving || !canConfigure" @change="chooseAllStaff($event.target.checked)">{{ t('Patrol.allStaffPatrol') }}</Checkbox></p>
      </section>
      <section v-for="rule in rules" :key="rule.roleId" class="panel point-editor">
        <h3>{{ rule.roleId ? roles.find(row => row.id === rule.roleId)?.name || rule.roleId : t('Patrol.allStaffPatrol') }}</h3>
        <label>{{ t('Patrol.level') }}</label><Select v-model:value="rule.levelId" :options="configurationOptions(levels)" :disabled="saving || !canConfigure" allow-clear />
        <label>{{ t('Patrol.standard') }}</label><Select v-model:value="rule.standardId" :options="configurationOptions(standards)" :disabled="saving || !canConfigure" allow-clear />
      </section>
      <Button v-if="canConfigure" block size="large" type="primary" :loading="saving" @click="saveRules">{{ t('Patrol.save') }}</Button>
    </template>
  </template>
  <template v-else-if="!editor">
    <form class="panel history-filters" @submit.prevent="search()">
      <label><span>{{ t('Mobile.category') }}</span><TreeSelect v-model:value="category" :tree-data="categoryTree(listCategories)" tree-default-expand-all show-search allow-clear tree-node-filter-prop="title" /></label>
      <label><span>{{ t('Mobile.pointName') }}</span><Input v-model:value="name" :maxlength="128" :placeholder="t('Mobile.namePlaceholder')" /></label>
      <div class="history-filter-actions"><Button :disabled="loading" @click="search(true)">{{ t('Mobile.reset') }}</Button><Button type="primary" html-type="submit" :loading="loading">{{ t('Mobile.search') }}</Button></div>
    </form>
    <div class="management-toolbar"><span>{{ t('Mobile.pointTotal', { total }) }}</span><Button v-if="canSave" type="primary" :disabled="loading" @click="edit()">{{ t('Mobile.addPoint') }}</Button></div>
    <div v-if="loading && !rows.length" class="empty"><Spin /></div>
    <div v-else-if="error && !rows.length" class="empty"><Button @click="load()">{{ t('Mobile.retry') }}</Button></div>
    <div v-else-if="!rows.length" class="empty">{{ t('Mobile.emptyPoints') }}</div>
    <button v-for="item in rows" :key="item.id" type="button" class="panel history-card" :disabled="loading" @click="edit(item)">
      <div class="card-heading"><h2>{{ item.name }}</h2><span>{{ t(canSave ? 'Patrol.edit' : 'Mobile.details') }} ›</span></div>
      <p class="muted">{{ t('Patrol.code') }}：{{ item.code || '—' }}</p>
      <p class="muted">{{ t('Mobile.pointLocation') }}：{{ item.location || '—' }}</p>
      <p class="muted">{{ t('Patrol.projects.label') }}：{{ item.projectName || '—' }}</p>
      <p class="muted">{{ (item.categoryIds || [item.categoryId]).map(id => categories.find(row => row.id === id)?.name).filter(Boolean).join('、') }}</p>
    </button>
    <Button v-if="rows.length < total" block :loading="loading" @click="load(true)">{{ t('Mobile.more') }}</Button>
  </template>
  <!-- 二维码、角色规则是点位的子页面；切换时保留尚未保存的基本信息输入。 -->
  <div v-if="editor" v-show="!qr && !assignmentCategory">
    <Alert v-if="saved" class="notice" type="success" show-icon :message="t('Mobile.pointSaved')" />
    <PointEditor :value="editor" :categories="categories" :tags="tags" :can-save="canSave" :can-configure="canReadConfiguration" :saving="saving"
      @save="save" @category="categoryChange" @configure="configure" @qr="qr = true" />
  </div>
</template>
