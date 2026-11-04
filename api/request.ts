import { request as host, type Request } from '@jetlinks-web/core'
import { selectedProject } from '../composables/useProjects'

/** 筛选头只收窄巡更请求，认证/应用上下文继续由宿主维护。 */
export const request: Pick<Request, 'get' | 'post' | 'put' | 'remove'> = {
  get: (url, params, options) => host.get(url, params, scoped(options)),
  post: (url, body, options) => host.post(url, body, scoped(options)),
  put: (url, body, options) => host.put(url, body, scoped(options)),
  remove: (url, params, options) => host.remove(url, params, scoped(options)),
}
function scoped(options: Parameters<Request['post']>[2]) {
  const projectId = selectedProject()
  return { ...options, headers: { ...options?.headers, ...(projectId ? { 'X-Patrol-Project': projectId } : {}) } }
}
