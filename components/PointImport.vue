<template>
  <a-drawer :open="true" :title="t('Patrol.pointImport.title')" :width="1000" :mask-closable="!busy" :closable="!busy" @close="emit('close')">
    <a-space direction="vertical" :size="16" style="width:100%">
      <label>{{ t('Patrol.projects.label') }}<ProjectTreeSelect v-model="projectId" :disabled="busy" /></label>
      <a-alert v-if="!projectId" type="error" :message="t('Patrol.projects.select')" />
      <a-alert type="info" show-icon :message="t('Patrol.pointImport.hint')" />
      <a-alert v-if="failed" type="error" :message="t('Patrol.pointImport.failed')" />
      <a-space>
        <a-button :loading="busy" :disabled="!projectId || busy" @click="download">{{ t('Patrol.pointImport.template') }}</a-button>
        <a-upload accept=".xls,.xlsx" :before-upload="selectFile" :show-upload-list="false" :disabled="!projectId || busy">
          <a-button :disabled="!projectId || busy">{{ t('Patrol.pointImport.choose') }}</a-button>
        </a-upload>
        <span>{{ file?.name }}</span>
      </a-space>
      <a-alert v-if="rows.length" :type="errorCount ? 'warning' : 'success'"
        :message="t('Patrol.pointImport.summary', { total: rows.length, valid: validCount, errors: errorCount, categories: categoryCount })" />
      <a-button v-if="errorCount" @click="downloadErrors">{{ t('Patrol.pointImport.downloadErrors') }}</a-button>
      <a-table :columns="columns" :data-source="rows" row-key="rowNumber" :loading="busy" :pagination="{ pageSize: 10 }" :scroll="{ x: 900 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'errors'">
            <a-tag v-if="!record.errors.length" color="success">{{ t('Patrol.pointImport.valid') }}</a-tag>
            <span v-else class="errors">{{ record.errors.map((error: string) => t(`Patrol.pointImport.errors.${error}`)).join('；') }}</span>
          </template>
        </template>
      </a-table>
      <j-permission-button type="primary" has-permission="patrol/points:save" :disabled="!valid || busy" :loading="busy" @click="submit">{{ t('Patrol.confirmImport') }}</j-permission-button>
    </a-space>
  </a-drawer>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert as AAlert, Drawer as ADrawer, Space as ASpace, Upload as AUpload, Button as AButton, Table as ATable, Tag as ATag } from 'ant-design-vue'
import ProjectTreeSelect from './ProjectTreeSelect.vue'
import { usePointImport } from '../composables/usePointImport'
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const { projectId, file, rows, busy, failed, valid, validCount, categoryCount, errorCount, selectFile, download, downloadErrors, submit } = usePointImport(() => emit('saved'))
const columns = computed(() => [
  { title: t('Patrol.pointImport.row'), dataIndex: 'rowNumber', width: 70 },
  { title: t('Patrol.category'), dataIndex: 'categoryName', width: 140 },
  { title: t('Patrol.names.points'), dataIndex: 'name', width: 180 },
  { title: t('Patrol.location'), dataIndex: 'location', width: 200 },
  { title: t('Patrol.pointImport.validation'), key: 'errors', width: 300 },
])
</script>
<style scoped>.errors { color: var(--ant-color-error, #ff4d4f); }</style>
