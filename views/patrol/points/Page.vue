<template>

  <FullPage class="point-workspace">
    <aside class="point-categories">
      <CategoryTree :nodes="tree" :selected-id="categoryId" :loading="loading" :failed="failed" @select="categoryId = $event" />
    </aside>
    <section class="point-list">
  <a-alert v-if="exportFailed" type="error" :message="t('Patrol.exportFailed')" style="margin-bottom:12px" />
  <a-alert v-if="batchQr.failed" type="error" :message="t('Patrol.exportFailed')" style="margin-bottom:12px" />
  <a-alert v-if="batchQr.tooMany" type="warning" :message="t('Patrol.pointQr.limit')" style="margin-bottom:12px" />
  <ConfigurationPage ref="pointTable" resource="points" :category-id="categoryId" :category-rows="rows" categories-in-sidebar selectable>
    <template #toolbar="{ selected, query }">
      <a-space wrap>
        <j-permission-button has-permission="patrol/points:assign" :disabled="!selected.length" @click="openAssignments(selected)">{{ t('Patrol.patrolConfiguration') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:save" :disabled="!selected.length" @click="categoryChange = { points: selected, action: 'cancel' }">{{ t('Patrol.pointCategories.cancel') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:importRoster" @click="importOpen = true">{{ t('Patrol.importRoster') }}</j-permission-button>
        <j-permission-button has-permission="patrol/points:save" @click="pointImportOpen = true">{{ t('Patrol.pointImport.title') }}</j-permission-button>
        <a-button :loading="exporting" @click="download(query, categoryId)">{{ t(selected.length ? 'Patrol.exportSelected' : 'Patrol.export') }}</a-button>
        <a-button :disabled="!selected.length" :loading="batchDownloading" @click="downloadBatch(query)">{{ t('Patrol.pointQr.batch') }}</a-button>
      </a-space>
    </template>
    <template #actions="{ row }">
      <a-button type="link" @click="qr.open(row)">{{ t('Patrol.pointQr.title') }}</a-button>
      <j-permission-button type="link" has-permission="patrol/points:assign" @click="openAssignments([row])">{{ t('Patrol.patrolConfiguration') }}</j-permission-button>
    </template>
  </ConfigurationPage>
    </section>
  </FullPage>
  <PointAssignmentEditor v-if="assignment" :points="assignment.points" :category-id="categoryId" @close="assignment = undefined" @saved="assignmentSaved" />
  <PointCategoryEditor v-if="categoryChange" :points="categoryChange.points" :action="categoryChange.action" :category-id="categoryId" @close="categoryChange = undefined" @saved="categoryChange = undefined; pointTable?.refresh()" />
  <RosterImport v-if="importOpen" @close="importOpen = false" />
  <PointImport v-if="pointImportOpen" @close="pointImportOpen = false" @saved="pointImportOpen = false; pointTable?.refresh()" />
  <PointQr v-if="qr.visible" :state="qr" @close="qr.close" @download="qr.download" @print="qr.print" />
  <div ref="batchCards" class="batch-qr-renderer" aria-hidden="true">
    <div v-for="point in batchQr.rows" :key="point.id" class="qr-card">
      <a-qrcode :value="pointQrValue(point)" type="svg" :size="200" :bordered="false" include-margin />
    </div>
  </div>

</template>
<script setup lang="ts">
import { ref, reactive, onMounted, defineAsyncComponent, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Space as ASpace, Button as AButton, Alert as AAlert, QRCode as AQrcode } from 'ant-design-vue'
import ConfigurationPage from '../../../components/ConfigurationPage.vue'
import CategoryTree from '../../../components/CategoryTree.vue'
import { useCategories } from '../../../composables/useCategories'
import RosterImport from '../../../components/RosterImport.vue'
import type { ConfigEntity, Query } from '../../../api/types'
import { usePointExport } from '../../../composables/usePointExport'
import { usePointQr } from '../../../composables/usePointQr'
import { useProjects } from '../../../composables/useProjects'
import { pointQrValue } from '../../../model/point-qr'
const PointQr = defineAsyncComponent(() => import('../../../components/PointQr.vue'))
const qr = reactive(usePointQr())
const batchQr = reactive(usePointQr()), batchCards = ref<HTMLElement>(), batchDownloading = ref(false)
const { revision: projectRevision } = useProjects()
watch(projectRevision, () => batchQr.close())
/** 批量只使用勾选与当前筛选的交集，在屏幕外生成图片后直接下载ZIP。 */
async function downloadBatch(query: Query) {
  if (batchDownloading.value) return
  batchDownloading.value = true
  try {
    await batchQr.open(query)
    await nextTick()
    await batchQr.downloadAll(batchCards.value)
  } finally { batchQr.close(); batchDownloading.value = false }
}
const PointImport = defineAsyncComponent(() => import('../../../components/PointImport.vue'))
const PointAssignmentEditor = defineAsyncComponent(() => import('../../../components/PointAssignmentEditor.vue'))
const PointCategoryEditor = defineAsyncComponent(() => import('../../../components/PointCategoryEditor.vue'))
const { t } = useI18n()
const categoryId = ref<string>()
const { rows, tree, loading, failed, load } = useCategories()
onMounted(load)
const importOpen = ref(false)
const pointImportOpen = ref(false)
const { exporting, exportFailed, download } = usePointExport()
const pointTable = ref<InstanceType<typeof ConfigurationPage>>()
const assignment = ref<{ points: ConfigEntity[] }>()
const categoryChange = ref<{ points: ConfigEntity[]; action: 'link' | 'cancel' }>()
function openAssignments(points: ConfigEntity[]) { assignment.value = { points } }
function assignmentSaved() { pointTable.value?.refresh() }
</script>

<style scoped>
.point-workspace { display:grid; grid-template-columns:250px minmax(0,1fr); grid-template-rows:minmax(0,1fr); gap:20px; min-height:0; overflow:hidden; }
.point-categories { min-height:0; min-width:0; overflow:hidden; border-right:1px solid var(--ant-color-border-secondary,#f0f0f0); padding-right:16px; }
.point-categories :deep(.category-tree) { height:100%; }
.point-categories :deep(.category-tree > .ant-spin-nested-loading) { flex:1; min-height:0; overflow:auto; overscroll-behavior:contain; scrollbar-gutter:stable; }
.point-list { display:flex; flex-direction:column; min-width:0; min-height:0; overflow:hidden; }
.point-list > .ant-alert { flex-shrink:0; }
.batch-qr-renderer { position: fixed; left: -10000px; top: 0; visibility: hidden; pointer-events: none; }
@media (max-width:760px) { .point-workspace { grid-template-columns:1fr; grid-template-rows:minmax(120px,28%) minmax(0,1fr); gap:12px; } .point-categories { border-right:0; border-bottom:1px solid var(--ant-color-border-secondary,#f0f0f0); padding:0 0 12px; } }
</style>
