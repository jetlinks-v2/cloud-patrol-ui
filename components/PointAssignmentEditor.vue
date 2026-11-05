<template>
  <a-drawer :open="true" :width="720" :title="t('Patrol.patrolConfiguration')" @close="emit('close')">
    <a-alert :message="t('Patrol.selectedPoints', { count: points.length })" :description="points.map(point => point.name).join('、')" style="margin-bottom:16px" />
    <a-alert v-if="!categoryIds.length" type="warning" :message="t('Patrol.pointCategories.noCommon')" />
    <a-form-item v-else :label="t('Patrol.category')" required><CategorySelect v-model="categoryId" :allowed-ids="categoryIds" :disabled="saving" /></a-form-item>
    <a-spin :spinning="loading">
      <a-alert v-if="!categoryId && categoryIds.length" type="info" :message="t('Patrol.pointCategories.choose')" />
      <a-result v-else-if="failed" status="error" :title="t('Patrol.loadFailed')"><template #extra><a-button @click="load">{{ t('Patrol.retry') }}</a-button></template></a-result>
      <a-form v-else-if="categoryId" ref="form" :model="{ roleIds, rules }" layout="vertical" :disabled="loading || saving">
        <a-alert type="info" show-icon :message="t('Patrol.assignmentPostsHelp')" style="margin-bottom:16px" />
        <a-form-item name="roleIds" :label="t('Patrol.post')"><RemoteSelect resource="roles" :model-value="roleIds.filter(Boolean)" multiple @update:model-value="selectRoles" /></a-form-item>
        <a-form-item><a-checkbox :checked="roleIds.includes('')" @change="selectAllStaff($event.target.checked)">{{ t('Patrol.allStaffPatrol') }}</a-checkbox></a-form-item>
        <a-alert v-if="points.length > 1" type="warning" show-icon :message="t('Patrol.assignmentBatchHelp')" style="margin-bottom:16px" />
        <a-card v-for="(rule, index) in rules" :key="rule.roleId" style="margin-bottom:16px">
          <template #title><ConfigReference v-if="rule.roleId" resource="roles" :id="rule.roleId" /><span v-else>{{ t('Patrol.allStaffPatrol') }}</span></template>
          <a-form-item :name="['rules', index, 'levelId']" :label="t('Patrol.level')" :rules="pairedRule(rule.standardId)"><RemoteSelect resource="levels" v-model="rule.levelId" /></a-form-item>
          <a-form-item :name="['rules', index, 'standardId']" :label="t('Patrol.standard')" :rules="pairedRule(rule.levelId)"><RemoteSelect resource="standards" v-model="rule.standardId" /></a-form-item>
        </a-card>
      </a-form>
    </a-spin>
    <a-alert v-if="saveFailed" type="error" show-icon :message="t('Patrol.saveFailed')" />
    <template #footer>
      <a-space>
        <a-button :disabled="saving" @click="emit('close')">{{ t('Patrol.cancel') }}</a-button>
        <a-button type="primary" :loading="saving" :disabled="!categoryId || loading || failed" @click="submit">{{ t('Patrol.save') }}</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert as AAlert, Button as AButton, Card as ACard, Checkbox as ACheckbox, Drawer as ADrawer, Form as AForm, FormItem as AFormItem, Result as AResult, Space as ASpace, Spin as ASpin, type FormInstance } from 'ant-design-vue'
import RemoteSelect from './RemoteSelect.vue'
import ConfigReference from './ConfigReference.vue'
import CategorySelect from './CategorySelect.vue'
import { usePointAssignments } from '../composables/usePointAssignments'
import type { ConfigEntity } from '../api/types'
const props = defineProps<{ points: ConfigEntity[]; categoryId?: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const form = ref<FormInstance>()
const pairedRule = (other?: string) => [{ validator: (_rule: unknown, value?: string) => !other || value
  ? Promise.resolve() : Promise.reject(t('Patrol.assignmentRulePair')) }]
const { loading, failed, saving, saveFailed, roleIds, rules, updateRoles, categoryIds, categoryId, load, save } = usePointAssignments(props.points, () => emit('saved'), props.categoryId)
function selectRoles(ids?: string[]) { updateRoles([...(ids ?? []), ...(roleIds.value.includes('') ? [''] : [])]) }
function selectAllStaff(checked: boolean) { updateRoles([...roleIds.value.filter(Boolean), ...(checked ? [''] : [])]) }
async function submit() {
  if (!form.value) return
  try { await form.value.validate() } catch { return }
  if (await save()) emit('close')
}
</script>
