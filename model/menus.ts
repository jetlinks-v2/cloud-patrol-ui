import type { MenuFilterDefinition, MenuItem } from '@jetlinks-web-core/types/module'
import { isProjectApplicationScope } from '@jetlinks-web-core/utils/application-scope'

const isPatrolRoot = (menu: MenuItem) => menu.code === 'cloud-patrol'
const isSystemMenu = (menu: MenuItem) => menu.code === 'patrol/system' || menu.code === 'charging/basic'
const PATROL_RECORDS_COMPONENT = 'patrol/execution-records'

const useUniquePatrolComponents = (menu: MenuItem): MenuItem => {
  const children = menu.children?.map(useUniquePatrolComponents)
  const result = menu.code === 'patrol/records'
    ? { ...menu, options: { ...menu.options, meta: { ...menu.options?.meta, componentCode: PATROL_RECORDS_COMPONENT } } }
    : menu
  return children ? { ...result, children } : result
}

// 已初始化环境可能仍下发旧预警菜单，统一移除入口，不依赖重新授权或修改 SaaS。
const removeWarningMenu = (menus: MenuItem[]): MenuItem[] => menus
  .filter(menu => menu.code !== 'patrol/warnings' && menu.id !== 'patrol-warnings')
  .map(menu => menu.children ? { ...menu, children: removeWarningMenu(menu.children) } : menu)

/** 公共页面仍由 property-base-ui 提供；巡更保留自己的菜单 ID 和授权节点。 */
export const createPatrolSystemMenu = (shared: MenuItem): MenuItem => ({
  ...shared,
  id: shared.code === 'charging/basic' ? 'patrol-system' : shared.id?.replace(/^charging-/, 'patrol-'),
  code: shared.code === 'charging/basic' ? 'patrol/system' : shared.code.replace(/^charging\//, 'patrol/'),
  name: shared.code === 'charging/basic' ? '系统管理' : shared.name,
  ...(shared.code === 'charging/basic' ? {
    i18nMessages: { name: { zh: '系统管理', zh_CN: '系统管理', en: 'System management', en_US: 'System management' } },
    sortIndex: 99,
  } : {}),
  options: { ...shared.options, appName: 'cloud-patrol', meta: { ...shared.options?.meta, componentCode: shared.code } },
  children: shared.children?.map(createPatrolSystemMenu),
})

// 只转换已授权的公共页面别名；不从源码补菜单、按钮或数据权限。
const resolveSystemRoutes = (menu: MenuItem): MenuItem => ({
  ...menu,
  code: menu.code === 'patrol/system' ? 'charging/basic' : menu.code.replace(/^patrol\//, 'charging/'),
  children: menu.children?.map(resolveSystemRoutes),
  options: { ...menu.options, appName: undefined },
})

export const patrolMenuFilter: MenuFilterDefinition = {
  code: 'patrol-application-navigation',
  filter(menus, { applicationScope }) {
    menus = removeWarningMenu(menus)
    if (!applicationScope?.trim() || isProjectApplicationScope(applicationScope)) return menus
    if (!menus.some(menu => isPatrolRoot(menu) || menu.code.startsWith('patrol/'))) return menus

    // 项目授权树保留完整分组；独立应用提升一层，让左侧分组与右侧页签保持原布局。
    const expanded = menus
      .flatMap(menu => isPatrolRoot(menu) ? menu.children || [] : [menu])
      .map(useUniquePatrolComponents)
    const systems = expanded.filter(isSystemMenu).map(menu => ({
      ...resolveSystemRoutes(menu),
      name: '系统管理',
      sortIndex: 99,
    }))
    return [...expanded.filter(menu => !isSystemMenu(menu)), ...systems]
  },
}
