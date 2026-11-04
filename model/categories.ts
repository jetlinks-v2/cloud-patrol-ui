import type { ConfigEntity } from '../api/types'
export interface CategoryNode { key: string; value: string; title: string; disabled: boolean; children: CategoryNode[] }
/** 分类接口返回授权内平铺数据；不可见父级作为根显示，不补查权限外节点。 */
export function categoryTree(rows: ConfigEntity[], excludedId?: string): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>()
  const disabled = new Set(categoryDescendants(rows, excludedId))
  rows.forEach(row => { if (row.id) nodes.set(row.id, { key: row.id, value: row.id, title: row.name, disabled: disabled.has(row.id), children: [] }) })
  const roots: CategoryNode[] = []
  rows.forEach(row => {
    const node = row.id ? nodes.get(row.id) : undefined
    if (!node) return
    const parent = row.parentId ? nodes.get(row.parentId) : undefined
    if (parent && parent !== node) parent.children.push(node)
    else roots.push(node)
  })
  return roots
}
/** 自身与后代同时用于父级禁选；点位分类树使用同一集合表达包含下级。 */
export function categoryDescendants(rows: ConfigEntity[], id?: string): string[] {
  if (!id) return []
  const ids = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    rows.forEach(row => {
      if (row.id && row.parentId && ids.has(row.parentId) && !ids.has(row.id)) { ids.add(row.id); changed = true }
    })
  }
  return [...ids]
}
/** 搜索保留匹配节点的祖先及其子树，避免命中叶节点后失去层级位置。 */
export function filterCategoryTree(nodes: CategoryNode[], keyword: string): CategoryNode[] {
  const search = keyword.trim().toLocaleLowerCase()
  if (!search) return nodes
  return nodes.flatMap(node => {
    if (node.title.toLocaleLowerCase().includes(search)) return [node]
    const children = filterCategoryTree(node.children, keyword)
    return children.length ? [{ ...node, children }] : []
  })
}
