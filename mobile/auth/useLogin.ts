import { reactive, ref } from 'vue'
import JSEncrypt from 'jsencrypt'
import { MobileError } from '../browserSession'
import { authState, clearSession, sessionRequest, setSession, verifySession } from './session'

/** 与 SaaS 认证接口保持相同的验证码、RSA 配置和应用授权流程。 */
export function useLogin() {
  const form = reactive({ tenantDomain: authState.config.tenantDomain, username: '', password: '', verifyKey: '', verifyCode: '' })
  const loading = ref(false), captchaLoading = ref(false), error = ref(''), captcha = ref(''), captchaReady = ref(false)
  const errorText = (value: unknown) => value instanceof Error ? value.message : 'Mobile.requestFailed'
  async function reloadCaptcha() {
    if (captchaLoading.value) return
    captchaLoading.value = true; captchaReady.value = false; captcha.value = ''; form.verifyCode = ''; form.verifyKey = ''
    try {
      const config = await sessionRequest<{ enabled: boolean; type: string }>('/authorize/captcha/config', 'GET', undefined, { scoped: false })
      if (config.enabled) {
        if (config.type !== 'image') throw new MobileError(400, 'Mobile.captchaUnsupported')
        const image = await sessionRequest<{ base64: string; key: string }>('/authorize/captcha/image?width=160&height=44', 'GET', undefined, { scoped: false })
        if (!image.base64 || !image.key) throw new MobileError(502, 'Mobile.requestFailed')
        captcha.value = image.base64; form.verifyKey = image.key
      }
      captchaReady.value = true
    } catch (value) { error.value = errorText(value) }
    finally { captchaLoading.value = false }
  }
  async function login() {
    if (loading.value || !captchaReady.value) return false
    loading.value = true; error.value = ''
    try {
      const domain = form.tenantDomain.trim(), username = form.username.trim()
      if (!domain || !username || !form.password || captcha.value && !form.verifyCode.trim())
        throw new MobileError(400, 'Mobile.loginRequired')
      // 账号后缀与输入域保持一致，避免认证成功后使用另一个域访问业务应用。
      if (username.includes('@') && username.slice(username.lastIndexOf('@') + 1) !== domain)
        throw new MobileError(400, 'Mobile.loginDomainMismatch')
      const config = await sessionRequest<{ encrypt?: { enabled: boolean; id: string; publicKey: string } }>('/authorize/login/configs', 'GET', undefined, { scoped: false })
      let password = form.password
      if (config.encrypt?.enabled) {
        if (!config.encrypt.id || !config.encrypt.publicKey) throw new MobileError(400, 'Mobile.passwordEncryptFailed')
        const rsa = new JSEncrypt(); rsa.setPublicKey(config.encrypt.publicKey)
        const encrypted = rsa.encrypt(password)
        if (!encrypted) throw new MobileError(400, 'Mobile.passwordEncryptFailed')
        password = encrypted
      }
      const result = await sessionRequest<{ token: string }>('/authorize/login', 'POST', {
        username: username.includes('@') ? username : `${username}@${domain}`, password,
        verifyKey: form.verifyKey, verifyCode: form.verifyCode.trim(), expires: 3600000,
        encryptId: config.encrypt?.enabled ? config.encrypt.id : undefined,
      }, { scoped: false })
      if (!result.token) throw new MobileError(502, 'Mobile.requestFailed')
      setSession({ token: result.token, applicationId: authState.config.applicationId, tenantDomain: domain })
      await verifySession()
      form.password = ''; form.verifyCode = ''
      return true
    } catch (value) {
      clearSession(); error.value = errorText(value); await reloadCaptcha()
      return false
    } finally { loading.value = false }
  }
  return { form, loading, error, captcha, captchaLoading, captchaReady, reloadCaptcha, login }
}

export async function logout() {
  try { await sessionRequest('/user-token/reset') }
  finally { clearSession() }
}
