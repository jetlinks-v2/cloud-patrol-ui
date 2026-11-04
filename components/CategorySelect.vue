<template>
  <a-tree-select :value="modelValue || undefined" :tree-data="nodes" :loading="loading" :status="failed ? 'error' : undefined"
    show-search allow-clear tree-default-expand-all tree-node-filter-prop="title" :placeholder="t('Patrol.select')"
    style="width:100%" @focus="load" @update:value="update" />
</template>
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { TreeSelect as ATreeSelect } from 'ant-design-vue'
import { useCategories } from '../composables/useCategories'
import { categoryTree, type CategoryNode } from '../model/categories'
const props = defineProps<{ modelValue?: string; excludedId?: string; allowedIds?: string[]; enabledOnly?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value?: string] }>()
const { t } = useI18n(), { rows, loading, failed, load } = useCategories()
const nodes = computed(() => {
  const disabled = new Set(rows.value.filter(row => props.enabledOnly && !row.enabled).map(row => row.id))
  const restrict = (nodes: CategoryNode[]): CategoryNode[] => nodes.map(node => ({ ...node,
    disabled: node.disabled || disabled.has(node.value) || (props.allowedIds !== undefined && !props.allowedIds.includes(node.value)),
    children: restrict(node.children),
  }))
  return restrict(categoryTree(rows.value, props.excludedId))
})
function update(value: unknown) { emit('update:modelValue', typeof value === 'string' ? value : undefined) }
onMounted(load)
</script>
