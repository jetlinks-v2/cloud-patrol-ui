<template>
  <a-tree-select :value="modelValue" :tree-data="options" :placeholder="placeholder || t('Patrol.projects.select')"
    :disabled="disabled" :allow-clear="allowClear" :loading="loading" :status="failed ? 'error' : undefined"
    tree-default-expand-all show-search tree-node-filter-prop="title" style="width:100%"
    @update:value="update" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { TreeSelect as ATreeSelect } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useProjects } from '../composables/useProjects'
import { findOrganization, projectTree } from '../model/projects'
const props = withDefaults(defineProps<{ modelValue?: string; projectsOnly?: boolean; allowClear?: boolean; disabled?: boolean; placeholder?: string }>(), { projectsOnly: true, allowClear: true })
const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>()
const { t } = useI18n()
const { tree, loading, failed } = useProjects()
const options = computed(() => projectTree(tree.value, props.projectsOnly))
function update(value: unknown) {
  if (typeof value !== 'string' || !value) { emit('update:modelValue', undefined); return }
  const node = findOrganization(tree.value, value)
  if (node && !projectTree([node], props.projectsOnly)[0].disabled) emit('update:modelValue', value)
}
</script>
