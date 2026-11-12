import { request as host, type Request } from '@jetlinks-web/core'
import { selectedProject } from '../composables/useProjects'

/** 筛选头只收窄巡更请求，认证/应用上下文继续由宿主维护。 */
export const request: Pick<Request, 'get' | 'post' | 'put' | 'remove'> = {
  get: (url, params, options) => host.get(url, params, scoped(url, options)),
  post: (url, body, options) => host.post(url, body, scoped(url, options)),
  put: (url, body, options) => host.put(url, body, scoped(url, options)),
  remove: (url, params, options) => host.remove(url, params, scoped(url, options)),
}
function scoped(url: string, options: Parameters<Request['post']>[2]) {
  // 角色和异常预警属于应用级数据，不受其他页面保留的项目筛选影响。
  const projectId = /^\/park\/patrol\/(?:warnings|roles)(?:\/|$)/.test(url) ? undefined : selectedProject()
  return { ...options, headers: { ...(projectId ? { 'X-Patrol-Project': projectId } : {}), ...options?.headers } }
}
