<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Input, Select, Spin } from 'ant-design-vue'
import type { ConfigEntity } from '../../api/types'
import type { MobileTask } from '../model'
import { pointGroups, type PointGroup } from '../points'
const props = defineProps<{ rows: MobileTask[]; categories: ConfigEntity[]; mine: boolean; loading: boolean; now: number }>()
const emit = defineEmits<{ mine: [value: boolean]; select: [value: PointGroup] }>()
const { t } = useI18n()
const keyword = ref(''), category = ref<string>()
const points = computed(() => pointGroups(props.rows, keyword.value, category.value || '', props.categories, props.now))
const options = computed(() => props.categories.map(item => ({ label: item.name, value: item.id })))
</script>
<template>
  <section class="point-controls">
    <nav class="people-tabs" :aria-label="t('Mobile.pointScope')">
      <button type="button" :class="{ active: !mine }" :aria-pressed="!mine" @click="emit('mine', false)">{{ t('Mobile.everyone') }}</button>
      <button type="button" :class="{ active: mine }" :aria-pressed="mine" @click="emit('mine', true)">{{ t('Mobile.mine') }}</button>
    </nav>
    <div class="point-filters">
      <Select v-model:value="category" allow-clear :options="options" :placeholder="t('Mobile.categoryPlaceholder')" :aria-label="t('Mobile.categoryPlaceholder')" :bordered="false" />
      <Input v-model:value="keyword" allow-clear :placeholder="t('Mobile.namePlaceholder')" :aria-label="t('Mobile.namePlaceholder')" :bordered="false">
        <template #prefix><span class="search-icon" aria-hidden="true" /></template>
      </Input>
    </div>
  </section>
  <div class="point-legend" :aria-label="t('Mobile.pointStates')">
    <span><i class="dot completed" />{{ t('Mobile.legendCompleted') }}</span>
    <span><i class="dot cooldown" />{{ t('Mobile.legendCooldown') }}</span>
    <span><i class="dot ready" />{{ t('Mobile.legendReady') }}</span>
  </div>
  <div v-if="loading" class="empty"><Spin /><p>{{ t('Mobile.loading') }}</p></div>
  <div v-else-if="!points.length" class="empty"><p>{{ t(keyword || category ? 'Mobile.noMatchingPoints' : 'Mobile.noCurrentPoints') }}</p></div>
  <div v-else class="point-grid">
    <button v-for="point in points" :key="point.id" type="button" class="point-tile" :class="point.state"
      :aria-label="`${point.name}，${t(`Mobile.pointState.${point.state}`)}`" @click="emit('select', point)">
      <span class="map-pin" aria-hidden="true"><svg viewBox="0 0 32 40"><path d="M16 1C7.7 1 2 7.1 2 14.3c0 9.4 14 23.9 14 23.9s14-14.5 14-23.9C30 7.1 24.3 1 16 1Z" fill="currentColor"/><circle cx="16" cy="14" r="5.1" fill="white"/></svg></span>
      <span class="point-name">{{ point.name }}</span>
      <span class="tile-state" :class="point.state" :aria-hidden="true" />
    </button>
  </div>
</template>
