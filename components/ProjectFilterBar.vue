<template>
  <div class="patrol-filter-bar">
    <label class="patrol-project-filter">
      <span>{{ t('Patrol.projects.label') }}</span>
      <ProjectTreeSelect :model-value="selected" :placeholder="t('Patrol.projects.all')" @update:model-value="select" />
    </label>
    <slot />
    <a-button class="patrol-mobile-entry" @click="openMobile">{{ t('Patrol.mobileEntry') }}</a-button>
  </div>
</template>
<script setup lang="ts">
import { Button as AButton } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import ProjectTreeSelect from './ProjectTreeSelect.vue'
import { useProjects } from '../composables/useProjects'
import { useMobileEntry } from '../composables/useMobileEntry'
const { t } = useI18n()
const { selected, select } = useProjects()
const { openMobile } = useMobileEntry()
</script>
<style scoped>
.patrol-filter-bar { display:flex; align-items:center; flex-wrap:wrap; gap:12px; min-width:0; }
.patrol-project-filter { display:flex; align-items:center; gap:8px; flex:0 1 auto; min-width:0; margin:0; }
.patrol-project-filter > span { white-space:nowrap; }
.patrol-project-filter :deep(.ant-select) { width:240px!important; max-width:60vw; }
.patrol-filter-bar :deep(.condition-filter) { flex:1 1 280px; min-width:0; }
.patrol-mobile-entry { margin-left:auto; }
</style>
