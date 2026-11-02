<template>
  <a-space direction="vertical" style="width: 100%">
    <a-alert type="info" :message="t('Patrol.ruleHint')" />
    <a-tabs v-model:active-key="weekday">
      <a-tab-pane v-for="day in 7" :key="String(day)" :tab="t(`Patrol.week${day}`)">
        <WindowEditor
          :model-value="modelValue.weekly[day] || []"
          @update:model-value="weekly(day, $event)"
        />
      </a-tab-pane>
    </a-tabs>
    <a-divider>{{ t('Patrol.dateOverride') }}</a-divider>
    <a-space
      ><a-date-picker v-model:value="overrideDate" value-format="YYYY-MM-DD" /><a-button
        :disabled="!overrideDate"
        @click="addOverride"
        >{{ t('Patrol.addOverride') }}</a-button
      ></a-space
    >
    <a-collapse>
      <a-collapse-panel v-for="(windows, date) in modelValue.dates" :key="date" :header="date">
        <WindowEditor :model-value="windows" @update:model-value="override(String(date), $event)" />
        <a-button danger type="link" @click="removeOverride(String(date))">{{
          t('Patrol.removeOverride')
        }}</a-button>
      </a-collapse-panel>
    </a-collapse>
    <a-space
      >{{ t('Patrol.cooldown')
      }}<a-input-number
        :value="modelValue.cooldownMinutes"
        :min="0"
        :max="1440"
        :addon-after="t('Patrol.minutes')"
        @update:value="
          emit('update:modelValue', { ...modelValue, cooldownMinutes: Number($event) })
        "
    /></a-space>
  </a-space>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Space as ASpace,
  Alert as AAlert,
  Tabs as ATabs,
  TabPane as ATabPane,
  Divider as ADivider,
  DatePicker as ADatePicker,
  Button as AButton,
  Collapse as ACollapse,
  CollapsePanel as ACollapsePanel,
  InputNumber as AInputNumber,
} from 'ant-design-vue'
import WindowEditor from './WindowEditor.vue'
import type { PatrolRule, RuleWindow } from '../api/types'
const props = defineProps<{ modelValue: PatrolRule }>()
const emit = defineEmits<{ 'update:modelValue': [rule: PatrolRule] }>()
const { t } = useI18n(),
  weekday = ref('1'),
  overrideDate = ref('')
const weekly = (day: number, windows: RuleWindow[]) =>
  emit('update:modelValue', {
    ...props.modelValue,
    weekly: { ...props.modelValue.weekly, [day]: windows },
  })
const override = (date: string, windows: RuleWindow[]) =>
  emit('update:modelValue', {
    ...props.modelValue,
    dates: { ...props.modelValue.dates, [date]: windows },
  })
const addOverride = () => {
  if (overrideDate.value && !(overrideDate.value in props.modelValue.dates))
    override(overrideDate.value, [])
}
function removeOverride(date: string) {
  const dates = { ...props.modelValue.dates }
  delete dates[date]
  emit('update:modelValue', { ...props.modelValue, dates })
}
</script>
