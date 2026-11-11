<template>
  <a-space direction="vertical" style="width: 100%">
    <a-card v-for="item in record.standardSnapshot" :key="item.id" :title="item.title" size="small">
      <a-descriptions :column="1" size="small">
        <a-descriptions-item :label="t('Patrol.itemType')">{{ t(`Patrol.itemTypes.${itemType(item)}`) }}</a-descriptions-item>
        <a-descriptions-item v-if="item.lowerLimit != null || item.upperLimit != null" :label="t('Patrol.referenceRange')">
          {{ item.lowerLimit ?? '—' }} ~ {{ item.upperLimit ?? '—' }}
        </a-descriptions-item>
        <a-descriptions-item v-if="item.referenceText" :label="t('Patrol.referenceText')">{{ item.referenceText }}</a-descriptions-item>
        <a-descriptions-item v-if="itemType(item) !== 'image'" :label="t('Patrol.answer')">
          <span :class="{ 'answer-abnormal': answerIsAbnormal(item, answer(item.id)) }">{{ answer(item.id)?.value || '—' }}</span>
        </a-descriptions-item>
        <a-descriptions-item v-if="answer(item.id)?.attachmentId" :label="t('Patrol.submittedImage')">
          <PatrolImage :file-id="answer(item.id)?.attachmentId" readonly />
        </a-descriptions-item>
        <a-descriptions-item v-if="item.exampleFileId" :label="t('Patrol.exampleImage')">
          <PatrolImage :file-id="item.exampleFileId" readonly />
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </a-space>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Space as ASpace, Card as ACard, Descriptions as ADescriptions, DescriptionsItem as ADescriptionsItem } from 'ant-design-vue'
import { itemType, answerIsAbnormal } from '../model/standards'
import type { Execution } from '../api/types'
import PatrolImage from './PatrolImage.vue'
const props = defineProps<{ record: Execution }>()
const { t } = useI18n()
const answer = (id: string) => props.record.answers.find(item => item.itemId === id)
</script>
<style scoped>
.answer-abnormal { color: #c34343; }
</style>
