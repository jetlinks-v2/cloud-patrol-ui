import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import assert from 'node:assert/strict'

// 仅增量移动巡更的既有定义，不调用 owner/_all，不修改角色、模板或资产授权。
const {values} = parseArgs({options: {
  api: {type:'string'}, backup: {type:'string'}, apply: {type:'boolean', default:false},
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
const patrolIds = new Set(flatten(root.children).map(node => node.id))
mkdirSync(resolve(values.backup), {recursive:true, mode:0o700})
const stamp = new Date().toISOString().replaceAll(':','-')
writeFileSync(resolve(values.backup, `${stamp}-before.json`), JSON.stringify(snapshot, null, 2), {mode:0o600})
writeFileSync(resolve(values.backup, `${stamp}-patch.json`), JSON.stringify([root], null, 2), {mode:0o600})
console.log(JSON.stringify({mode:values.apply ? 'apply' : 'preview', root:root.id,
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
        || id === 'patrol-system' && key === 'sortIndex') continue
      assert.deepEqual(current[key], value, `菜单 ${id} 的 ${key} 意外变化，请检查备份`)
    }
  }
  for (const id of groupIds) assert.equal(afterById.get(id)?.parentId, root.id)
  assert.equal(afterById.get('patrol-system')?.sortIndex, 99)
  console.log('已验证：只调整巡更父级与系统管理顺序；原菜单及授权字段保持一致。')
}
