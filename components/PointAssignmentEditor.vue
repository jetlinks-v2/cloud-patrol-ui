<template>
  <a-drawer :open="true" :width="720" :title="t(mode === 'posts' ? 'Patrol.assignPosts' : 'Patrol.configureRules')" @close="emit('close')">
    <a-alert :message="t('Patrol.selectedPoints', { count: points.length })" :description="points.map(point => point.name).join('、')" style="margin-bottom:16px" />
    <a-spin :spinning="loading">
      <a-result v-if="failed" status="error" :title="t('Patrol.loadFailed')"><template #extra><a-button @click="load">{{ t('Patrol.retry') }}</a-button></template></a-result>
      <a-alert v-else-if="!loading && mode === 'rules' && !samePosts" type="warning" show-icon :message="t('Patrol.assignmentPostsDiffer')" />
      <a-form v-else ref="form" :model="{ postIds, rules }" layout="vertical" :disabled="loading || saving">
        <template v-if="mode === 'posts'">
          <a-alert type="info" show-icon :message="t('Patrol.assignmentPostsHelp')" style="margin-bottom:16px" />
          <a-form-item name="postIds" :label="t('Patrol.post')" :rules="required"><RemoteSelect resource="posts" v-model="postIds" multiple /></a-form-item>
        </template>
        <a-card v-for="(rule, index) in mode === 'rules' ? rules : []" :key="rule.postId" style="margin-bottom:16px">
          <template #title><ConfigReference resource="posts" :id="rule.postId" /></template>
          <a-form-item :name="['rules', index, 'levelId']" :label="t('Patrol.level')" :rules="required"><RemoteSelect resource="levels" v-model="rule.levelId" /></a-form-item>
          <a-form-item :name="['rules', index, 'standardId']" :label="t('Patrol.standard')" :rules="required"><RemoteSelect resource="standards" v-model="rule.standardId" /></a-form-item>
        </a-card>
      </a-form>
    </a-spin>
    <a-alert v-if="saveFailed" type="error" show-icon :message="t('Patrol.saveFailed')" />
    <template #footer><a-space><a-button @click="emit('close')">{{ t('Patrol.cancel') }}</a-button><a-button type="primary" :loading="saving" :disabled="loading || failed || (mode === 'rules' && !samePosts)" @click="submit">{{ t('Patrol.save') }}</a-button></a-space></template>
  </a-drawer>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert as AAlert, Button as AButton, Card as ACard, Drawer as ADrawer, Form as AForm, FormItem as AFormItem, Result as AResult, Space as ASpace, Spin as ASpin, type FormInstance } from 'ant-design-vue'
import RemoteSelect from './RemoteSelect.vue'
import ConfigReference from './ConfigReference.vue'
import { usePointAssignments, type AssignmentMode } from '../composables/usePointAssignments'
import type { ConfigEntity } from '../api/types'
const props = defineProps<{ points: ConfigEntity[]; mode: AssignmentMode }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const form = ref<FormInstance>()
const required = [{ required: true, message: t('Patrol.requiredField') }]
const { loading, failed, saving, saveFailed, samePosts, postIds, rules, load, save } = usePointAssignments(props.points, props.mode, () => emit('saved'))
async function submit() {
  if (!form.value) return
  try { await form.value.validate() } catch { return }
  await save()
}
</script>
