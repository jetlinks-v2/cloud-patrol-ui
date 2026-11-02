<template>
  <a-space direction="vertical" style="width: 100%">
    <a-row v-for="(window, index) in modelValue" :key="index" :gutter="8" align="middle">
      <a-col :span="5"
        ><a-time-picker
          :value="time(window.startMinute)"
          format="HH:mm"
          @change="setTime(index, 'startMinute', $event)"
      /></a-col>
      <a-col :span="5"
        ><a-time-picker
          :value="time(window.endMinute)"
          format="HH:mm"
          @change="setTime(index, 'endMinute', $event)"
      /></a-col>
      <a-col :span="5"
        ><a-input-number
          :value="window.intervalMinutes"
          :min="1"
          :max="1440"
          :addon-after="t('Patrol.minutes')"
          @update:value="patch(index, { intervalMinutes: Number($event) })"
      /></a-col>
      <a-col :span="5"
        ><a-input-number
          :value="window.requiredCount"
          :min="1"
          :max="100"
          :addon-after="t('Patrol.times')"
          @update:value="patch(index, { requiredCount: Number($event) })"
      /></a-col>
      <a-col :span="4"
        ><a-button
          danger
          type="link"
          @click="
            emit(
              'update:modelValue',
              modelValue.filter((_, i) => i !== index)
            )
          "
          >{{ t('Patrol.remove') }}</a-button
        ></a-col
      >
    </a-row>
    <a-button :disabled="modelValue.length >= 24" @click="add">{{
      t('Patrol.addWindow')
    }}</a-button>
  </a-space>
</template>
<script setup lang="ts">
import dayjs, { type Dayjs } from 'dayjs'
import { useI18n } from 'vue-i18n'
import {
  Space as ASpace,
  Row as ARow,
  Col as ACol,
  TimePicker as ATimePicker,
  InputNumber as AInputNumber,
  Button as AButton,
} from 'ant-design-vue'
import type { RuleWindow } from '../api/types'
const props = defineProps<{ modelValue: RuleWindow[] }>()
const emit = defineEmits<{ 'update:modelValue': [windows: RuleWindow[]] }>()
const { t } = useI18n()
const time = (minute: number) => dayjs().startOf('day').add(minute, 'minute')
const patch = (index: number, value: Partial<RuleWindow>) =>
  emit(
    'update:modelValue',
    props.modelValue.map((item, i) => (i === index ? { ...item, ...value } : item))
  )
function setTime(index: number, key: 'startMinute' | 'endMinute', value: string | Dayjs | null) {
  if (value && typeof value !== 'string')
    patch(index, {
      [key]:
        key === 'endMinute' && value.hour() === 0 && value.minute() === 0
          ? 1440
          : value.hour() * 60 + value.minute(),
    })
}
const add = () =>
  emit('update:modelValue', [
    ...props.modelValue,
    { startMinute: 480, endMinute: 1080, intervalMinutes: 60, requiredCount: 1 },
  ])
</script>
