<template>
  <a-drawer
    :open="true"
    :title="t(readonly ? 'Patrol.details' : model.id ? 'Patrol.edit' : 'Patrol.add')"
    :width="800"
    @close="emit('close')"
  >
    <a-alert v-if="saveFailed" type="error" show-icon :message="t('Patrol.saveFailed')" style="margin-bottom: 16px" />
    <a-config-provider :component-disabled="readonly || imageBusy">
      <a-form ref="form" :model="model" layout="vertical" :disabled="readonly || imageBusy">
        <a-form-item
          name="name"
          :label="t(`Patrol.names.${resource}`)"
          :rules="[{ required: true, message: t('Patrol.requiredField') }]"
          ><a-input v-model:value="model.name" :maxlength="128"
        /></a-form-item>
        <a-form-item v-if="resource === 'categories'" name="parentId" :label="t('Patrol.parent')"
          ><RemoteSelect resource="categories" v-model="model.parentId"
        /></a-form-item>
        <template v-if="resource === 'points'">
          <a-form-item name="code" :label="t('Patrol.code')" :rules="required"
            ><a-input v-model:value="model.code" :maxlength="64"
          /></a-form-item>
          <a-form-item name="categoryId" :label="t('Patrol.category')" :rules="required"
            ><RemoteSelect resource="categories" v-model="model.categoryId"
          /></a-form-item>
          <a-form-item :label="t('Patrol.tags')"><RemoteSelect resource="tags" v-model="model.tagIds" multiple /></a-form-item>
          <a-form-item :label="t('Patrol.location')"
            ><a-input v-model:value="model.location" :maxlength="255"
          /></a-form-item>
          <a-form-item :label="t('Patrol.nfc')"
            ><a-input v-model:value="model.nfcCode" :maxlength="128"
          /></a-form-item>
        </template>
        <a-form-item v-if="resource === 'levels'" :label="t('Patrol.rule')"><RuleSummary v-if="readonly" :rule="model.rule" /><RuleEditor v-else-if="model.rule" v-model="model.rule" /></a-form-item>
        <template v-if="resource === 'warnings'">
          <a-form-item :label="t('Patrol.triggerParent')" name="triggerParentCode" :rules="required">
            <a-select v-model:value="model.triggerParentCode" :options="warningParents" @change="resetTrigger" />
          </a-form-item>
          <a-form-item :label="t('Patrol.triggerCondition')" name="triggerChildCode" :rules="required">
            <a-select v-model:value="model.triggerChildCode" :options="warningChildren" />
          </a-form-item>
          <a-form-item :label="t('Patrol.color')" name="colorHex" :rules="[{ required: true, pattern: /^#[0-9a-fA-F]{6}$/, message: t('Patrol.colorRequired') }]">
            <a-input v-model:value="model.colorHex" type="color" />
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
          <a-form-item v-else :label="t('Patrol.rule')"
            ><RuleEditor v-if="model.rule" v-model="model.rule"
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
import { reactive, ref, computed } from 'vue'
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
const model = reactive(draftOf(props.resource, props.value)),
  form = ref<FormInstance>()
const imageBusy = ref(false)
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
