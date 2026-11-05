<template>
  <a-modal :open="true" :title="t('Patrol.projects.migrate')" :width="900" :confirm-loading="saving"
    :ok-button-props="{ disabled: !selected.length || !project }" @cancel="emit('close')" @ok="assign">
    <a-alert type="info" show-icon :message="t('Patrol.projects.migrationHint')" style="margin-bottom:16px" />
    <a-space style="margin-bottom:16px">
      <a-select v-model:value="type" :options="types" style="width:160px" @change="load(0)" />
      <span>{{ t('Patrol.projects.label') }}</span>
      <ProjectTreeSelect v-model="project" style="width:300px" />
    </a-space>
    <a-alert v-if="failed" type="error" :message="t('Patrol.loadFailed')" />
    <a-table :columns="columns" :data-source="rows" :loading="loading" row-key="id"
      :row-selection="{ selectedRowKeys: selected, onChange: select }"
      :pagination="{ current: page + 1, pageSize: 20, total, onChange: (value: number) => load(value - 1) }" />
  </a-modal>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Alert as AAlert, Modal as AModal, Select as ASelect, Space as ASpace, Table as ATable } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import ProjectTreeSelect from './ProjectTreeSelect.vue'
import { request } from '../api/request'
import { selectedProject } from '../composables/useProjects'
import { resourceTypes } from '../model/resources'
import type { ConfigEntity, Page, Resource } from '../api/types'
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
type MigrationResource = Exclude<Resource, 'roles'> | 'attachments'
const assetType = (value: MigrationResource) => value === 'attachments' ? 'patrolAttachment' : resourceTypes[value]
const label = (value: MigrationResource) => t(value === 'attachments' ? 'Patrol.projects.attachments' : `Patrol.names.${value}`)
const type = ref<MigrationResource>('categories'), project = ref(selectedProject()), rows = ref<ConfigEntity[]>([])
const selected = ref<string[]>([]), page = ref(0), total = ref(0), loading = ref(false), saving = ref(false), failed = ref(false)
let generation = 0
const types = computed(() => (['attachments', 'categories', 'tags', 'levels', 'warnings', 'standards', 'points', 'rosters', 'plans'] as MigrationResource[])
  .map(value => ({ value, label: label(value) })))
const columns = computed(() => [{ title: label(type.value), dataIndex: 'name' },
  { title: t('Patrol.code'), dataIndex: 'code' }])
function select(keys: (string | number)[]) { selected.value = keys.map(String) }
async function load(index = page.value) {
  const current = ++generation
  loading.value = true; failed.value = false; selected.value = []; page.value = index
  try {
    const response = await request.post<Page<ConfigEntity>>('/park/patrol/project-migrations/_query',
      { type: assetType(type.value), query: { pageIndex: index, pageSize: 20, sorts: [{ name: 'createTime', order: 'asc' }, { name: 'id', order: 'asc' }] } })
    if (current !== generation) return
    if (!response.success) throw new Error('migration query failed')
    rows.value = response.result.data; total.value = response.result.total
  } catch { if (current === generation) { failed.value = true; rows.value = []; total.value = 0 } }
  finally { if (current === generation) loading.value = false }
}
async function assign() {
  if (saving.value || !selected.value.length || !project.value) return
  saving.value = true; failed.value = false
  try {
    const response = await request.post('/park/patrol/project-migrations/assign',
      { type: assetType(type.value), ids: selected.value, projectId: project.value })
    if (!response.success) throw new Error('migration failed')
    await load(0)
  } catch { failed.value = true }
  finally { saving.value = false }
}
onMounted(() => load(0))
</script>
