import { getModuleRoutesMap } from '@jetlinks-web/utils'
import { moduleRegistry } from '@jetlinks-web-core/utils/module-registry'
import { name } from './package.json'
const pages = import.meta.glob('./views/**/index.vue')
/** 作为宿主模块装配，不注册独立路由器、登录页或请求客户端。 */
export default {
  getAsyncRoutesMap: () => getModuleRoutesMap(pages),
  getExtraRoutesMap: () => ({}),
  getComponents: () => ({}),
  getCoreRouteOverrides: () => [],
  register: () => moduleRegistry.register(name, { apis: {}, components: {} }),
}
