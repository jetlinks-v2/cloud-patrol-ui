<script setup lang="ts">
import { Popconfirm, Tooltip } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import type { RemovableConfig } from '../api/config-delete'
import { useConfigDelete } from '../composables/useConfigDelete'
const props = defineProps<{ resource: RemovableConfig; id: string }>()
const emit = defineEmits<{ deleted: [] }>()
const { t } = useI18n()
const { deleting, failed, remove } = useConfigDelete(() => emit('deleted'))
</script>
<template>
  <Popconfirm :title="t('Patrol.configDelete.confirm')" :ok-text="t('Patrol.configDelete.action')" :cancel-text="t('Patrol.cancel')" @confirm="remove(props.resource, props.id)">
    <Tooltip :title="failed ? t('Patrol.configDelete.failed') : undefined">
      <j-permission-button type="link" danger :loading="deleting" :has-permission="`patrol/${resource}:delete`">{{ t('Patrol.configDelete.action') }}</j-permission-button>
    </Tooltip>
  </Popconfirm>
</template>
