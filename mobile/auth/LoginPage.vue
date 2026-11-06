<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { Alert, Button, Form, Input } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { authState } from './session'
import { useLogin } from './useLogin'
const props = defineProps<{ notice?: string }>()
const { t, te } = useI18n()
const vm = reactive(useLogin())
onMounted(() => { void vm.reloadCaptcha() })
</script>

<template>
  <section class="patrol-login">
    <div class="login-brand">{{ authState.config.title || t('Mobile.title') }}</div>
    <div class="panel">
      <h1>{{ t('Mobile.employeeLogin') }}</h1>
      <p class="muted">{{ t('Mobile.loginHint') }}</p>
      <Alert v-if="vm.error || props.notice" type="error" show-icon :message="te(vm.error || props.notice || '') ? t(vm.error || props.notice || '') : vm.error || props.notice" />
      <Form layout="vertical" :model="vm.form" @finish="vm.login">
        <Form.Item :label="t('Mobile.loginDomain')" name="tenantDomain" :rules="[{ required: true, message: t('Mobile.loginRequired') }]">
          <Input v-model:value="vm.form.tenantDomain" autocomplete="organization" :maxlength="128" :disabled="vm.loading" />
        </Form.Item>
        <Form.Item :label="t('Mobile.loginAccount')" name="username" :rules="[{ required: true, message: t('Mobile.loginRequired') }]">
          <Input v-model:value="vm.form.username" autocomplete="username" :maxlength="128" :disabled="vm.loading" />
        </Form.Item>
        <Form.Item :label="t('Mobile.loginPassword')" name="password" :rules="[{ required: true, message: t('Mobile.loginRequired') }]">
          <Input.Password v-model:value="vm.form.password" autocomplete="current-password" :disabled="vm.loading" />
        </Form.Item>
        <Form.Item v-if="vm.captcha" :label="t('Mobile.loginCaptcha')" name="verifyCode" :rules="[{ required: true, message: t('Mobile.loginRequired') }]">
          <div class="captcha-row"><Input v-model:value="vm.form.verifyCode" autocomplete="off" :maxlength="8" :disabled="vm.loading" />
            <button type="button" :aria-label="t('Mobile.refreshCaptcha')" :disabled="vm.loading || vm.captchaLoading" @click="vm.reloadCaptcha"><img :src="vm.captcha" :alt="t('Mobile.loginCaptcha')" /></button></div>
        </Form.Item>
        <Button v-if="!vm.captchaReady && !vm.captchaLoading" block :disabled="vm.loading" @click="vm.reloadCaptcha">{{ t('Mobile.refreshCaptcha') }}</Button>
        <Button type="primary" html-type="submit" block size="large" :loading="vm.loading || vm.captchaLoading" :disabled="!vm.captchaReady">{{ t('Mobile.login') }}</Button>
      </Form>
    </div>
  </section>
</template>

<style scoped>
.patrol-login { width: min(100%, 460px); margin: auto; padding: max(56px, env(safe-area-inset-top)) 20px 32px; }
.login-brand { color: #3d7030; font-size: 26px; text-align: center; font-weight: 600; margin-bottom: 28px; }
.panel { padding: 28px 24px; }
h1 { text-align: left; font-size: 22px; }
.muted { margin: 10px 0 24px; }
.ant-alert { margin-bottom: 18px; }
.captcha-row { display: flex; gap: 12px; }
.captcha-row button { padding: 0; background: white; border: 1px solid #d9d9d9; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
.captcha-row img { display: block; width: 144px; height: 40px; object-fit: contain; }
.ant-btn + .ant-btn { margin-top: 12px; }
</style>
