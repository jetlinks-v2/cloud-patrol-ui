<template><a-spin v-if="loading" size="small" /><span v-else :class="{ 'reference-error': failed }">{{ label }}</span></template>
<script setup lang="ts">
import { computed } from 'vue'
import { Spin as ASpin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useRemoteOptions } from '../composables/useRemoteOptions'
import type { Resource } from '../api/types'
const props = defineProps<{ resource: Resource | 'persons'; id?: string | string[] }>()
const { t } = useI18n()
// 全员指派没有远程角色，不把空角色 ID 发给认证目录查询。
const remoteIds = computed(() => Array.isArray(props.id) ? props.id.filter(Boolean) : props.id)
const { options, loading, failed } = useRemoteOptions(props.resource, remoteIds)
const label = computed(() => {
  if (failed.value) return t('Patrol.loadFailed')
  const ids = Array.isArray(props.id) ? props.id : props.id ? [props.id] : []
  return ids.map(id => props.resource === 'roles' && id === '' ? t('Patrol.allStaffPatrol')
    : options.value.find(item => item.value === id)?.label ?? '—').join('、') || '—'
})
</script>
<style scoped>.reference-error { color: var(--ant-color-error, #ff4d4f); }</style>
