import { patrolProject } from './projectScope'
import { LocalStore } from '@jetlinks-web/utils'
import { TOKEN_KEY } from '@jetlinks-web/constants'

import { MobileError, resolveBrowserSession } from './browserSession'
export { MobileError } from './browserSession'
export interface MobileContext { userId: string; projectId?: string; applicationId: string; name?: string }
/** APP 尚未提供正式 Bridge。接入方实现此受限传输契约，页面业务无需依赖原生全局对象。 */
export interface PatrolHost {
  context(): Promise<MobileContext>
  request<T>(path: string, method: 'GET' | 'POST', body?: unknown, options?: { projectId?: string }): Promise<T>
  /** 可选：H5 首页返回时交给宿主关闭 WebView；不是平台已存在的 Bridge 名称。 */
  back?(): void
}
declare global { interface Window { patrolHost?: PatrolHost } }

const params = new URLSearchParams(location.search)
const projectCode = params.get('projectCode') || ''
const applicationId = params.get('applicationScope') || ''
function browserSession() {
  return resolveBrowserSession(projectCode, applicationId,
    projectCode ? localStorage.getItem(`project_${projectCode}`) : null,
    LocalStore.get(TOKEN_KEY), location.origin)
}
let identity = ''
async function browserRequest<T>(path: string, method: 'GET' | 'POST', body?: unknown, options?: { projectId?: string }): Promise<T> {
  const session = browserSession()
  const current = JSON.stringify([projectCode, applicationId, session.project.id, session.project.domain, session.token])
  if (identity && identity !== current) throw new MobileError(401, 'Mobile.contextChanged')
  identity = current
  const headers: Record<string, string> = { [TOKEN_KEY]: session.token,
    'X-Asset-Scope': `business_application:${applicationId}` }
  if (options?.projectId) headers['X-Patrol-Project'] = options.projectId
  if (session.domain) headers['X-Tenant-Domain'] = session.domain
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  // 部分 APP WebView 没有 AbortSignal.timeout，使用兼容的 AbortController。
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(session.api + path, { method, headers, credentials: 'same-origin',
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body), signal: controller.signal })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data || data.status && data.status !== 200) {
      const status = response.status === 200 ? data?.status || 502 : response.status
      // 手机查询同时要求应用授权、有效员工和项目权限，不能把管理入口可访问视为执行资格。
      const accessDenied = status === 403 && path.startsWith('/park/patrol/mobile/')
      throw new MobileError(status, accessDenied ? 'Mobile.accessDenied'
        : data?.message || (status === 401 ? 'Mobile.sessionRequired' : 'Mobile.requestFailed'))
    }
    return data.result as T
  } finally { clearTimeout(timeout) }
}
export const host: PatrolHost = window.patrolHost || {
  async context() {
    const me = await browserRequest<{ user: { id: string; name: string } }>('/authorize/me', 'GET')
    const { project } = browserSession()
    return { userId: me.user.id, projectId: projectCode ? String(project.id || projectCode) : undefined, applicationId,
      name: project.projectName || project.name || applicationId }
  },
  request: browserRequest,
}
let contextIdentity = ''
export async function resolveContext(): Promise<MobileContext> {
  const context = await host.context()
  if (![context.userId, context.applicationId].every(value => typeof value === 'string' && !!value.trim()))
    throw new MobileError(401, 'Mobile.sessionRequired')
  const signature = JSON.stringify([context.projectId, context.applicationId, context.userId])
  if (contextIdentity && contextIdentity !== signature) throw new MobileError(401, 'Mobile.contextChanged')
  contextIdentity = signature
  return context
}
/** 仅允许巡更相对路径；写请求不做自动重试。 */
export async function request<T>(path: string, method: 'GET' | 'POST' = 'POST', body?: unknown, projectId: string | undefined = patrolProject.value): Promise<T> {
  if (!path.startsWith('/park/patrol/') || path.includes('..') || path.includes('://'))
    return Promise.reject(new MobileError(400, 'Mobile.requestFailed'))
  await resolveContext()
  return host.request<T>(path, method, body, { projectId })
}
