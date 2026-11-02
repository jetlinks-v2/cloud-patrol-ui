<template>
  <a-select
    :value="modelValue"
    :mode="multiple ? 'multiple' : undefined"
    :options="options"
    :loading="loading"
    :status="failed ? 'error' : undefined"
    show-search
    allow-clear
    :filter-option="false"
    :placeholder="t('Patrol.select')"
    style="width: 100%"
    @search="search"
    @focus="load()"
    @update:value="updateValue($event)"
  />
</template>
<script setup lang="ts" generic="T extends string | string[]">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Select as ASelect } from 'ant-design-vue'
import { useRemoteOptions } from '../composables/useRemoteOptions'
import type { Resource } from '../api/types'
const props = defineProps<{ resource: Resource | 'persons'; modelValue?: T; multiple?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: T | undefined] }>()
// options 的值只由本组件产生的 string ID 构成。
const updateValue = (value: unknown) => emit('update:modelValue', value as T | undefined)
const { t } = useI18n()
const { options, loading, failed, search, load } = useRemoteOptions(
  props.resource,
  toRef(props, 'modelValue')
)
</script>
