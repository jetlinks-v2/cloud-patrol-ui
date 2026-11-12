<template>
  <div class="category-tree">
    <a-input-search :value="keyword" :placeholder="t('Patrol.categorySearch')" allow-clear @update:value="keyword = $event" />
    <a-spin :spinning="loading">
      <a-alert v-if="failed" type="error" :message="t('Patrol.loadFailed')" />
      <a-tree v-else-if="filtered.length" :tree-data="filtered" :selected-keys="selectedId ? [selectedId] : []"
        :expanded-keys="expanded" :auto-expand-parent="autoExpand" block-node
        @expand="expand" @select="select">
        <template #title="node">
          <span class="category-node">
            <span class="category-node-title">{{ node.title }}</span>
            <span v-if="$slots.actions" class="category-node-actions" @click.stop @dblclick.stop @mousedown.stop>
              <slot name="actions" :id="node.key" />
            </span>
          </span>
        </template>
      </a-tree>
      <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" />
    </a-spin>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert as AAlert, Empty, Empty as AEmpty, InputSearch as AInputSearch, Spin as ASpin, Tree as ATree } from 'ant-design-vue'
import type { Key } from 'ant-design-vue/es/_util/type'
import { filterCategoryTree, type CategoryNode } from '../model/categories'
const props = defineProps<{ nodes: CategoryNode[]; selectedId?: string; loading?: boolean; failed?: boolean }>()
const emit = defineEmits<{ select: [id?: string] }>()
const { t } = useI18n(), keyword = ref(''), expanded = ref<Key[]>([]), autoExpand = ref(true)
const filtered = computed(() => filterCategoryTree(props.nodes, keyword.value))
const allKeys = (nodes: CategoryNode[]): string[] => nodes.flatMap(node => [node.key, ...allKeys(node.children)])
watch([() => props.nodes, keyword], () => { expanded.value = allKeys(filtered.value); autoExpand.value = true }, { immediate: true })
function expand(keys: Key[]) { expanded.value = keys; autoExpand.value = false }
function select(keys: Key[]) { emit('select', keys.length ? String(keys[0]) : undefined) }
</script>
<style scoped>
.category-tree { display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.category-tree :deep(.ant-tree) { margin-top: 12px; }
.category-tree :deep(.ant-tree-title) { display:block; }
.category-node { display:flex; align-items:center; gap:4px; min-width:0; }
.category-node-title { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.category-node-actions { display:flex; align-items:center; gap:8px; opacity:0; pointer-events:none; }
.category-tree :deep(.ant-tree-treenode:hover) .category-node-actions,
.category-tree :deep(.ant-tree-treenode:focus-within) .category-node-actions { opacity:1; pointer-events:auto; }
@media (hover:none) { .category-node-actions { opacity:1; pointer-events:auto; } }
</style>
