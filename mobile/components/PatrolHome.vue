<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { CloudDownloadOutlined, EnvironmentFilled } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { HomeTaskState } from '../home'
defineProps<{ summary: { ready: number; cooldown: number; completed: number }; missed?: number; loading: boolean; failed: boolean; missedFailed: boolean; projectSelected: boolean }>()
const emit = defineEmits<{ enter: [page: 'tasks' | 'manage' | 'history' | 'missed' | 'offline']; tasks: [state: HomeTaskState]; refresh: [] }>()
const { t } = useI18n()
</script>
<template>
  <section class="home-stats" :aria-busy="loading" :aria-label="t('Mobile.todaySummary')">
    <button v-for="key in (['ready', 'cooldown', 'completed'] as const)" :key="key" type="button" class="home-stat" :disabled="!projectSelected || loading || failed" @click="emit('tasks', key)">
      <span>{{ t(`Mobile.homeStats.${key}`) }}</span><strong>{{ loading || failed || !projectSelected ? '—' : summary[key] }}</strong>
      <small>{{ t('Mobile.details') }} ›</small>
    </button>
    <button type="button" class="home-stat" :disabled="!projectSelected" @click="emit('enter', 'missed')">
      <span>{{ t('Mobile.homeStats.missed') }}</span><strong>{{ loading || missed === undefined ? '—' : missed }}</strong>
      <small>{{ t(missedFailed ? 'Mobile.summaryFailed' : 'Mobile.missedRange') }} ›</small>
    </button>
  </section>
  <p class="home-count-hint">{{ t('Mobile.summaryHint') }}</p>
  <nav class="home-menu" :aria-label="t('Mobile.homeTitle')">
    <button v-for="key in (['tasks', 'manage', 'history', 'missed'] as const)" :key="key" type="button" class="home-menu-item" :disabled="!projectSelected" @click="emit('enter', key)">
      <EnvironmentFilled aria-hidden="true" /><strong>{{ t(`Mobile.entries.${key}`) }}</strong><span>{{ t('Mobile.details') }}</span>
    </button>
  </nav>
  <section class="offline-entry">
    <h2>{{ t('Mobile.offlineWork') }}</h2>
    <button type="button" class="home-menu-item" @click="emit('enter', 'offline')">
      <CloudDownloadOutlined aria-hidden="true" /><strong>{{ t('Mobile.offlineTitle') }}</strong><span>{{ t('Mobile.offlineUnavailable') }}</span>
    </button>
  </section>
  <div class="point-refresh"><Button :loading="loading" :disabled="!projectSelected" @click="emit('refresh')">{{ t('Mobile.refresh') }}</Button></div>
</template>
