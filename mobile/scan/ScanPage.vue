<script setup lang="ts">
import { ref } from 'vue'
import { Alert, Button, Spin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import type { MobileTask } from '../model'
import { dateTime } from '../../model/display'
import { usePointScanner } from './usePointScanner'
const props = defineProps<{ resolve: (raw: string) => Promise<MobileTask[]> }>()
const emit = defineEmits<{ select: [row: MobileTask] }>()
const { t } = useI18n(), video = ref<HTMLVideoElement>()
const { matches, busy, scanning, error, start } = usePointScanner(video, raw => props.resolve(raw), row => emit('select', row))
</script>
<template>
  <section class="panel scan-panel">
    <h2>{{ t('Mobile.scanTitle') }}</h2>
    <p>{{ t('Mobile.scanHint') }}</p>
    <video ref="video" v-show="scanning" class="scan-video" muted playsinline :aria-label="t('Mobile.scanCamera')" />
    <p v-if="scanning" role="status">{{ t('Mobile.scanWaiting') }}</p>
    <Spin v-if="busy" :tip="t('Mobile.scanMatching')" />
    <Alert v-if="error" type="warning" show-icon :message="t(error)" />
    <template v-if="matches.length > 1">
      <h3>{{ t('Mobile.scanChoose') }}</h3>
      <section v-for="row in matches" :key="row.task.id" class="scan-task">
        <h3>{{ row.task.pointName || row.task.name }}</h3>
        <p>{{ row.task.postName }}</p>
        <p>{{ dateTime(row.task.startTime) }} — {{ dateTime(row.task.endTime) }}</p>
        <p>{{ t('Mobile.progress', { done: row.task.completedCount, total: row.task.requiredCount }) }}</p>
        <Button type="primary" @click="emit('select', row)">{{ t('Mobile.start') }}</Button>
      </section>
    </template>
    <Button v-if="!scanning && !busy" block @click="start">{{ t('Mobile.scanRetry') }}</Button>
  </section>
</template>
<style scoped>
.scan-video { display: block; width: 100%; max-height: 52vh; margin-bottom: 16px; background: #111; object-fit: contain; }
.scan-task { padding: 12px 0; border-bottom: 1px solid #eee; }
.scan-panel > .ant-btn { margin-top: 16px; }
</style>
