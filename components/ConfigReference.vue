<template><a-spin v-if="loading" size="small" /><span v-else :class="{ 'reference-error': failed }">{{ label }}</span></template>
<script setup lang="ts">
import { computed, toRef } from 'vue'
import { Spin as ASpin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useRemoteOptions } from '../composables/useRemoteOptions'
import type { Resource } from '../api/types'
const props = defineProps<{ resource: Resource | 'persons'; id?: string | string[] }>()
const { t } = useI18n()
const { options, loading, failed } = useRemoteOptions(props.resource, toRef(props, 'id'))
const label = computed(() => {
  if (failed.value) return t('Patrol.loadFailed')
  const ids = Array.isArray(props.id) ? props.id : props.id ? [props.id] : []
  return ids.map(id => options.value.find(item => item.value === id)?.label ?? '—').join('、') || '—'
})
</script>
<style scoped>.reference-error { color: var(--ant-color-error, #ff4d4f); }</style>
