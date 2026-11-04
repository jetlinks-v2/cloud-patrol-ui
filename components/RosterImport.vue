<template>
  <a-drawer :open="true" :title="t('Patrol.importRoster')" :width="720" @close="emit('close')">
    <a-space direction="vertical" style="width:100%" :size="16">
      <a-alert type="info" show-icon :message="t('Patrol.rosterTemplateHint')" />
      <a-alert v-if="failed" type="error" :message="t('Patrol.saveFailed')" />
      <a-alert v-if="imported !== undefined" type="success" :message="t('Patrol.imported', { count: imported })" />
      <a-date-picker v-model:value="month" picker="month" value-format="YYYY-MM" :allow-clear="false" :disabled="busy" />
      <a-button :loading="busy" @click="download">{{ t('Patrol.downloadRosterTemplate') }}</a-button>
      <a-upload accept=".xlsx" :before-upload="selectFile" :show-upload-list="false" :disabled="busy">
        <a-button>{{ t('Patrol.chooseWorkbook') }}</a-button>
      </a-upload>
      <span v-if="file">{{ file.name }}</span>
      <a-popconfirm :title="t('Patrol.replaceRosterConfirm', { month })" :disabled="!file || busy" @confirm="submit">
        <j-permission-button type="primary" has-permission="patrol/points:importRoster" :loading="busy" :disabled="!file || busy">{{ t('Patrol.confirmImport') }}</j-permission-button>
      </a-popconfirm>
    </a-space>
  </a-drawer>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Drawer as ADrawer, Space as ASpace, Alert as AAlert, DatePicker as ADatePicker, Button as AButton, Upload as AUpload, Popconfirm as APopconfirm } from 'ant-design-vue'
import { useRosterImport } from '../composables/useRosterImport'
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const { month, file, busy, failed, imported, download, submit, selectFile } = useRosterImport()
</script>
