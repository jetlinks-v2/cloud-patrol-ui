<script setup lang="ts">
import { ref } from 'vue'
import { Alert, Button, Spin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import type { MobileTask } from '../model'
import { dateTime } from '../../model/display'
import { usePointScanner } from './usePointScanner'
const props = defineProps<{ resolve: (raw: string) => Promise<MobileTask[]> }>()
const emit = defineEmits<{ select: [row: MobileTask] }>()
const { t } = useI18n(), fileInput = ref<HTMLInputElement>()
const { matches, busy, scanning, error, start } = usePointScanner(raw => props.resolve(raw), row => emit('select', row))
function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void start(file)
}
</script>
<template>
  <section class="panel scan-panel">
    <h2>{{ t('Mobile.scanTitle') }}</h2>
    <p>{{ t('Mobile.scanHint') }}</p>
    <input ref="fileInput" class="scan-file-input" type="file" accept="image/*" :aria-label="t('Mobile.scanSelectFile')" @change="chooseFile" />
    <Button block :disabled="scanning || busy" @click="fileInput?.click()">{{ t('Mobile.scanSelectFile') }}</Button>
    <Spin v-if="scanning || busy" :tip="t(scanning ? 'Mobile.scanWaiting' : 'Mobile.scanMatching')" />
    <Alert v-if="error" type="warning" show-icon :message="t(error)" />
    <template v-if="matches.length > 1">
      <h3>{{ t('Mobile.scanChoose') }}</h3>
      <section v-for="row in matches" :key="row.task.id" class="scan-task">
        <h3>{{ row.task.pointName || row.task.name }}</h3>
        <p>{{ row.task.roleId ? row.task.roleName : t('Patrol.allStaffPatrol') }}</p>
        <p>{{ dateTime(row.task.startTime) }} — {{ dateTime(row.task.endTime) }}</p>
        <p>{{ t('Mobile.progress', { done: row.task.completedCount, total: row.task.requiredCount }) }}</p>
        <Button type="primary" @click="emit('select', row)">{{ t('Mobile.start') }}</Button>
      </section>
    </template>
  </section>
</template>
<style scoped>
.scan-file-input { display: none; }
.scan-task { padding: 12px 0; border-bottom: 1px solid #eee; }
.scan-panel > .ant-btn { margin-top: 16px; }
</style>
