<template>
  <a-space direction="vertical" class="standard-item">
    <a-form-item :label="t('Patrol.itemTitle')">
      <a-input :value="item.title" :maxlength="200" @update:value="patch({ title: $event })" />
    </a-form-item>
    <a-form-item :label="t('Patrol.itemType')">
      <a-select :value="itemType(item)" :options="typeOptions" @update:value="setType" />
    </a-form-item>
    <template v-if="itemType(item) === 'choice'">
      <a-form-item :label="t('Patrol.itemOptions')" :extra="t('Patrol.firstOptionHint')">
        <a-select :value="item.options" mode="tags" @update:value="setOptions" />
      </a-form-item>
    </template>
    <a-space v-if="itemType(item) === 'number'" align="start">
      <a-form-item :label="t('Patrol.lowerLimit')">
        <a-input-number :value="item.lowerLimit ?? undefined" string-mode :precision="6" @update:value="patch({ lowerLimit: $event })" />
      </a-form-item>
      <a-form-item :label="t('Patrol.upperLimit')">
        <a-input-number :value="item.upperLimit ?? undefined" string-mode :precision="6" @update:value="patch({ upperLimit: $event })" />
      </a-form-item>
    </a-space>
    <a-form-item :label="t('Patrol.referenceText')" :extra="t('Patrol.referenceHint')">
      <a-textarea :value="item.referenceText" :maxlength="2000" :rows="2" @update:value="patch({ referenceText: $event })" />
    </a-form-item>
    <a-space>
      <a-checkbox :checked="item.required" @update:checked="patch({ required: $event })">{{ t('Patrol.required') }}</a-checkbox>
      <a-checkbox v-if="itemType(item) !== 'image'" :checked="item.photoRequired" @update:checked="patch({ photoRequired: $event })">{{ t('Patrol.photoRequired') }}</a-checkbox>
    </a-space>
    <a-form-item :label="t('Patrol.exampleImage')">
      <PatrolImage :file-id="item.exampleFileId" :readonly="readonly" @update:file-id="patch({ exampleFileId: $event })" @busy-change="emit('busyChange', $event)" />
    </a-form-item>
  </a-space>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Space as ASpace, FormItem as AFormItem, Input as AInput, Select as ASelect,
  InputNumber as AInputNumber, Textarea as ATextarea, Checkbox as ACheckbox } from 'ant-design-vue'
import PatrolImage from './PatrolImage.vue'
import { itemTypes, itemType, changeItemType } from '../model/standards'
import type { CheckItem, ItemType } from '../api/types'
const props = defineProps<{ item: CheckItem; readonly?: boolean }>()
const emit = defineEmits<{ change: [item: CheckItem]; busyChange: [busy: boolean] }>()
const { t } = useI18n()
const typeOptions = computed(() => itemTypes.map(value => ({ value, label: t(`Patrol.itemTypes.${value}`) })))
function patch(value: Partial<CheckItem>) { emit('change', { ...props.item, ...value }) }
function setType(value: unknown) { if (itemTypes.includes(value as ItemType)) emit('change', changeItemType(props.item, value as ItemType)) }
function setOptions(value: unknown) {
  if (!Array.isArray(value)) return
  const options = value.filter((entry): entry is string => typeof entry === 'string')
  patch({ options, qualifiedOptions: options.slice(0, 1) })
}
</script>
<style scoped>
.standard-item { width: 100%; }
.standard-item :deep(.ant-select) { min-width: 220px; width: 100%; }
.standard-item :deep(.ant-form-item) { margin-bottom: 8px; }
</style>
