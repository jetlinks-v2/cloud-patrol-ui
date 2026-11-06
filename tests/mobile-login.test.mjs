import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const directory = fileURLToPath(new URL('..', import.meta.url))
const bundle = await build({
  stdin: { contents: `export * from './mobile/auth/session.ts'; export * from './mobile/auth/useLogin.ts'; export { patrolProject } from './mobile/projectScope.ts'`, resolveDir: directory },
  bundle: true, write: false, platform: 'node', format: 'cjs', external: ['vue'],
  define: { 'import.meta.env.BASE_URL': JSON.stringify('/patrol-h5/') },
  plugins: [{ name: 'rsa-contract', setup(builder) {
    builder.onResolve({ filter: /^jsencrypt$/ }, () => ({ path: 'rsa', namespace: 'test' }))
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `export default class RSA { setPublicKey(key) { globalThis.rsaKey = key } encrypt(value) { return globalThis.rsaResult === false ? false : 'encrypted:' + value } }` }))
  } }],
})
const config = { applicationId: 'patrol-app', tenantDomain: 'CQHT', title: '智能巡更', apiBase: '/api' }
const authorization = { user: { id: 'employee', name: '巡更员工' }, permissions: [{ id: 'patrol-task', actions: ['query'] }] }
const ok = result => ({ ok: true, status: 200, json: async () => ({ status: 200, result }) })
const failed = status => ({ ok: false, status, json: async () => ({ status, message: 'denied' }) })

async function fixture(run) {
  const previous = Object.fromEntries(['location', 'sessionStorage', 'fetch', 'rsaKey', 'rsaResult'].map(key => [key, globalThis[key]]))
  const stored = new Map(), calls = []
  globalThis.location = { origin: 'http://localhost:9300', search: '' }
  globalThis.sessionStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) }
  let respond = (url) => {
    if (url === '/patrol-h5/config.json') return { ok: true, json: async () => config }
    if (url.endsWith('/captcha/config')) return ok({ enabled: true, type: 'image' })
    if (url.includes('/captcha/image')) return ok({ base64: 'data:image/png;base64,image', key: 'captcha-key' })
    if (url.endsWith('/login/configs')) return ok({ encrypt: { enabled: true, id: 'encrypt-id', publicKey: 'public-key' } })
    if (url.endsWith('/authorize/login')) return ok({ token: 'h5-token' })
    if (url.endsWith('/authorize/me')) return ok(authorization)
    return ok([])
  }
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return respond(url, options) }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports)
  try { await run({ ...module.exports, stored, calls, respond: handler => { respond = handler } }) }
  finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value } }
}

test('H5独立登录：公开认证请求不携带PC上下文，RSA后核验应用并收窄业务项目', () => fixture(async vm => {
  await vm.initializeConfig()
  const login = vm.useLogin()
  await login.reloadCaptcha()
  Object.assign(login.form, { username: 'test2', password: 'secret', verifyCode: '1234' })
  assert.equal(await login.login(), true)
  const request = vm.calls.find(call => call.url.endsWith('/authorize/login')).options
  assert.deepEqual(request.headers, { 'Content-Type': 'application/json' })
  assert.deepEqual(JSON.parse(request.body), { username: 'test2@CQHT', password: 'encrypted:secret', verifyKey: 'captcha-key', verifyCode: '1234', expires: 3600000, encryptId: 'encrypt-id' })
  assert.equal(globalThis.rsaKey, 'public-key')
  assert.equal(vm.authState.authorization.user.id, 'employee')
  assert.equal(login.form.password, '')
  await vm.sessionRequest('/park/patrol/mobile/tasks/_query', 'POST', { date: '2026-11-06' }, { projectId: 'project-a' })
  assert.deepEqual(vm.calls.at(-1).options.headers, { 'X-Access-Token': 'h5-token', 'X-Asset-Scope': 'business_application:patrol-app', 'X-Tenant-Domain': 'CQHT', 'X-Patrol-Project': 'project-a', 'Content-Type': 'application/json' })
  assert.equal(vm.calls.at(-1).options.credentials, 'omit')
}))

test('会话刷新恢复，应用配置变化拒绝旧会话，清理时重置业务项目', () => fixture(async vm => {
  await vm.initializeConfig()
  vm.setSession({ token: 'saved-token', applicationId: 'patrol-app', tenantDomain: 'CQHT' })
  vm.patrolProject.value = 'old-project'
  await vm.initializeConfig()
  assert.equal(vm.authState.session.token, 'saved-token')
  assert.equal(vm.patrolProject.value, undefined)
  assert.equal(vm.authState.authorization, undefined)
  vm.respond(() => ({ ok: true, json: async () => ({ ...config, applicationId: 'other-app' }) }))
  await vm.initializeConfig()
  assert.equal(vm.authState.session, undefined)
  assert.equal(vm.stored.size, 0)
}))

test('401回登录、403保留会话；旧请求不能删除或返回新账号的数据', () => fixture(async vm => {
  await vm.initializeConfig()
  const session = token => ({ token, applicationId: 'patrol-app', tenantDomain: 'CQHT' })
  vm.setSession(session('old'))
  vm.respond(() => failed(403))
  await assert.rejects(vm.sessionRequest('/park/patrol/mobile/tasks/_query'), error => error.status === 403)
  assert.equal(vm.authState.session.token, 'old')
  let complete
  vm.respond(() => new Promise(resolve => { complete = resolve }))
  const late = vm.sessionRequest('/park/patrol/mobile/tasks/_query')
  vm.setSession(session('new'))
  complete(failed(401))
  await assert.rejects(late, error => error.message === 'Mobile.contextChanged')
  assert.equal(vm.authState.session.token, 'new')
  vm.respond(() => failed(401))
  await assert.rejects(vm.sessionRequest('/park/patrol/mobile/tasks/_query'), error => error.status === 401)
  assert.equal(vm.authState.session, undefined)
  assert.equal(vm.stored.size, 0)
}))

test('加密失败不明文降级，没有应用权限不进入业务页', () => fixture(async vm => {
  await vm.initializeConfig()
  const login = vm.useLogin()
  await login.reloadCaptcha()
  Object.assign(login.form, { username: 'test2@CQHT', password: 'secret', verifyCode: '1234' })
  globalThis.rsaResult = false
  assert.equal(await login.login(), false)
  assert.equal(vm.calls.some(call => call.url.endsWith('/authorize/login')), false)
  assert.equal(login.error.value, 'Mobile.passwordEncryptFailed')
  globalThis.rsaResult = true
  vm.respond(url => url.endsWith('/authorize/me') ? ok({ user: { id: 'admin' }, permissions: [] })
    : url.endsWith('/authorize/login') ? ok({ token: 'token' })
      : url.endsWith('/captcha/config') ? ok({ enabled: false }) : ok({}))
  await login.reloadCaptcha()
  assert.equal(await login.login(), false)
  assert.equal(login.error.value, 'Mobile.accessDenied')
  assert.equal(vm.authState.session, undefined)
}))

test('拒绝跨域API及错误应用入口，退出失败仍清理本地登录', () => fixture(async vm => {
  vm.respond(() => ({ ok: true, json: async () => ({ ...config, apiBase: '//other.example/api' }) }))
  await assert.rejects(vm.initializeConfig(), error => error.message === 'Mobile.sameOriginRequired')
  vm.respond(() => ({ ok: true, json: async () => config }))
  globalThis.location.search = '?applicationScope=other'
  await assert.rejects(vm.initializeConfig(), error => error.message === 'Mobile.applicationMismatch')
  globalThis.location.search = ''
  await vm.initializeConfig()
  vm.setSession({ token: 'token', applicationId: 'patrol-app', tenantDomain: 'CQHT' })
  vm.respond(() => failed(503))
  await assert.rejects(vm.logout())
  assert.equal(vm.authState.session, undefined)
  assert.equal(vm.stored.size, 0)
  assert.equal(vm.calls.at(-1).options.method, 'GET')
}))
