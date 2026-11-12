<template>
  <div class="patrol-project-workspace">
    <a-alert v-if="failed" type="error" show-icon :message="t('Patrol.projects.failed')">
      <template #action><a-button :loading="loading" @click="load">{{ t('Patrol.refresh') }}</a-button></template>
    </a-alert>
    <div v-else-if="initialized && !loading" :key="revision" class="patrol-project-content"><slot /></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Button as AButton, Alert as AAlert } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useProjects } from '../composables/useProjects'
const { t } = useI18n()
const { revision, loading, failed, load } = useProjects()
// 首次项目树完成前不挂载业务页，避免先查询、随 loading 卸载、再挂载重复查询。
const initialized = ref(false)
onMounted(async () => {
  await load()
  initialized.value = true
})
</script>
<style scoped>
.patrol-project-workspace { height:100%; display:flex; flex-direction:column; gap:12px; min-height:0; }
.patrol-project-content { flex:1; min-height:0; }
</style>
