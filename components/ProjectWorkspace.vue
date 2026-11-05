<template>
  <div class="patrol-project-workspace">
    <a-alert v-if="failed" type="error" show-icon :message="t('Patrol.projects.failed')">
      <template #action><a-button :loading="loading" @click="load">{{ t('Patrol.refresh') }}</a-button></template>
    </a-alert>
    <div v-else-if="!loading" :key="revision" class="patrol-project-content"><slot /></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { Button as AButton, Alert as AAlert } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useProjects } from '../composables/useProjects'
const { t } = useI18n()
const { revision, loading, failed, load } = useProjects()
onMounted(load)
</script>
<style scoped>
.patrol-project-workspace { height:100%; display:flex; flex-direction:column; gap:12px; min-height:0; }
.patrol-project-content { flex:1; min-height:0; }
</style>
