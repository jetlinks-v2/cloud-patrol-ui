<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Alert, Button, ConfigProvider, Spin } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import App from './App.vue'
import LoginPage from './auth/LoginPage.vue'
import { authState, clearSession, initializeConfig, verifySession } from './auth/session'
import { logout } from './auth/useLogin'
const { t, te } = useI18n()
const hosted = !!window.patrolHost, ready = ref(hosted), configError = ref(''), notice = ref(''), loggingOut = ref(false)
let explicitLogout = false
watch(() => authState.session, (session, previous) => {
  if (!session && previous && !explicitLogout) notice.value = 'Mobile.sessionRequired'
  else if (session) notice.value = ''
})
async function start() {
  ready.value = false; configError.value = ''; notice.value = ''
  try {
    await initializeConfig()
    if (authState.session) {
      try { await verifySession() }
      catch (error) { clearSession(); notice.value = error instanceof Error ? error.message : 'Mobile.requestFailed' }
    }
  } catch (error) { configError.value = error instanceof Error ? error.message : 'Mobile.loginConfigFailed' }
  finally { ready.value = true }
}
async function signOut() {
  if (loggingOut.value) return
  loggingOut.value = true; explicitLogout = true
  try { await logout() } catch { /* 服务器退出失败也结束当前标签页会话。 */ }
  finally { notice.value = ''; loggingOut.value = false; explicitLogout = false }
}
onMounted(() => { if (!hosted) void start() })
</script>

<template>
  <ConfigProvider :theme="{ token: { colorPrimary: '#6ca95b', borderRadius: 6 } }">
    <div v-if="!ready" class="auth-loading"><Spin :tip="t('Mobile.loading')"><div style="height: 80px" /></Spin></div>
    <section v-else-if="configError" class="patrol-config-error panel"><Alert type="error" show-icon :message="te(configError) ? t(configError) : configError" /><Button block @click="start">{{ t('Mobile.retry') }}</Button></section>
    <App v-else-if="hosted || authState.session && authState.authorization" :standalone="!hosted" :logging-out="loggingOut" @logout="signOut" />
    <LoginPage v-else :notice="notice" />
  </ConfigProvider>
</template>
<style scoped>
.auth-loading, .patrol-config-error { max-width: 420px; margin: 80px auto; padding: 24px; }
.patrol-config-error .ant-btn { margin-top: 16px; }
</style>
