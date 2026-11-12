<template>
  <a-modal :open="true" :title="t(action === 'link' ? 'Patrol.pointCategories.link' : 'Patrol.pointCategories.cancel')"
    :confirm-loading="saving" :ok-button-props="{ disabled: !categoryId }" :cancel-button-props="{ disabled: saving }" :closable="!saving" :keyboard="!saving" :mask-closable="false"
    @ok="save" @cancel="emit('close')">
    <a-alert :message="t('Patrol.selectedPoints', { count: points.length })" :description="points.map(point => point.name).join('、')" />
    <p>{{ t(action === 'link' ? 'Patrol.pointCategories.linkHelp' : 'Patrol.pointCategories.cancelHelp') }}</p>
    <a-alert v-if="allowedIds && !allowedIds.length" type="warning" :message="t('Patrol.pointCategories.noCommon')" />
    <a-form-item v-else :label="t('Patrol.category')" required>
      <CategorySelect v-model="categoryId" :allowed-ids="allowedIds" :enabled-only="action === 'link'" :disabled="saving" />
    </a-form-item>
    <a-alert v-if="failed" type="error" :message="t('Patrol.saveFailed')" />
  </a-modal>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Alert as AAlert, FormItem as AFormItem, Modal as AModal } from 'ant-design-vue'
import CategorySelect from './CategorySelect.vue'
import { usePointCategories } from '../composables/usePointCategories'
import type { ConfigEntity } from '../api/types'
const props = defineProps<{ points: ConfigEntity[]; action: 'link' | 'cancel'; categoryId?: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const { allowedIds, categoryId, saving, failed, save } = usePointCategories(props.points, props.action, props.categoryId, () => emit('saved'))
</script>
