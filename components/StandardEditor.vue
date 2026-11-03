<template>
  <a-space direction="vertical" style="width: 100%">
    <a-empty v-if="!modelValue.length" :description="t('Patrol.standardItemsRequired')" />
    <a-card v-for="(item, index) in modelValue" :key="item.id" :title="`${index + 1}. ${item.title || t('Patrol.itemTitle')}`" size="small">
      <template v-if="!readonly" #extra>
        <a-space>
          <a-button size="small" :disabled="index === 0" @click="move(index, -1)">{{ t('Patrol.moveUp') }}</a-button>
          <a-button size="small" :disabled="index === modelValue.length - 1" @click="move(index, 1)">{{ t('Patrol.moveDown') }}</a-button>
          <a-button danger type="link" @click="remove(index)">{{ t('Patrol.remove') }}</a-button>
        </a-space>
      </template>
      <StandardItemEditor :item="item" :readonly="readonly" @change="patch(index, $event)" @busy-change="setBusy(item.id, $event)" />
    </a-card>
    <a-button v-if="!readonly" :disabled="modelValue.length >= 100" @click="add">{{ t('Patrol.addItem') }}</a-button>
  </a-space>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Space as ASpace, Card as ACard, Button as AButton, Empty as AEmpty } from 'ant-design-vue'
import StandardItemEditor from './StandardItemEditor.vue'
import type { CheckItem } from '../api/types'
const props = defineProps<{ modelValue: CheckItem[]; readonly?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [items: CheckItem[]]; busyChange: [busy: boolean] }>()
const { t } = useI18n()
const pending = new Set<string>()
function setBusy(id: string, busy: boolean) {
  if (busy) pending.add(id)
  else pending.delete(id)
  emit('busyChange', pending.size > 0)
}
const patch = (index: number, value: CheckItem) => emit('update:modelValue', props.modelValue.map((item, i) => i === index ? value : item))
const remove = (index: number) => emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
function move(index: number, direction: number) {
  const items = [...props.modelValue], target = index + direction
  ;[items[index], items[target]] = [items[target], items[index]]
  emit('update:modelValue', items)
}
const add = () => emit('update:modelValue', [...props.modelValue, {
  id: crypto.randomUUID(), title: '', type: 'choice', required: true,
  options: [t('Patrol.normal'), t('Patrol.abnormal')], qualifiedOptions: [], photoRequired: false,
}])
</script>
