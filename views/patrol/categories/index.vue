<template>
  <div class="category-workspace">
    <aside>
      <a-space wrap style="margin-bottom:16px">
        <j-permission-button has-permission="patrol/categories:save" type="primary" @click="edit()">{{ t('Patrol.add') }}</j-permission-button>
        <a-button @click="load">{{ t('Patrol.refresh') }}</a-button>
      </a-space>
      <CategoryTree :nodes="tree" :selected-id="selectedId" :loading="loading" :failed="failed" @select="selectedId = $event" />
    </aside>
    <section>
      <template v-if="selected">
        <a-space style="margin-bottom:16px">
          <j-permission-button has-permission="patrol/categories:save" @click="edit(selected)">{{ t('Patrol.edit') }}</j-permission-button>
          <j-permission-button has-permission="patrol/categories:save" @click="editChild">{{ t('Patrol.addChildCategory') }}</j-permission-button>
        </a-space>
        <a-descriptions bordered :column="1" :title="t('Patrol.categoryInfo')">
          <a-descriptions-item :label="t('Patrol.names.categories')">{{ selected.name }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.categoryId')">{{ selected.id }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.parent')">{{ parentName }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.enabled')">{{ t(selected.enabled ? 'Patrol.active' : 'Patrol.inactive') }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.description')">{{ selected.description || '—' }}</a-descriptions-item>
          <a-descriptions-item :label="t('Patrol.modifyTime')">{{ dateTime(selected.modifyTime) }}</a-descriptions-item>
        </a-descriptions>
      </template>
      <a-empty v-else :description="t('Patrol.selectCategory')" />
    </section>
    <ConfigEditor v-if="visible" resource="categories" :value="draft" :saving="saving" :save-failed="saveFailed"
      @close="visible = false" @save="saveCategory" />
  </div>
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button as AButton, Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem, Empty as AEmpty, Space as ASpace } from 'ant-design-vue'
import CategoryTree from '../../../components/CategoryTree.vue'
import { useCategories } from '../../../composables/useCategories'
import { useConfiguration } from '../../../composables/useConfiguration'
import { dateTime } from '../../../model/display'
import type { ConfigEntity } from '../../../api/types'
const ConfigEditor = defineAsyncComponent(() => import('../../../components/ConfigEditor.vue'))
const { t } = useI18n(), { rows, tree, loading, failed, load } = useCategories()
const { visible, draft, saving, saveFailed, edit, save } = useConfiguration('categories')
const selectedId = ref<string>()
const selected = computed(() => rows.value.find(row => row.id === selectedId.value))
const parentName = computed(() => rows.value.find(row => row.id === selected.value?.parentId)?.name || '—')
function editChild() { edit(); draft.value.parentId = selectedId.value }
async function saveCategory(value: ConfigEntity) { await save(value); if (!visible.value) await load() }
onMounted(load)
</script>
<style scoped>
.category-workspace { display: grid; grid-template-columns: minmax(240px, 300px) minmax(0, 1fr); gap: 24px; height: 100%; }
aside { padding-right: 16px; border-right: 1px solid var(--ant-color-border-secondary, #f0f0f0); overflow: auto; }
section { overflow: auto; }
@media (max-width: 760px) { .category-workspace { grid-template-columns: 1fr; } }
</style>
