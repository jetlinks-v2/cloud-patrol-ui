<script setup lang="ts">
import { toRef } from 'vue'
import { Alert, Button, Empty, Modal, Pagination, Spin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import type { AuditedConfig } from '../api/config-history'
import { dateTime } from '../model/display'
import { useConfigHistory } from '../composables/useConfigHistory'
import RuleSummary from './RuleSummary.vue'
const props = defineProps<{ resource: AuditedConfig; id: string }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const { rows, loading, failed, total, page, load } = useConfigHistory(toRef(props, 'resource'), toRef(props, 'id'))
</script>
<template>
  <Modal :open="true" :title="t('Patrol.configHistory.title')" :footer="null" :width="1000" @cancel="emit('close')">
    <Alert type="info" show-icon :message="t('Patrol.configHistory.sinceEnabled')" style="margin-bottom: 16px" />
    <Alert v-if="failed" type="error" :message="t('Patrol.loadFailed')"><template #action><Button @click="load(page)">{{ t('Patrol.configHistory.retry') }}</Button></template></Alert>
    <Spin :spinning="loading">
      <Empty v-if="!loading && !failed && !rows.length" :description="t('Patrol.configHistory.empty')" />
      <section v-for="row in rows" :key="row.id" class="history-event">
        <h3>{{ t(`Patrol.configHistory.${row.action}`) }} · {{ row.actorName || t('Patrol.configHistory.unknownActor') }} · {{ dateTime(row.createTime) }}</h3>
        <div class="history-values">
          <section v-for="side in (['beforeValue', 'afterValue'] as const)" :key="side">
            <h4>{{ t(`Patrol.configHistory.${side}`) }}</h4>
            <template v-if="row[side]">
              <p>{{ t('Patrol.name') }}：{{ row[side]!.name }}</p>
              <p>{{ t('Patrol.enabled') }}：{{ t(row[side]!.enabled ? 'Patrol.active' : 'Patrol.inactive') }}</p>
              <p>{{ t('Patrol.description') }}：{{ row[side]!.description || '—' }}</p>
              <RuleSummary v-if="resource === 'levels'" :rule="row[side]!.rule" />
            </template>
            <p v-else>—</p>
          </section>
        </div>
      </section>
    </Spin>
    <Pagination v-if="total > 10" :current="page" :total="total" :page-size="10" :disabled="loading" :show-size-changer="false" @change="load" />
  </Modal>
</template>
<style scoped>
.history-event { padding: 12px 0; border-bottom: 1px solid var(--ant-color-border-secondary, #eee); }
.history-values { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; overflow-wrap: anywhere; }
.history-values > section { padding: 12px; background: var(--ant-color-fill-alter, #fafafa); }
@media (max-width: 640px) { .history-values { grid-template-columns: 1fr; } }
</style>
