<template>
  <a-space direction="vertical" style="width: 100%">
    <a-card v-for="(item, index) in modelValue" :key="item.id" size="small">
      <a-space direction="vertical" style="width: 100%">
        <a-input
          :value="item.title"
          :placeholder="t('Patrol.itemTitle')"
          :maxlength="128"
          @update:value="patch(index, { title: $event })"
        />
        <a-select
          :value="item.options"
          mode="tags"
          style="width: 100%"
          :placeholder="t('Patrol.itemOptions')"
          @update:value="setOptions(index, $event)"
        />
        <a-space
          ><a-checkbox
            :checked="item.required"
            @update:checked="patch(index, { required: $event })"
            >{{ t('Patrol.required') }}</a-checkbox
          >
          <a-button
            danger
            type="link"
            @click="
              emit(
                'update:modelValue',
                modelValue.filter((_, i) => i !== index)
              )
            "
            >{{ t('Patrol.remove') }}</a-button
          ></a-space
        >
      </a-space>
    </a-card>
    <a-button :disabled="modelValue.length >= 100" @click="add">{{ t('Patrol.addItem') }}</a-button>
  </a-space>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  Space as ASpace,
  Card as ACard,
  Input as AInput,
  Select as ASelect,
  Checkbox as ACheckbox,
  Button as AButton,
} from 'ant-design-vue'
import type { CheckItem } from '../api/types'
const props = defineProps<{ modelValue: CheckItem[] }>()
const emit = defineEmits<{ 'update:modelValue': [items: CheckItem[]] }>()
const { t } = useI18n()
const patch = (index: number, value: Partial<CheckItem>) =>
  emit(
    'update:modelValue',
    props.modelValue.map((item, i) => (i === index ? { ...item, ...value } : item))
  )
const setOptions = (index: number, value: unknown) => {
  if (Array.isArray(value))
    patch(index, { options: value.filter((item): item is string => typeof item === 'string') })
}
const add = () =>
  emit('update:modelValue', [
    ...props.modelValue,
    {
      id: crypto.randomUUID(),
      title: '',
      required: true,
      options: [t('Patrol.normal'), t('Patrol.abnormal')],
    },
  ])
</script>
