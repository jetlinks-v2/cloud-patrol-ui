import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const compile = async path => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ES2022 },
}).outputText
const moduleUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const adapter = moduleUrl((await compile('../api/request.ts'))
  .replace(/import .* from ['"]@jetlinks-web\/core['"];?/, `
    export const calls = [];
    const host = Object.fromEntries(['get', 'post', 'put', 'remove'].map(method => [method, (...args) => {
      calls.push({ method, url: args[0], data: args[1], options: args[2] });
      return Promise.resolve({ success: true, result: {} });
    }]));`)
  .replace(/import .* from ['"]\.\.\/composables\/useProjects['"];?/, "let listProject = 'list-project'; export const setListProject = value => { listProject = value }; export const selectedProject = () => listProject;"))
const api = await import(moduleUrl((await compile('../api/patrol.ts'))
  .replace(/(['"])\.\/request\1/, JSON.stringify(adapter))
  .replace(/import .* from ['"]\.\.\/composables\/useProjects['"];?/, `import { selectedProject } from ${JSON.stringify(adapter)};`)
  .replace(/import .* from ['"]\.\.\/model\/record-export['"];?/, `const waitForRecordExport = async () => '';`)))
const pointApi = await import(moduleUrl((await compile('../api/points.ts')).replace("'./request'", JSON.stringify(adapter)).replace('"./request"', JSON.stringify(adapter))))
const { calls, setListProject } = await import(adapter)

test('巡更记录分页传递取消信号，同时保留项目筛选头', async () => {
  calls.length = 0
  setListProject('record-project')
  const controller = new AbortController()
  await api.queryTaskGroups({ pageIndex: 0, pageSize: 96 }, { signal: controller.signal })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.signal, controller.signal)
  assert.equal(calls[0].options.headers['X-Patrol-Project'], 'record-project')
})

test('新增表单的项目独立于列表筛选，保存、关联候选和图片使用表单所属项目', async () => {
  calls.length = 0
  setListProject('list-project')
  await api.saveConfig('levels', { name: 'Level', projectId: 'editor-project' })
  await api.queryConfig('standards', {}, 'editor-project')
  await api.queryPeople({}, 'editor-project')
  await api.uploadImage(new Blob(['image']), 'example', 'editor-project')
  await api.previewImage('image-id', 'editor-project')
  assert.equal(calls.length, 5)
  assert.ok(calls.every(call => call.options.headers['X-Patrol-Project'] === 'editor-project'))
  assert.equal(calls[0].data.projectId, 'editor-project')
  await api.queryConfig('levels', {})
  assert.equal(calls.at(-1).options.headers['X-Patrol-Project'], 'list-project')
})

test('未预选列表项目也能将新增数据保存到表单选择的项目', async () => {
  setListProject(undefined)
  calls.length = 0
  await api.saveConfig('levels', { name: 'New level', projectId: 'chosen-in-form' })
  assert.equal(calls[0].method, 'post')
  assert.equal(calls[0].data.projectId, 'chosen-in-form')
  assert.equal(calls[0].options.headers['X-Patrol-Project'], 'chosen-in-form')
})

test('点位导入预览和提交显式使用同一个固定项目', async () => {
  calls.length = 0
  setListProject('another-project')
  const file = new File(['xlsx'], 'points.xlsx')
  await pointApi.previewPointImport(file, 'import-project')
  await pointApi.importPoints(file, 'import-project')
  assert.equal(calls.length, 2)
  assert.ok(calls.every(call => call.options.headers['X-Patrol-Project'] === 'import-project'))
  assert.ok(calls.every(call => call.data.get('file') === file))
})
