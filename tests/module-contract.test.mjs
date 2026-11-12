import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const menu = JSON.parse(read('baseMenu.json'))[0]
// 只读取物业仓库中的巡更源码，避免旧独立仓库掩盖迁移后的契约变化。
const backend = process.env.PATROL_BACKEND_ROOT
  ? pathToFileURL(resolve(process.env.PATROL_BACKEND_ROOT) + sep)
  : [
      new URL('../property-management/', root),
      new URL('../../property-management/', root),
      new URL('../../../modules/property-management/', root),
    ]
      .find((candidate) => existsSync(new URL('modules/property-patrol/property-patrol-manager/pom.xml', candidate)))
assert(backend, 'Check out property-management or set PATROL_BACKEND_ROOT to its repository root')
const template = readFileSync(
  new URL('deploy/patrol/authentication-patrol-application.yml', backend),
  'utf8'
)
function keys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, item]) =>
    typeof item === 'object' ? keys(item, prefix + key + '.') : [prefix + key]
  )
}
test('menu, actual page, backend resource, application template and asset types align', () => {
  assert.equal(menu.children.length, 9)
  const seen = new Set()
  for (const item of menu.children) {
    assert(!seen.has(item.id))
    seen.add(item.id)
    assert.equal(item.owner, 'app')
    const page = item.code.split('/').at(-1)
    assert(existsSync(new URL(`views/patrol/${page}/index.vue`, root)))
    assert(template.includes(`- id: ${item.id}`))
    const resource = item.permissions[0].permission
    assert(item.showPage.includes(resource))
    const controller =
      page === 'records'
        ? 'Execution'
        : {
            categories: 'Category',
            points: 'Point',
            standards: 'Standard',
            posts: 'Post',
            rosters: 'Roster',
            plans: 'Plan',
            tasks: 'Task',
            reports: 'Report',
          }[page]
    const java = readFileSync(
      new URL(
        `modules/property-patrol/property-patrol-manager/src/main/java/org/jetlinks/pro/patrol/web/Patrol${controller}Controller.java`,
        backend
      ),
      'utf8'
    )
    assert(java.replace(/\s+/g, '').includes(`id="${resource}"`))
    assert(template.includes(`asset-type: ${item.assetType}`))
  }
})
test('Chinese and English dictionaries have identical keys and cover literal UI messages', () => {
  const zh = JSON.parse(read('locales/lang/zh.json')),
    en = JSON.parse(read('locales/lang/en.json'))
  assert.deepEqual(keys(zh).sort(), keys(en).sort())
  for (const file of [
    'components/ConfigEditor.vue',
    'components/RuleEditor.vue',
    'components/StandardEditor.vue',
    'components/StandardItemEditor.vue',
    'components/PatrolImage.vue',
    'components/InspectionResults.vue',
    'views/patrol/tasks/index.vue',
    'views/patrol/records/index.vue',
    'views/patrol/reports/index.vue',
  ]) {
    for (const [, key] of read(file).matchAll(/(?:t\(|'|")(Patrol\.[A-Za-z0-9.]+)(?:'|")/g))
      assert(keys(zh).includes(key), key)
  }
})

test('menu grants expose every template asset, including the person directory user scope', () => {
  const grantable = new Set()
  for (const item of menu.children) {
    assert.equal(item.accessSupport, 'support', `${item.id} must expose data permissions`)
    assert(item.assetTypes.includes(item.assetType))
    for (const assetType of item.assetTypes) grantable.add(assetType)
  }
  assert.deepEqual(menu.children.find(item => item.id === 'patrol-posts').assetTypes, ['patrolPost', 'user'])
  for (const [, assetType] of template.matchAll(/asset-type: (\w+)/g)) {
    assert(grantable.has(assetType), `Template asset ${assetType} is unavailable in menu grant editor`)
  }
})
