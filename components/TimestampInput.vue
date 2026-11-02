<template><a-date-picker v-model:value="date" show-time style="width: 100%" /></template>
<script setup lang="ts">
import { computed } from 'vue'
import type { Dayjs } from 'dayjs'
import { businessTime } from '../model/display'
import { DatePicker as ADatePicker } from 'ant-design-vue'
const props = defineProps<{ modelValue?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()
const date = computed({
  get: () => (props.modelValue == null ? undefined : businessTime(props.modelValue)),
  set: (value: Dayjs | undefined) =>
    emit('update:modelValue', value?.utcOffset(480, true).valueOf()),
})
</script>
