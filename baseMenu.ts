import menus from './baseMenu.json'
import sharedBaseMenu from '@property-base-ui/baseMenu'
import { createPatrolSystemMenu } from './model/menus'
import type { MenuItem } from '@jetlinks-web-core/types/module'

const decorate = (items: MenuItem[]): MenuItem[] =>
  items.map((item) => ({
    ...item,
    runtime: true,
    options: { ...item.options, appName: 'cloud-patrol' },
    children: item.children ? decorate(item.children) : undefined,
  }))
// 复用公共菜单出口生成巡更授权别名，不复制公共页面或修改其全局菜单。
export default () => decorate(menus).map(menu => ({
  ...menu,
  children: [...(menu.children || []), ...(sharedBaseMenu() as unknown as MenuItem[]).map(createPatrolSystemMenu)],
}))
