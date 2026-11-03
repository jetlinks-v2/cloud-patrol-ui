<template>
  <ConfigurationPage resource="points">
    <template #toolbar>
      <a-space>
        <j-permission-button has-permission="patrol/points:posts" @click="postsOpen = true">{{ t('Patrol.managePosts') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:importRoster" @click="importOpen = true">{{ t('Patrol.importRoster') }}</j-permission-button>
      </a-space>
    </template>
    <template #actions="{ row }">
      <j-permission-button type="link" has-permission="patrol/points:assign" @click="selectedPoint = row">{{ t('Patrol.assignRules') }}</j-permission-button>
    </template>
  </ConfigurationPage>
  <a-drawer v-if="postsOpen" :open="true" :width="1000" :title="t('Patrol.managePosts')" @close="postsOpen = false">
    <ConfigurationPage resource="posts" />
  </a-drawer>
  <a-drawer v-if="selectedPoint" :open="true" :width="1100" :title="`${selectedPoint.name} · ${t('Patrol.assignRules')}`" @close="selectedPoint = undefined">
    <ConfigurationPage resource="plans" :point="selectedPoint" />
  </a-drawer>
  <RosterImport v-if="importOpen" @close="importOpen = false" />
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Drawer as ADrawer, Space as ASpace } from 'ant-design-vue'
import ConfigurationPage from '../../../components/ConfigurationPage.vue'
import RosterImport from '../../../components/RosterImport.vue'
import type { ConfigEntity } from '../../../api/types'
const { t } = useI18n()
const postsOpen = ref(false), importOpen = ref(false), selectedPoint = ref<ConfigEntity>()
</script>
