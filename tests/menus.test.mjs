import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = fileURLToPath(new URL('..', import.meta.url))
const host = process.env.RUNTIME_UI_ROOT || [resolve(root, '../../..', 'sass平台/cloud.jetlinks/runtime-ui'), resolve(root, '../..')]
  .find(path => existsSync(resolve(path, 'jetlinks-web-core/src/utils/modules.ts')))
const result = await build({
  entryPoints: [resolve(root, 'model/menus.ts')], bundle: true, write: false, platform: 'node', format: 'cjs',
  alias: { '@jetlinks-web-core': resolve(host, 'jetlinks-web-core/src') },
})
const mod = {exports: {}}
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), mod, mod.exports)
const filter = mod.exports.patrolMenuFilter.filter
const page = {id: 'patrol-levels', code: 'patrol/levels', name: '点位等级', url: '/park/patrol/levels', buttons: [{id: 'save'}], assetAccesses: [{assetType: 'patrolLevel'}]}
const group = {id: 'patrol-base', code: 'patrol/base', name: '巡更基础管理', url: '/park/patrol/base', children: [page]}
const system = {id: 'patrol-system', code: 'patrol/system', name: '系统管理', url: '/charging/basic', children: [{id:'patrol-User', code:'patrol/User', name:'用户管理', url:'/charging/basic/users', buttons:[{id:'save'}]}]}
const patrol = {id: 'cloud-patrol', code:'cloud-patrol', name:'智能巡更', url:'/park/patrol', children: [system, group]}
const other = {id:'other', code:'other', name:'其他系统', url:'/other', children:[{code:'other/page'}]}

test('项目和无应用上下文保留完整授权树，不修改输入', () => {
  for (const applicationScope of [undefined, '', '__jetlinks_project__', 'business_application:__jetlinks_project__']) {
    const input = structuredClone([other, patrol]), before = structuredClone(input)
    assert.deepEqual(filter(input, {applicationScope}), before)
    assert.deepEqual(input, before)
  }
})

test('应用内仅展开巡更根，系统管理最后，页面、按钮及数据范围不丢失', () => {
  const input = structuredClone([other, patrol]), before = structuredClone(input)
  const navigation = filter(input, {applicationScope:'app-id'})
  assert.deepEqual(navigation.map(menu => menu.code), ['other', 'patrol/base', 'charging/basic'])
  assert.deepEqual(navigation[0], other)
  assert.deepEqual(navigation[1].children, [page])
  assert.equal(navigation[2].name, '系统管理')
  assert.equal(navigation[2].children[0].code, 'charging/User')
  assert.deepEqual(navigation[2].children[0].buttons, system.children[0].buttons)
  assert.deepEqual(input, before)
  assert.deepEqual(filter(navigation, {applicationScope:'app-id'}), navigation)
})

test('仅显示服务器已授权的子项，不补未授权系统管理或空根', () => {
  assert.deepEqual(filter([{...patrol, children:[group]}], {applicationScope:'app-id'}), [group])
  assert.deepEqual(filter([{...patrol, children:[]}], {applicationScope:'app-id'}), [])
  const partial = filter([{...patrol, children:[{...system, children:[]}]}], {applicationScope:'app-id'})
  assert.deepEqual(partial[0].children, [])
})

test('兼容旧平铺巡更菜单；其他应用的公共基础管理保持原顺序和名称', () => {
  const shared = {...system, code:'charging/basic', name:'物业基础管理'}
  assert.deepEqual(filter([shared, other], {applicationScope:'other-app'}), [shared, other])
  assert.deepEqual(filter([system, group], {applicationScope:'patrol-app'}).map(menu => menu.code), ['patrol/base', 'charging/basic'])
})
