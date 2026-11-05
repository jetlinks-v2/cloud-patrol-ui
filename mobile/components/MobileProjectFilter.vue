<template>
  <div class="mobile-project-filter">
    <label for="patrol-mobile-project">{{ t('Patrol.projects.label') }}</label>
    <TreeSelect id="patrol-mobile-project" :value="patrolProject" :tree-data="options" :placeholder="t('Patrol.projects.all')" allow-clear
      tree-default-expand-all show-search tree-node-filter-prop="title" :loading="loading" :disabled="disabled"
      :status="failed ? 'error' : undefined" style="width:100%" @update:value="select" />
    <div v-if="failed" class="project-load-error" role="alert"><span>{{ t('Patrol.projects.failed') }}</span><Button @click="load">{{ t('Mobile.refresh') }}</Button></div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { TreeSelect, Button } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { request } from '../transport'
import { patrolProject } from '../projectScope'
import { projectTree, findOrganization, type OrganizationNode } from '../../model/projects'
defineProps<{ disabled?: boolean }>()
const { t } = useI18n()
const nodes = ref<OrganizationNode[]>([]), loading = ref(false), failed = ref(false)
const options = computed(() => projectTree(nodes.value))
async function load() {
  loading.value = true; failed.value = false
  // 重新取授权树时不携带旧项目筛选，撤权或改为普通组织后仍可恢复选择。
  try { nodes.value = await request<OrganizationNode[]>('/park/patrol/projects/_tree', 'GET', undefined, '')
    const selected = findOrganization(nodes.value, patrolProject.value)
    if (patrolProject.value && (!selected || projectTree([selected])[0].disabled)) patrolProject.value = undefined
  } catch { failed.value = true; nodes.value = []; patrolProject.value = undefined }
  finally { loading.value = false }
}
function select(value: unknown) {
  if (typeof value !== 'string' || !value) { patrolProject.value = undefined; return }
  const node = findOrganization(nodes.value, value)
  if (node && !projectTree([node])[0].disabled) patrolProject.value = value
}
onMounted(load)
</script>
<style scoped>
.mobile-project-filter { margin-bottom: 12px; }
.mobile-project-filter > label { display: block; margin-bottom: 6px; color: #555; font-size: 13px; }
:global(.points-home) .mobile-project-filter { margin: 0 12px 12px; }
.project-load-error { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; color: #bf3333; font-size: 13px; }
</style>
