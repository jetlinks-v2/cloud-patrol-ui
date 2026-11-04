<template>
  <div class="patrol-project-workspace">
    <div class="patrol-project-toolbar">
      <span>{{ t('Patrol.projects.label') }}</span>
      <ProjectTreeSelect :model-value="selected" :placeholder="t('Patrol.projects.all')" @update:model-value="select" />
      <j-permission-button has-permission="patrol/points:save" @click="migration = true">{{ t('Patrol.projects.migrate') }}</j-permission-button>
      <a-button :loading="loading" @click="load">{{ t('Patrol.refresh') }}</a-button>
    </div>
    <ProjectMigration v-if="migration" @close="migration = false; load()" />
    <a-alert v-if="failed" type="error" show-icon :message="t('Patrol.projects.failed')" />
    <div v-else-if="!loading" :key="revision" class="patrol-project-content"><slot /></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, defineAsyncComponent } from 'vue'
const ProjectMigration = defineAsyncComponent(() => import('./ProjectMigration.vue'))
const migration = ref(false)
import { Button as AButton, Alert as AAlert } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import ProjectTreeSelect from './ProjectTreeSelect.vue'
import { useProjects } from '../composables/useProjects'
const { t } = useI18n()
const { selected, revision, loading, failed, load, select } = useProjects()
onMounted(load)
</script>
<style scoped>
.patrol-project-workspace { height:100%; display:flex; flex-direction:column; gap:12px; min-height:0; }
.patrol-project-toolbar { display:flex; align-items:center; gap:12px; }
.patrol-project-toolbar :deep(.ant-select) { width:320px!important; max-width:65vw; }
.patrol-project-content { flex:1; min-height:0; }
</style>
