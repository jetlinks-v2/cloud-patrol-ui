<template>
  <a-modal :open="true" :title="t('Patrol.pointQr.title')" :width="420" centered
    :footer="null" class="patrol-point-qr" @cancel="emit('close')">
    <a-alert v-if="state.failed" type="error" show-icon :message="t('Patrol.pointQr.failed')" class="qr-error" />
    <a-spin :spinning="state.loading">
      <div ref="cards">
        <section v-if="point" class="qr-card">
          <a-qrcode :value="pointQrValue(point)" type="svg" :size="256" :bordered="false" include-margin />
          <dl class="qr-details">
            <dt>{{ t('Patrol.projects.label') }}</dt><dd>{{ point.projectName || '—' }}</dd>
            <dt>{{ t('Patrol.point') }}</dt><dd>{{ point.name }}</dd>
          </dl>
        </section>
        <a-empty v-else />
      </div>
    </a-spin>
    <div class="qr-actions">
      <a-button :loading="state.printing" :disabled="busy || !point" @click="emit('print', cards)">
        <template #icon><PrinterOutlined /></template>{{ t('Patrol.pointQr.printSingle') }}
      </a-button>
      <a-button type="primary" :loading="state.downloading" :disabled="busy || !point" @click="download">
        <template #icon><DownloadOutlined /></template>{{ t('Patrol.pointQr.download') }}
      </a-button>
    </div>
  </a-modal>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Modal as AModal, Alert as AAlert, Button as AButton, QRCode as AQrcode, Spin as ASpin, Empty as AEmpty } from 'ant-design-vue'
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons-vue'
import type { ConfigEntity } from '../api/types'
import { pointQrValue } from '../model/point-qr'
const props = defineProps<{ state: { rows: ConfigEntity[]; loading: boolean; failed: boolean; downloading: boolean; printing: boolean } }>()
const emit = defineEmits<{ close: []; download: [point: ConfigEntity, card?: HTMLElement]; print: [cards?: HTMLElement] }>()
const { t } = useI18n(), cards = ref<HTMLElement>()
// 行操作只预览当前点位；批量入口在列表直接下载 ZIP，不进入本弹窗。
const point = computed(() => props.state.rows[0])
const busy = computed(() => props.state.loading || props.state.downloading || props.state.printing)
function download() {
  if (point.value) emit('download', point.value, cards.value?.querySelector<HTMLElement>('.qr-card') ?? undefined)
}
</script>
<style scoped>
.qr-error { margin-bottom:16px; }
.qr-card { display:flex; align-items:center; flex-direction:column; padding:8px 12px 0; }
.qr-card :deep(.ant-qrcode) { flex-shrink:0; max-width:100%; }
.qr-details { display:grid; grid-template-columns:auto minmax(0,1fr); gap:12px; width:100%; margin:20px 0 8px; font-size:14px; line-height:22px; }
.qr-details dt { color:var(--ant-color-text-secondary,#666); }
.qr-details dd { margin:0; font-weight:500; overflow-wrap:anywhere; }
.qr-actions { display:flex; justify-content:center; flex-wrap:wrap; gap:12px; margin-top:24px; padding-top:20px; border-top:1px solid var(--ant-color-border-secondary,#f0f0f0); }
</style>
