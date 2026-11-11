import { patrolProject } from './projectScope'
import { MobileError } from './browserSession'
import { authState, sessionRequest, verifySession } from './auth/session'
export { MobileError } from './browserSession'
export type PatrolMethod = 'GET' | 'POST' | 'PUT'
export interface MobileContext {
  userId: string; projectId?: string; applicationId: string; name?: string
  /** 仅控制管理入口的展示；写入和执行资格仍由后端分别校验。 */
  permissions?: { id: string; actions: string[] }[]
}
/** APP 尚未提供正式 Bridge。接入方实现此受限传输契约，页面业务无需依赖原生全局对象。 */
export interface PatrolHost {
  context(): Promise<MobileContext>
  request<T>(path: string, method: PatrolMethod, body?: unknown, options?: { projectId?: string }): Promise<T>
  /** 可选：H5 首页返回时交给宿主关闭 WebView；不是平台已存在的 Bridge 名称。 */
  back?(): void
}
declare global { interface Window { patrolHost?: PatrolHost } }

export const host: PatrolHost = window.patrolHost || {
  async context() {
    const me = authState.authorization || await verifySession()
    const session = authState.session
    if (!session) throw new MobileError(401, 'Mobile.sessionRequired')
    return { userId: me.user.id, applicationId: session.applicationId,
      name: me.user.name, permissions: me.permissions }
  },
  request: (path, method, body, options) => sessionRequest(path, method, body, options),
}
let contextIdentity = ''
export async function resolveContext(): Promise<MobileContext> {
  const context = await host.context()
  if (![context.userId, context.applicationId].every(value => typeof value === 'string' && !!value.trim()))
    throw new MobileError(401, 'Mobile.sessionRequired')
  const signature = JSON.stringify([context.projectId, context.applicationId, context.userId])
  // 浏览器账号切换由登录壳卸载业务页面；APP Bridge 仍禁止运行中静默换身份。
  if (window.patrolHost && contextIdentity && contextIdentity !== signature) throw new MobileError(401, 'Mobile.contextChanged')
  contextIdentity = signature
  return context
}
/** 仅允许巡更相对路径；写请求不做自动重试。 */
export async function request<T>(path: string, method: PatrolMethod = 'POST', body?: unknown, projectId: string | undefined = patrolProject.value,
  expected?: Pick<MobileContext, 'applicationId' | 'userId'>): Promise<T> {
  if (!path.startsWith('/park/patrol/') || path.includes('..') || path.includes('://'))
    return Promise.reject(new MobileError(400, 'Mobile.requestFailed'))
  const context = await resolveContext()
  // 离线队列的重试绑定原身份；核验后立即调用传输，不能静默换账号或项目发送旧记录。
  if (expected && (context.applicationId !== expected.applicationId || context.userId !== expected.userId || patrolProject.value !== projectId))
    throw new MobileError(401, 'Mobile.contextChanged')
  return host.request<T>(path, method, body, { projectId })
}
