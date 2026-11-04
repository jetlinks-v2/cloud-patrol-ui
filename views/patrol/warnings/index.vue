<template>
  <section class="warning-settings">
    <div class="settings-heading">
      <div>
        <h2>{{ t('Patrol.warning') }}</h2>
        <p>{{ t('Patrol.warningSettingsHint') }}</p>
      </div>
    </div>
    <div class="settings-content"><ConfigurationPage resource="warnings" /></div>
  </section>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ConfigurationPage from '../../../components/ConfigurationPage.vue'
const { t } = useI18n()
</script>
<style scoped>
.warning-settings { display: flex; flex-direction: column; gap: var(--space-4, 1rem); height: 100%; min-height: 0; }
.settings-heading { display: flex; justify-content: space-between; align-items: center; gap: var(--space-4, 1rem); flex-wrap: wrap; }
.settings-heading h2 { margin: 0; font-size: var(--font-size-lg, 1rem); font-weight: 500; }
.settings-heading p { margin: var(--space-2, .5rem) 0 0; color: var(--ant-color-text-secondary, #8c8c8c); }
.settings-content { flex: 1; min-height: 0; }
</style>
