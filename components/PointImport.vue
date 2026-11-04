<template>
  <a-drawer :open="true" :title="t('Patrol.pointImport.title')" :width="1000" :mask-closable="!busy" :closable="!busy" @close="emit('close')">
    <a-space direction="vertical" :size="16" style="width:100%">
      <a-alert type="info" show-icon :message="t('Patrol.pointImport.hint')" />
      <a-alert v-if="failed" type="error" :message="t('Patrol.pointImport.failed')" />
      <a-space>
        <a-button :loading="busy" @click="download">{{ t('Patrol.pointImport.template') }}</a-button>
        <a-upload accept=".xls,.xlsx" :before-upload="selectFile" :show-upload-list="false" :disabled="busy">
          <a-button :disabled="busy">{{ t('Patrol.pointImport.choose') }}</a-button>
        </a-upload>
        <span>{{ file?.name }}</span>
      </a-space>
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
import { usePointImport } from '../composables/usePointImport'
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const { file, rows, busy, failed, valid, selectFile, download, submit } = usePointImport(() => emit('saved'))
const columns = computed(() => [
  { title: t('Patrol.pointImport.row'), dataIndex: 'rowNumber', width: 70 },
  { title: t('Patrol.category'), dataIndex: 'categoryName', width: 140 },
  { title: t('Patrol.names.points'), dataIndex: 'name', width: 180 },
  { title: t('Patrol.location'), dataIndex: 'location', width: 200 },
  { title: t('Patrol.pointImport.validation'), key: 'errors', width: 300 },
])
</script>
<style scoped>.errors { color: var(--ant-color-error, #ff4d4f); }</style>
