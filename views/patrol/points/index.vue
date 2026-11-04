<template>
  <div class="point-workspace">
    <aside>
      <a-button style="margin-bottom:12px" @click="categoryId = undefined">{{ t('Patrol.allCategories') }}</a-button>
      <CategoryTree :nodes="tree" :selected-id="categoryId" :loading="loading" :failed="failed" @select="categoryId = $event" />
    </aside>
    <section>
  <a-alert v-if="exportFailed" type="error" :message="t('Patrol.exportFailed')" style="margin-bottom:12px" />
  <ConfigurationPage ref="pointTable" resource="points" :category-id="categoryId" categories-in-sidebar selectable>
    <template #toolbar="{ selected, query }">
      <a-space wrap>
        <j-permission-button has-permission="patrol/points:assign" :disabled="!selected.length" @click="openAssignments(selected, 'posts')">{{ t('Patrol.assignPosts') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:assign" :disabled="!selected.length" @click="openAssignments(selected, 'rules')">{{ t('Patrol.configureRules') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:save" :disabled="!selected.length" @click="categoryChange = { points: selected, action: 'link' }">{{ t('Patrol.pointCategories.link') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:save" :disabled="!selected.length" @click="categoryChange = { points: selected, action: 'cancel' }">{{ t('Patrol.pointCategories.cancel') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:posts" @click="postsOpen = true">{{ t('Patrol.managePosts') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:importRoster" @click="importOpen = true">{{ t('Patrol.importRoster') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:save" @click="pointImportOpen = true">{{ t('Patrol.pointImport.title') }}</j-permission-button>
        <a-button :loading="exporting" @click="download(query, categoryId)">{{ t('Patrol.export') }}</a-button>
        <a-button @click="qr.open(query)">{{ t('Patrol.pointQr.batch') }}</a-button>
      </a-space>
    </template>
    <template #actions="{ row }">
      <a-button type="link" @click="qr.open(row)">{{ t('Patrol.pointQr.title') }}</a-button>
      <j-permission-button type="link" has-permission="patrol/points:assign" @click="openAssignments([row], 'posts')">{{ t('Patrol.assignPosts') }}</j-permission-button>
      <j-permission-button type="link" has-permission="patrol/points:assign" @click="openAssignments([row], 'rules')">{{ t('Patrol.configureRules') }}</j-permission-button>
    </template>
  </ConfigurationPage>
    </section>
  </div>
  <a-drawer v-if="postsOpen" :open="true" :width="1000" :title="t('Patrol.managePosts')" @close="postsOpen = false">
    <ConfigurationPage resource="posts" />
  </a-drawer>
  <PointAssignmentEditor v-if="assignment" :points="assignment.points" :mode="assignment.mode" :category-id="categoryId" @close="assignment = undefined" @saved="assignmentSaved" />
  <PointCategoryEditor v-if="categoryChange" :points="categoryChange.points" :action="categoryChange.action" :category-id="categoryId" @close="categoryChange = undefined" @saved="categoryChange = undefined; pointTable?.refresh()" />
  <RosterImport v-if="importOpen" @close="importOpen = false" />
  <PointImport v-if="pointImportOpen" @close="pointImportOpen = false" @saved="pointImportOpen = false; pointTable?.refresh()" />
  <PointQr v-if="qr.visible" :state="qr" @close="qr.close" @download="qr.download" @print="qr.print" />
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { Drawer as ADrawer, Space as ASpace, Button as AButton, Alert as AAlert } from 'ant-design-vue'
import ConfigurationPage from '../../../components/ConfigurationPage.vue'
import CategoryTree from '../../../components/CategoryTree.vue'
import { useCategories } from '../../../composables/useCategories'
import RosterImport from '../../../components/RosterImport.vue'
import type { ConfigEntity } from '../../../api/types'
import type { AssignmentMode } from '../../../composables/usePointAssignments'
import { usePointExport } from '../../../composables/usePointExport'
import { usePointQr } from '../../../composables/usePointQr'
const PointQr = defineAsyncComponent(() => import('../../../components/PointQr.vue'))
const qr = reactive(usePointQr())
const PointImport = defineAsyncComponent(() => import('../../../components/PointImport.vue'))
const PointAssignmentEditor = defineAsyncComponent(() => import('../../../components/PointAssignmentEditor.vue'))
const PointCategoryEditor = defineAsyncComponent(() => import('../../../components/PointCategoryEditor.vue'))
const { t } = useI18n()
const categoryId = ref<string>()
const { tree, loading, failed, load } = useCategories()
onMounted(load)
const postsOpen = ref(false), importOpen = ref(false)
const pointImportOpen = ref(false)
const { exporting, exportFailed, download } = usePointExport()
const pointTable = ref<InstanceType<typeof ConfigurationPage>>()
const assignment = ref<{ points: ConfigEntity[]; mode: AssignmentMode }>()
const categoryChange = ref<{ points: ConfigEntity[]; action: 'link' | 'cancel' }>()
function openAssignments(points: ConfigEntity[], mode: AssignmentMode) { assignment.value = { points, mode } }
function assignmentSaved() { assignment.value = undefined; pointTable.value?.refresh() }
</script>

<style scoped>
.point-workspace { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 20px; height: 100%; }
aside { overflow: auto; border-right: 1px solid var(--ant-color-border-secondary, #f0f0f0); padding-right: 16px; }
section { min-width: 0; min-height: 0; }
@media (max-width: 760px) { .point-workspace { grid-template-columns: 1fr; } }
</style>
