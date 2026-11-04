<template>
  <a-config-provider :component-disabled="false">
  <a-space direction="vertical">
    <a-space>
      <a-upload v-if="!readonly" accept="image/jpeg,image/png,image/webp" :show-upload-list="false"
        :before-upload="select" :disabled="uploading || loading">
        <a-button :loading="uploading">{{ t(fileId ? 'Patrol.replaceImage' : 'Patrol.uploadImage') }}</a-button>
      </a-upload>
      <a-button v-if="fileId" :loading="loading" :disabled="uploading" @click="preview(fileId)">{{ t('Patrol.previewImage') }}</a-button>
      <a-button v-if="fileId && !readonly" danger :disabled="uploading || loading" @click="remove">{{ t('Patrol.remove') }}</a-button>
    </a-space>
    <a-typography-text v-if="!readonly" type="secondary">{{ t('Patrol.imageHint') }}</a-typography-text>
    <a-alert v-if="failed || invalid" type="error" :message="t(invalid ? 'Patrol.imageHint' : 'Patrol.imageFailed')" />
    <a-image v-if="dataUrl" :src="dataUrl" :width="160" />
  </a-space>
  </a-config-provider>
</template>
<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Space as ASpace, Upload as AUpload, Button as AButton, Alert as AAlert,
  Image as AImage, TypographyText as ATypographyText, ConfigProvider as AConfigProvider } from 'ant-design-vue'
import { usePatrolImage } from '../composables/usePatrolImage'
const props = defineProps<{ fileId?: string | null; readonly?: boolean }>()
const emit = defineEmits<{ 'update:fileId': [id: string | null]; busyChange: [busy: boolean] }>()
const { t } = useI18n(), invalid = ref(false)
const { uploading, loading, failed, dataUrl, upload, preview, reset } = usePatrolImage(id => emit('update:fileId', id))
watch(() => props.fileId, () => { reset(); invalid.value = false })
watch(uploading, busy => emit('busyChange', busy))
onBeforeUnmount(() => emit('busyChange', false))
function select(file: File) {
  invalid.value = !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024
  if (!invalid.value) void upload(file)
  return false
}
function remove() { reset(); emit('update:fileId', null) }
</script>
