import menus from './baseMenu.json'
interface Menu {
  children?: Menu[]
  options?: Record<string, unknown>
  [key: string]: unknown
}
const decorate = (items: Menu[]): Menu[] =>
  items.map((item) => ({
    ...item,
    runtime: true,
    options: { ...item.options, appName: 'cloud-patrol' },
    children: item.children ? decorate(item.children) : undefined,
  }))
export default () => decorate(menus)
