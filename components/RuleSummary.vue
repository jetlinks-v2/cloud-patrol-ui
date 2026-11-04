<template>
  <div class="rule-summary">
    <div v-if="!rows.length">{{ t('Patrol.ruleSummary.empty') }}</div>
    <div v-for="(row, index) in rows" :key="index">
      <strong>{{ row.date || row.days.map(day => t(`Patrol.week${day}`)).join('、') }}：</strong>
      <span v-if="!row.windows.length">{{ t('Patrol.ruleSummary.rest') }}</span>
      <span v-for="(window, windowIndex) in row.windows" :key="windowIndex" class="rule-window">
        {{ ruleWindowTime(window).start }}–{{ ruleWindowTime(window).end }}<span v-if="ruleWindowTime(window).nextDay">（{{ t('Patrol.ruleSummary.nextDay') }}）</span>
        <span v-else-if="window.startMinute === window.endMinute">（{{ t('Patrol.ruleSummary.allDay') }}）</span>
        {{ t('Patrol.ruleEditor.every') }} {{ ruleQuantity(window.intervalMinutes, window.frequencyUnit).value }} {{ t(`Patrol.ruleEditor.unit${ruleQuantity(window.intervalMinutes, window.frequencyUnit).unit}`) }}{{ t('Patrol.ruleEditor.patrol') }} {{ window.requiredCount }} {{ t('Patrol.times') }}，
        {{ t('Patrol.ruleEditor.interval') }} {{ ruleQuantity(window.cooldownMinutes ?? rule?.cooldownMinutes ?? 0, window.cooldownUnit).value }} {{ t(`Patrol.ruleEditor.unit${ruleQuantity(window.cooldownMinutes ?? rule?.cooldownMinutes ?? 0, window.cooldownUnit).unit}`) }}
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PatrolRule } from '../api/types'
import { ruleSummaryRows, ruleWindowTime, ruleQuantity } from '../model/rules'
const props = defineProps<{ rule?: PatrolRule }>()
const { t } = useI18n()
const rows = computed(() => ruleSummaryRows(props.rule))
</script>
<style scoped>
.rule-summary { white-space: normal; line-height: 1.7; }
.rule-window { display: inline-block; margin-inline-end: 12px; }
</style>
