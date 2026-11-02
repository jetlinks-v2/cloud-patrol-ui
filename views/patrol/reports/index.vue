<template>
  <a-space direction="vertical" style="width: 100%">
    <a-space
      ><a-range-picker
        v-model:value="range"
        value-format="YYYY-MM-DD"
        :allow-clear="false"
      /><a-button type="primary" :loading="loading" @click="reload">{{
        t('Patrol.refresh')
      }}</a-button></a-space
    >
    <a-alert type="info" :message="t('Patrol.reportHint')" />
    <a-alert v-if="failed" type="error" :message="t('Patrol.loadFailed')" />
    <a-spin :spinning="loading">
      <a-descriptions v-if="result" bordered :column="2">
        <a-descriptions-item :label="t('Patrol.windowCount')">{{
          result.windows
        }}</a-descriptions-item>
        <a-descriptions-item :label="t('Patrol.completeWindows')">{{
          result.completeWindows
        }}</a-descriptions-item>
        <a-descriptions-item :label="t('Patrol.requiredCount')">{{
          result.expected
        }}</a-descriptions-item>
        <a-descriptions-item :label="t('Patrol.completedCount')">{{
          result.completed
        }}</a-descriptions-item>
        <a-descriptions-item :label="t('Patrol.completionRate')">{{
          result.expected ? ((100 * result.completed) / result.expected).toFixed(2) + '%' : '—'
        }}</a-descriptions-item>
        <a-descriptions-item :label="t('Patrol.overdueMissing')">{{
          result.overdueMissing
        }}</a-descriptions-item>
      </a-descriptions>
      <a-empty v-else-if="!loading && !failed" />
    </a-spin>
  </a-space>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  Space as ASpace,
  RangePicker as ARangePicker,
  Button as AButton,
  Alert as AAlert,
  Spin as ASpin,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  Empty as AEmpty,
} from 'ant-design-vue'
import { useReport } from '../../../composables/useReport'
const { t } = useI18n()
const { range, result, loading, failed, reload } = useReport()
</script>
