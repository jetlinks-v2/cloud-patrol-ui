import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import assert from 'node:assert/strict'

// 仅增量更新巡更定义，不调用 owner/_all，不修改角色、模板或资产授权。
const {values} = parseArgs({options: {
  api: {type:'string'}, backup: {type:'string'}, apply: {type:'boolean', default:false},
  'repair-data-access': {type:'boolean', default:false},
}})
assert(values.api && values.backup && process.env.PATROL_MENU_TOKEN,
  '需要 --api、--backup 和环境变量 PATROL_MENU_TOKEN；默认只预览，写入需 --apply')
const api = values.api.replace(/\/$/, '')
const request = async (path, body, method = 'POST') => {
  const response = await fetch(`${api}${path}`, {
    method, headers: {'Content-Type':'application/json', 'X-Access-Token':process.env.PATROL_MENU_TOKEN},
    body: JSON.stringify(body), signal: AbortSignal.timeout(30000), redirect:'error',
  })
  const data = await response.json()
  assert(response.ok && data.status === 200, `${path}: ${response.status} / ${data.message}`)
  return data.result
}
const query = {terms:[{column:'owner', value:'app'}]}
const flatten = nodes => nodes.flatMap(node => {
  const {children, ...fields} = node
  return [fields, ...flatten(children || [])]
})
const snapshot = await request('/menu/_all/tree', query)
const nodes = flatten(snapshot)
const byId = new Map(nodes.map(node => [node.id, node]))
const rootSpec = JSON.parse(readFileSync(new URL('../baseMenu.json', import.meta.url), 'utf8'))[0]
const groupIds = [...rootSpec.children.map(group => group.id), 'patrol-system']
const root = structuredClone(byId.get(rootSpec.id) || {...rootSpec, children:undefined,
  runtime:undefined, parentId:'-1', status:1, options:{show:true, appName:'cloud-patrol'}})
assert(!root.appId && root.owner === 'app' && root.code === 'cloud-patrol'
  && root.options?.appName === 'cloud-patrol', '已有根节点身份不符，停止迁移')
const childrenOf = id => nodes.filter(node => node.parentId === id)
assert(childrenOf(root.id).every(node => groupIds.includes(node.id)), '根节点下存在未预期菜单，停止迁移')
const restoreChildren = node => ({...node, children:childrenOf(node.id).map(restoreChildren)})
root.children = groupIds.map(id => {
  const group = byId.get(id)
  assert(group && !group.appId && group.owner === 'app'
    && group.options?.appName === 'cloud-patrol', `菜单 ${id} 的巡更身份不符，停止迁移`)
  assert([null, undefined, '', '-1', root.id].includes(group.parentId), `菜单 ${id} 已属于其他分组，停止迁移`)
  return restoreChildren({...group, parentId:root.id, ...(id === 'patrol-system' ? {sortIndex:99} : {})})
})
// 声明菜单支持数据权限不等于授予数据；实际可读范围仍由模板、角色和 AssetsHolder 决定。
const repairedIds = new Set()
if (values['repair-data-access']) {
  const system = root.children.find(node => node.id === 'patrol-system')
  for (const name of ['OrganizationType', 'User', 'Space', 'Customer', 'Dictionary']) {
    const id = `patrol-${name}`
    const page = system.children.find(node => node.id === id)
    assert(page && page.code === `patrol/${name}`, `系统管理页面 ${id} 身份不符，停止修复`)
    assert(page.assetType || page.assetTypes?.length, `页面 ${id} 缺少资产类型，停止修复`)
    const support = typeof page.accessSupport === 'object' ? page.accessSupport?.value : page.accessSupport
    assert(!support || support === 'support', `页面 ${id} 已有其他数据权限模式，停止修复`)
    if (support !== 'support') {
      page.accessSupport = 'support'
      repairedIds.add(id)
    }
  }
}
const patrolIds = new Set(flatten(root.children).map(node => node.id))
mkdirSync(resolve(values.backup), {recursive:true, mode:0o700})
const stamp = new Date().toISOString().replaceAll(':','-')
writeFileSync(resolve(values.backup, `${stamp}-before.json`), JSON.stringify(snapshot, null, 2), {mode:0o600})
writeFileSync(resolve(values.backup, `${stamp}-patch.json`), JSON.stringify([root], null, 2), {mode:0o600})
console.log(JSON.stringify({mode:values.apply ? 'apply' : 'preview', root:root.id,
  repairedDataAccess: [...repairedIds],
  groups:root.children.map(({id, name, sortIndex}) => ({id, name, sortIndex}))}, null, 2))
if (values.apply) {
  await request('/menu', [root], 'PATCH')
  const after = await request('/menu/_all/tree', query)
  writeFileSync(resolve(values.backup, `${stamp}-after.json`), JSON.stringify(after, null, 2), {mode:0o600})
  const afterById = new Map(flatten(after).map(node => [node.id, node]))
  assert.equal(afterById.size, byId.size + (byId.has(root.id) ? 0 : 1), '菜单数量出现意外变化，请检查备份')
  for (const [id, before] of byId) {
    const current = afterById.get(id)
    assert(current, `原菜单 ${id} 丢失`)
    if (!patrolIds.has(id)) {
      assert.deepEqual(current, before, `非巡更菜单 ${id} 意外变化，请检查备份`)
      continue
    }
    for (const [key, value] of Object.entries(before)) {
      if (['path','level'].includes(key) || groupIds.includes(id) && key === 'parentId'
        || id === 'patrol-system' && key === 'sortIndex'
        || repairedIds.has(id) && key === 'accessSupport') continue
      assert.deepEqual(current[key], value, `菜单 ${id} 的 ${key} 意外变化，请检查备份`)
    }
    if (repairedIds.has(id)) {
      const support = typeof current.accessSupport === 'object' ? current.accessSupport?.value : current.accessSupport
      assert.equal(support, 'support', `菜单 ${id} 数据权限声明未保存`)
    }
  }
  for (const id of groupIds) assert.equal(afterById.get(id)?.parentId, root.id)
  assert.equal(afterById.get('patrol-system')?.sortIndex, 99)
  console.log('已验证：仅更新巡更父级、顺序及指定页面的数据权限声明；原按钮及资产策略保持一致。')
}
