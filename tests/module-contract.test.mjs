import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { savePermission, resources } from '../model/resources.ts'
const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const menus = JSON.parse(read('baseMenu.json'))
const flatten = nodes => nodes.flatMap(node => node.children?.length ? flatten(node.children) : [node])
const pages = flatten(menus.filter(menu => menu.id !== 'patrol-system'))
const systemPages = flatten(menus.filter(menu => menu.id === 'patrol-system'))
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
test('page button permission expressions resolve to declared menu codes and button IDs', () => {
  const allowed = new Set(pages.flatMap(item =>
    (item.buttons || []).map(button => `${item.code}:${button.id}`)
  ))
  const cases = [
    ...resources.map(resource => ({ file: 'components/ConfigurationPage.vue', resource })),
  ]
  let checked = 0
  for (const { file, resource } of cases) {
    for (const [, expression] of read(file).matchAll(/:has-permission="([^"]+)"/g)) {
      const code = new Function('resource', 'savePermission', `return (${expression})`)(resource, savePermission)
      assert(allowed.has(code), `${file} (${resource || 'tasks'}): ${code} is not a declared menu button`)
      checked++
    }
  }
  assert.equal(checked, resources.length * 2)
})
test('menu, actual page, backend resource, application template and asset types align', () => {
  assert.equal(pages.length, 8)
  const seen = new Set()
  for (const item of pages) {
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
            levels: 'Level',
            tags: 'Tag',
            warnings: 'Warning',
            calendar: 'Calendar',
            coverage: 'Statistics',
            qualification: 'Statistics',
            personnel: 'Statistics',
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
    'components/TaskGroupDetails.vue',
    'components/ExecutionHistory.vue',
    'components/CalendarDayDetails.vue',
    'components/StatisticsPage.vue',
    'components/statistics/StatisticsFactDetails.vue',
    'views/patrol/calendar/index.vue',
    'components/ConfigEditor.vue',
    'components/RuleEditor.vue',
    'components/StandardEditor.vue',
    'components/StandardItemEditor.vue',
    'components/PatrolImage.vue',
    'components/InspectionResults.vue',
    'views/patrol/records/index.vue',
    'views/patrol/points/index.vue',
    'views/patrol/warnings/index.vue',
    'components/RosterImport.vue',
  ]) {
    for (const [, key] of read(file).matchAll(/(?:t\(|'|")(Patrol\.[A-Za-z0-9.]+)(?:'|")/g))
      assert(keys(zh).includes(key), key)
  }
})

test('menu grants expose every template asset, including the person directory user scope', () => {
  const grantable = new Set()
  for (const item of pages) {
    assert.equal(item.accessSupport, 'support', `${item.id} must expose data permissions`)
    assert(item.assetTypes.includes(item.assetType))
    for (const assetType of item.assetTypes) grantable.add(assetType)
  }
  assert(pages.find(item => item.id === 'patrol-points').assetTypes.includes('user'))
  for (const [, assetType] of template.matchAll(/asset-type: (\w+)/g)) {
    assert(grantable.has(assetType), `Template asset ${assetType} is unavailable in menu grant editor`)
  }
})

 test('point operations replace extra navigation while calendar and unified statistics remain', () => {
  const ids = new Set(pages.map(page => page.id))
  for (const id of ['patrol-posts', 'patrol-rosters', 'patrol-plans', 'patrol-tasks', 'patrol-reports']) {
    assert(!ids.has(id)); assert(!template.includes(`- id: ${id}\n`))
  }
  const point = pages.find(page => page.id === 'patrol-points')
  assert(!point.buttons.some(button => button.id === 'roles'))
  for (const id of ['assign', 'importRoster']) {
    assert(point.buttons.some(button => button.id === id))
    assert(template.includes(`{id: ${id}, granted: true}`))
    assert(read('views/patrol/points/Page.vue').includes(`patrol/points:${id}`))
  }
  assert.deepEqual(menus.map(node => node.id), [
    'patrol-base', 'patrol-point-management', 'patrol-record-management',
    'patrol-statistics',
  ])
  assert(menus.every(node => node.children?.every(child => !child.children?.length)))
  assert(menus.find(node => node.id === 'patrol-point-management').children.some(node => node.id === 'patrol-calendar'))
  assert.deepEqual(menus.find(node => node.id === 'patrol-statistics').children.map(node => node.id), ['patrol-coverage'])
  assert.equal(pages.find(node => node.id === 'patrol-coverage').name, '巡更总览')
 })

test('warning configuration has no tag management entry or write grant', () => {
  const warnings = pages.find(page => page.id === 'patrol-warnings')
  assert.equal(warnings.name, '异常预警配置')
  assert(!pages.some(page => page.id === 'patrol-tags'))
  assert(!template.includes('- id: patrol-tags\n'))
  assert(!template.includes('- id: patrol-tag-management\n'))
  assert.deepEqual(warnings.assetTypes, ['patrolWarning'])
  assert.deepEqual(warnings.permissions, [
    { permission: 'patrol-warning', actions: ['query'] },
  ])
  for (const [resource, buttonId, permission] of [
    ['warnings', 'save', 'patrol-warning'],
  ]) {
    assert.equal(savePermission(resource), `patrol/warnings:${buttonId}`)
    const button = warnings.buttons.find(button => button.id === buttonId)
    assert.deepEqual(button.permissions, [{ permission, actions: ['save'] }])
  }
  assert(!template.includes('{id: tags, granted: true}'))
  assert(!existsSync(new URL('views/patrol/tags/index.vue', root)))
  assert(!read('views/patrol/warnings/index.vue').includes('resource="tags"'))
  assert(pages.find(page => page.id === 'patrol-points').permissions.some(permission =>
    permission.permission === 'patrol-tag' && permission.actions.includes('query')))
})

test('mobile execution grants are explicit and do not turn record queries into general writes', () => {
  const records = pages.find(page => page.id === 'patrol-records')
  assert(records.assetTypes.includes('user'))
  const mobile = records.buttons.find(button => button.id === 'mobile')
  assert.deepEqual(mobile.permissions, [
    { permission: 'patrol-task', actions: ['query'] },
    { permission: 'patrol-execution', actions: ['submit', 'submitMissed'] },
    { permission: 'patrol-attachment', actions: ['save'] },
    { permission: 'patrol-category', actions: ['query'] },
  ])
  assert(!records.permissions.some(permission => permission.actions.includes('submit')))
  assert(template.includes('{id: mobile, granted: true}'))
})

test('menu button translations use the JetLinks single-message string map contract', () => {
  for (const page of pages) {
    for (const button of page.buttons || []) {
      for (const message of Object.values(button.i18nMessages || {})) {
        assert.equal(typeof message, 'string', `${page.id}:${button.id} must use SingleI18nSupportEntity, not the menu translation shape`)
      }
    }
  }
})

// 基础页面只由公共模块装配，巡更不再维护菜单、路由或按钮副本。
test('system management belongs to the shared property module', () => {
  assert.deepEqual(systemPages, [])
  for (const page of ['OrganizationType', 'User', 'Space', 'Customer', 'Dictionary']) {
    assert(!existsSync(new URL(`views/patrol/${page}/index.vue`, root)))
  }
  assert.deepEqual(JSON.parse(read('package.json')).scripts.dev.split('--module-name ')[1].split(','),
    ['cloud-patrol-ui', 'property-base-ui', 'authentication-manager-ui'])
})
