<template>
  <a-modal :open="true" :title="t('Patrol.pointQr.title')" :width="850" :footer="null" @cancel="emit('close')">
    <a-space direction="vertical" :size="16" style="width:100%">
      <a-alert type="info" show-icon :message="t('Patrol.pointQr.hint')" />
      <a-alert v-if="state.failed" type="error" :message="t('Patrol.loadFailed')" />
      <a-alert v-if="state.tooMany" type="warning" :message="t('Patrol.pointQr.limit')" />
      <a-spin :spinning="state.loading">
        <a-empty v-if="!state.rows.length" />
        <div ref="cards" class="qr-grid">
          <section v-for="point in state.rows" :key="point.id" class="qr-card">
            <a-qrcode :value="pointQrValue(point)" type="svg" :size="200" :bordered="false" include-margin />
            <h3>{{ point.name }}</h3><p>{{ point.code }}</p>
            <a-button @click="emit('download', point, cardFor(point.id!))">{{ t('Patrol.pointQr.download') }}</a-button>
          </section>
        </div>
      </a-spin>
      <a-button :loading="state.downloading" :disabled="!state.rows.length || state.loading" @click="emit('downloadAll', cards)">{{ t('Patrol.pointQr.downloadAll') }}</a-button>
      <a-button type="primary" :loading="state.printing" :disabled="!state.rows.length || state.loading" @click="emit('print', cards)">{{ t('Patrol.pointQr.print') }}</a-button>
    </a-space>
  </a-modal>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Modal as AModal, Alert as AAlert, Space as ASpace, Button as AButton, QRCode as AQrcode, Spin as ASpin, Empty as AEmpty } from 'ant-design-vue'
import type { ConfigEntity } from '../api/types'
import { pointQrValue } from '../model/point-qr'
const props = defineProps<{ state: { rows: ConfigEntity[]; loading: boolean; failed: boolean; tooMany: boolean; downloading: boolean; printing: boolean } }>()
const emit = defineEmits<{ close: []; download: [point: ConfigEntity, card?: HTMLElement]; print: [cards?: HTMLElement]; downloadAll: [cards?: HTMLElement] }>()
const { t } = useI18n(), cards = ref<HTMLElement>()
function cardFor(id: string) {
  const index = props.state.rows.findIndex(row => row.id === id)
  return cards.value?.querySelectorAll<HTMLElement>('.qr-card')[index]
}
</script>
<style scoped>
.qr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;max-height:60vh;overflow:auto}
.qr-card{display:flex;align-items:center;flex-direction:column;text-align:center;overflow-wrap:anywhere;border:1px solid var(--ant-color-border-secondary,#f0f0f0);padding:12px}
.qr-card h3{margin:8px 0}.qr-card p{max-width:100%}
</style>
