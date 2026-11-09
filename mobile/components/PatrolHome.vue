<script setup lang="ts">
import { Button } from 'ant-design-vue'
import { CloudDownloadOutlined, EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ScanOutlined, HistoryOutlined, RightOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import patrolScene from '../assets/patrol-scene.svg'
import type { HomeTaskState } from '../home'
defineProps<{ summary: { ready: number; cooldown: number; completed: number }; missed?: number; loading: boolean; failed: boolean; missedFailed: boolean; projectSelected: boolean }>()
const emit = defineEmits<{ enter: [page: 'tasks' | 'manage' | 'history' | 'missed' | 'offline']; tasks: [state: HomeTaskState]; refresh: [] }>()
const { t } = useI18n()
const statIcons = { ready: EnvironmentOutlined, cooldown: ClockCircleOutlined, completed: CheckCircleOutlined }
const entryIcons = { tasks: ScanOutlined, manage: EnvironmentOutlined, history: HistoryOutlined, missed: ExclamationCircleOutlined }
</script>
<template>
  <section class="patrol-hero">
    <div><span class="hero-eyebrow">{{ t('Mobile.loginWorkplace') }}</span><h2>{{ t('Mobile.heroTitle') }}</h2><p>{{ t('Mobile.heroHint') }}</p></div>
    <img :src="patrolScene" alt="" width="320" height="240" />
  </section>
  <div class="home-section-heading"><h2>{{ t('Mobile.todaySummary') }}</h2><Button type="text" size="small" :loading="loading" :disabled="!projectSelected" @click="emit('refresh')">{{ t('Mobile.refresh') }}</Button></div>
  <section class="home-stats" :aria-busy="loading" :aria-label="t('Mobile.todaySummary')">
    <button v-for="key in (['ready', 'cooldown', 'completed'] as const)" :key="key" type="button" class="home-stat" :class="key" :disabled="!projectSelected || loading || failed" @click="emit('tasks', key)">
      <span class="home-stat-label"><component :is="statIcons[key]" aria-hidden="true" />{{ t(`Mobile.homeStats.${key}`) }}</span><strong>{{ loading || failed || !projectSelected ? '—' : summary[key] }}</strong>
      <small>{{ t('Mobile.details') }} ›</small>
    </button>
    <button type="button" class="home-stat missed" :disabled="!projectSelected" @click="emit('enter', 'missed')">
      <span class="home-stat-label"><ExclamationCircleOutlined aria-hidden="true" />{{ t('Mobile.homeStats.missed') }}</span><strong>{{ loading || missed === undefined ? '—' : missed }}</strong>
      <small>{{ t(missedFailed ? 'Mobile.summaryFailed' : 'Mobile.missedRange') }} ›</small>
    </button>
  </section>
  <p class="home-count-hint">{{ t('Mobile.summaryHint') }}</p>
  <div class="home-section-heading"><h2>{{ t('Mobile.quickEntries') }}</h2></div>
  <nav class="home-menu" :aria-label="t('Mobile.homeTitle')">
    <button v-for="key in (['tasks', 'manage', 'history', 'missed'] as const)" :key="key" type="button" class="home-menu-item" :class="key" :disabled="!projectSelected" @click="emit('enter', key)">
      <span class="home-entry-icon"><component :is="entryIcons[key]" aria-hidden="true" /></span><strong>{{ t(`Mobile.entries.${key}`) }}</strong><span class="home-entry-hint">{{ t(`Mobile.entryHints.${key}`) }}</span><RightOutlined class="home-entry-arrow" aria-hidden="true" />
    </button>
  </nav>
  <section class="offline-entry">
    <button type="button" class="home-menu-item" @click="emit('enter', 'offline')">
      <CloudDownloadOutlined aria-hidden="true" /><strong>{{ t('Mobile.offlineTitle') }}</strong><span>{{ t('Mobile.offlineUnavailable') }}</span>
    </button>
  </section>
</template>
