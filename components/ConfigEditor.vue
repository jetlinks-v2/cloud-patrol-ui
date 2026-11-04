<template>
  <a-drawer
    :open="true"
    :title="t(readonly ? 'Patrol.details' : model.id ? 'Patrol.edit' : 'Patrol.add')"
    :width="resource === 'levels' || resource === 'plans' ? 'min(1440px, 96vw)' : 800"
    @close="emit('close')"
  >
    <a-alert v-if="saveFailed" type="error" show-icon :message="t('Patrol.saveFailed')" style="margin-bottom: 16px" />
    <a-config-provider :component-disabled="readonly || imageBusy">
      <a-form ref="form" :model="model" layout="vertical" :disabled="readonly || imageBusy">
        <a-form-item :label="t('Patrol.projects.label')">
          <ProjectTreeSelect v-model="model.projectId" disabled />
        </a-form-item>
        <a-form-item v-if="!model.projectId && !['points', 'posts', 'plans', 'rosters'].includes(resource)" name="ownerOrganizationId" :label="t('Patrol.projects.owner')" :rules="required">
          <ProjectTreeSelect v-model="model.ownerOrganizationId" :projects-only="false" :disabled="!!model.id" />
        </a-form-item>
        <a-form-item
          name="name"
          :label="t(`Patrol.names.${resource}`)"
          :rules="[{ required: true, message: t('Patrol.requiredField') }, { max: nameMaxLength }]"
          ><a-input v-model:value="model.name" :maxlength="nameMaxLength"
        /></a-form-item>
        <a-form-item v-if="resource === 'categories' && model.id" :label="t('Patrol.categoryId')"><a-input :value="model.id" disabled /></a-form-item>
        <a-form-item v-if="resource === 'categories'" name="parentId" :label="t('Patrol.parent')"
          ><CategorySelect v-model="model.parentId" :excluded-id="model.id"
        /></a-form-item>
        <template v-if="resource === 'points'">
          <a-form-item name="code" :label="t('Patrol.code')" :rules="required"
            ><a-input v-model:value="model.code" :maxlength="64"
          /></a-form-item>
          <a-form-item v-if="!model.id" name="categoryId" :label="t('Patrol.category')" :rules="required"
            ><CategorySelect v-model="model.categoryId" enabled-only
          /></a-form-item>
          <a-form-item v-else :label="t('Patrol.category')"><ConfigReference resource="categories" :id="model.categoryIds || model.categoryId" /></a-form-item>
          <a-form-item :label="t('Patrol.tags')"><RemoteSelect resource="tags" v-model="model.tagIds" multiple /></a-form-item>
          <a-form-item :label="t('Patrol.location')"
            ><a-input v-model:value="model.location" :maxlength="255"
          /></a-form-item>
          <a-form-item :label="t('Patrol.nfc')"
            ><a-input v-model:value="model.nfcCode" :maxlength="128"
          /></a-form-item>
        </template>
        <a-form-item v-if="resource === 'levels'" name="rule" :label="t('Patrol.rule')" :rules="ruleRules"><RuleSummary v-if="readonly" :rule="model.rule" /><RuleEditor v-else-if="model.rule" ref="ruleEditor" v-model="model.rule" /></a-form-item>
        <template v-if="resource === 'warnings'">
          <a-form-item :label="t('Patrol.triggerParent')" name="triggerParentCode" :rules="required">
            <a-select v-model:value="model.triggerParentCode" :options="warningParents" @change="resetTrigger" />
          </a-form-item>
          <a-form-item :label="t('Patrol.triggerCondition')" name="triggerChildCode" :rules="required">
            <a-select v-model:value="model.triggerChildCode" :options="warningChildren" />
          </a-form-item>
          <a-form-item :label="t('Patrol.color')" name="colorHex" :rules="[{ required: true, pattern: /^#[0-9a-fA-F]{6}$/, message: t('Patrol.colorRequired') }]">
            <a-input v-model:value="model.colorHex" type="color" class="warning-color-picker" :aria-label="t('Patrol.color')" />
          </a-form-item>
        </template>
        <a-form-item v-if="resource === 'standards'" name="items" :label="t('Patrol.items')" :rules="standardRules"
          ><StandardEditor
            :model-value="model.items || []"
            :readonly="readonly"
            @busy-change="imageBusy = $event"
            @update:model-value="model.items = $event"
        /></a-form-item>
        <a-form-item v-if="resource === 'posts'" :label="t('Patrol.members')"
          ><RemoteSelect resource="persons" v-model="model.userIds" multiple
        /></a-form-item>
        <template v-if="resource === 'rosters'">
          <a-form-item :label="t('Patrol.shiftName')"><a-input v-model:value="model.shiftName" :maxlength="128" /></a-form-item>
          <a-form-item :label="t('Patrol.rest')"><a-switch v-model:checked="model.rest" /></a-form-item>
          <a-form-item name="postId" :label="t('Patrol.post')" :rules="required"
            ><RemoteSelect resource="posts" v-model="model.postId"
          /></a-form-item>
          <a-form-item name="userId" :label="t('Patrol.person')" :rules="required"
            ><RemoteSelect resource="persons" v-model="model.userId"
          /></a-form-item>
          <a-form-item name="businessDate" :label="t('Patrol.businessDate')" :rules="required"
            ><a-date-picker v-model:value="model.businessDate" value-format="YYYY-MM-DD"
          /></a-form-item>
          <a-form-item name="startTime" :label="t('Patrol.startTime')" :rules="required"
            ><TimestampInput v-model="model.startTime"
          /></a-form-item>
          <a-form-item name="endTime" :label="t('Patrol.endTime')" :rules="required"
            ><TimestampInput v-model="model.endTime"
          /></a-form-item>
        </template>
        <template v-if="resource === 'plans'">
          <a-form-item v-if="!point" name="pointId" :label="t('Patrol.point')" :rules="required"
            ><RemoteSelect resource="points" v-model="model.pointId"
          /></a-form-item>
          <a-form-item name="postId" :label="t('Patrol.post')" :rules="required"
            ><RemoteSelect resource="posts" v-model="model.postId"
          /></a-form-item>
          <a-form-item name="standardId" :label="t('Patrol.standard')" :rules="required"
            ><RemoteSelect resource="standards" v-model="model.standardId"
          /></a-form-item>
          <a-form-item name="levelId" :label="t('Patrol.level')" :rules="point ? required : []"><RemoteSelect resource="levels" v-model="model.levelId" /></a-form-item>
          <a-form-item name="effectiveFrom" :label="t('Patrol.effectiveFrom')" :rules="required"
            ><a-date-picker v-model:value="model.effectiveFrom" value-format="YYYY-MM-DD"
          /></a-form-item>
          <a-form-item name="effectiveTo" :label="t('Patrol.effectiveTo')" :rules="required"
            ><a-date-picker v-model:value="model.effectiveTo" value-format="YYYY-MM-DD"
          /></a-form-item>
          <a-form-item name="rosterPolicy" :label="t('Patrol.rosterPolicy')"
            ><a-radio-group v-model:value="model.rosterPolicy"
              ><a-radio value="optional">{{ t('Patrol.rosterOptional') }}</a-radio
              ><a-radio value="required">{{ t('Patrol.rosterRequired') }}</a-radio></a-radio-group
            ></a-form-item
          >
          <a-alert v-if="model.levelId" type="info" :message="t('Patrol.levelRuleHint')" />
          <a-form-item v-else name="rule" :label="t('Patrol.rule')" :rules="ruleRules"
            ><RuleEditor v-if="model.rule" ref="ruleEditor" v-model="model.rule"
          /></a-form-item>
        </template>
        <a-form-item :label="t('Patrol.enabled')"
          ><a-switch v-model:checked="model.enabled"
        /></a-form-item>
        <a-form-item :label="t('Patrol.description')"
          ><a-textarea v-model:value="model.description" :maxlength="512" :rows="3"
        /></a-form-item>
      </a-form>
    </a-config-provider>
    <template #footer
      ><a-space
        ><a-button @click="emit('close')">{{ t('Patrol.cancel') }}</a-button
        ><a-button v-if="!readonly" type="primary" :loading="saving" :disabled="imageBusy" @click="save">{{
          t('Patrol.save')
        }}</a-button></a-space
      ></template
    >
  </a-drawer>
</template>
<script setup lang="ts">
import ProjectTreeSelect from './ProjectTreeSelect.vue'
import ConfigReference from './ConfigReference.vue'
import { reactive, ref, computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ConfigProvider as AConfigProvider,
  Drawer as ADrawer,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Select as ASelect,
  Alert as AAlert,
  Textarea as ATextarea,
  DatePicker as ADatePicker,
  RadioGroup as ARadioGroup,
  Radio as ARadio,
  Switch as ASwitch,
  Space as ASpace,
  Button as AButton,
  type FormInstance,
} from 'ant-design-vue'
import RemoteSelect from './RemoteSelect.vue'
import CategorySelect from './CategorySelect.vue'
import StandardEditor from './StandardEditor.vue'
import RuleEditor from './RuleEditor.vue'
import RuleSummary from './RuleSummary.vue'
import TimestampInput from './TimestampInput.vue'
import { draftOf } from '../model/resources'
import { standardError } from '../model/standards'
import type { ConfigEntity, Resource } from '../api/types'
const props = defineProps<{
  resource: Resource
  value: ConfigEntity
  saving: boolean
  saveFailed?: boolean
  readonly?: boolean
  point?: ConfigEntity
}>()
const emit = defineEmits<{ close: []; save: [value: ConfigEntity] }>()
const { t } = useI18n()
// 标准、预警沿用老巡更的 30 字限制；其他配置仍使用各自既有长度。
const nameMaxLength = computed(() => ['standards', 'warnings'].includes(props.resource) ? 30 : 128)
const model = reactive(draftOf(props.resource, props.value)),
  form = ref<FormInstance>()
provide('patrolAttachmentOwner', computed(() => model.ownerOrganizationId))
const imageBusy = ref(false)
const ruleEditor = ref<InstanceType<typeof RuleEditor>>()
const ruleRules = [{ validator: async () => {
  if (ruleEditor.value) model.rule = ruleEditor.value.validate()
} }]
// 原预警配置仅维护三个既有分类/条件，不新增预警行为。
const triggerPairs = { route: 'route_missed_point', person: 'person_absent', time: 'time_interval' } as const
const warningParents = computed(() => Object.keys(triggerPairs).map(value => ({ value, label: t(`Patrol.triggers.${value}`) })))
const warningChildren = computed(() => {
  const value = triggerPairs[model.triggerParentCode as keyof typeof triggerPairs]
  return value ? [{ value, label: t(`Patrol.triggers.${value}`) }] : []
})
function resetTrigger() { model.triggerChildCode = warningChildren.value[0]?.value }
const required = computed(() => [{ required: true, message: t('Patrol.requiredField') }])
const standardRules = [{ validator: async () => {
  const error = standardError(model.items ?? [])
  if (error) throw new Error(t(error))
} }]
async function save() {
  if (imageBusy.value) return
  try {
    await form.value?.validate()
  } catch {
    return
  }
  emit('save', draftOf(props.resource, model))
}
</script>

<style scoped>
.warning-color-picker {
  width: 32px;
  height: 32px;
  padding: 3px;
  cursor: pointer;
}
.warning-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}
.warning-color-picker::-webkit-color-swatch {
  border: 0;
  border-radius: 2px;
}
.warning-color-picker::-moz-color-swatch {
  border: 0;
  border-radius: 2px;
}
.warning-color-picker:disabled {
  cursor: not-allowed;
}
</style>
