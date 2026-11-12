import { getModuleRoutesMap } from '@jetlinks-web/utils'
import { moduleRegistry } from '@jetlinks-web-core/utils/module-registry'
import { name } from './package.json'
import registerSetting from './register'
import { patrolMenuFilter } from './model/menus'
const pages = import.meta.glob('./views/**/index.vue')
const PATROL_RECORDS_COMPONENT = 'patrol/execution-records'

/** 作为宿主模块装配，不注册独立路由器、登录页或请求客户端。 */
export default {
  getAsyncRoutesMap: () => {
    const routes = getModuleRoutesMap(pages)
    // 巡检模块也有 patrol/records，使用唯一组件键避免其注册覆盖巡更记录页。
    routes[PATROL_RECORDS_COMPONENT] = routes['patrol/records']
    return routes
  },
  getExtraRoutesMap: () => ({}),
  getComponents: () => ({}),
  getCoreRouteOverrides: () => [],
  getMenuFilters: () => [patrolMenuFilter],
  register: () => moduleRegistry.register(name, registerSetting),
}
