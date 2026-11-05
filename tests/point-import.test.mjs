import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { pointImportErrorsCsv } from '../model/point-import.ts'

const result = await build({
  entryPoints: [fileURLToPath(new URL('../composables/usePointImport.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', external: ['vue'],
  plugins: [{ name: 'point-import-boundaries', setup(builder) {
    builder.onResolve({ filter: /api\/points$|useProjects$|^vue-i18n$|^@jetlinks-web\/utils$/ }, args => ({ path: args.path, namespace: 'mock' }))
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, args => {
      if (args.path === 'vue-i18n') return { contents: 'export const useI18n = () => ({ t: key => key });' }
      if (args.path === '@jetlinks-web/utils') return { contents: 'export const onlyMessage = () => {};' }
      if (args.path.endsWith('useProjects')) return { contents: `
        export const selectedProject = () => globalThis.__pointImport.project;
        export const useProjects = () => ({ tree: { value: [{ id: 'project-a', name: '项目A', organizationType: 'project' }] } });` }
      return { contents: `
        export const previewPointImport = (...args) => globalThis.__pointImport.preview(...args);
        export const importPoints = (...args) => globalThis.__pointImport.submit(...args);
        export const downloadPointTemplate = (...args) => globalThis.__pointImport.download(...args);` }
    })
  } }],
})
const module = { exports: {} }
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports)
const { usePointImport } = module.exports
const tick = () => new Promise(setImmediate)
const row = (errors = []) => ({ rowNumber: 2, categoryId: 'category', categoryName: '分类', name: '门口', location: '一楼', errors })

test('导入固定打开时的项目，模板、预览、提交不会跟随列表项目切换', async () => {
  const calls = []; let saved = 0
  globalThis.__pointImport = {
    project: 'project-a',
    preview: async (...args) => { calls.push(['preview', ...args]); return { success: true, result: { rows: [row()] } } },
    submit: async (...args) => { calls.push(['submit', ...args]); return { success: true, result: 1 } },
    download: async (...args) => { calls.push(['download', ...args]) },
  }
  const state = usePointImport(() => saved++)
  globalThis.__pointImport.project = 'project-b'
  const file = new File(['xlsx'], 'points.xlsx')
  state.selectFile(file); await tick()
  assert.equal(state.projectName.value, '项目A')
  assert.equal(state.valid.value, true)
  assert.equal(state.validCount.value, 1)
  assert.equal(state.categoryCount.value, 1)
  await state.download(); await state.submit()
  assert.deepEqual(calls, [['preview', file, 'project-a'], ['download', 'project-a'], ['submit', file, 'project-a']])
  assert.equal(saved, 1)
  assert.equal(state.file.value, undefined)
  assert.equal(state.valid.value, false)
})

test('只要一行有错就不提交，摘要区分有效行和错误行', async () => {
  let writes = 0
  globalThis.__pointImport = {
    project: 'project-a',
    preview: async () => ({ success: true, result: { rows: [row(), { ...row(['categoryProjectMismatch']), rowNumber: 3 }] } }),
    submit: async () => { writes++; return { success: true, result: 2 } },
  }
  const state = usePointImport(() => {})
  state.selectFile(new File(['xlsx'], 'points.xlsx')); await tick()
  assert.equal(state.valid.value, false)
  assert.equal(state.validCount.value, 1)
  assert.equal(state.errorCount.value, 1)
  await state.submit()
  assert.equal(writes, 0)
})

test('未选择项目时不能上传、下载或提交', async () => {
  globalThis.__pointImport = { project: undefined }
  const state = usePointImport(() => assert.fail('unexpected save'))
  state.selectFile(new File(['xlsx'], 'points.xlsx'))
  await state.download(); await state.submit()
  assert.equal(state.file.value, undefined)
  assert.equal(state.valid.value, false)
})

test('错误结果保留真实行号、全部错误和引号，同时防止公式执行', () => {
  const csv = pointImportErrorsCsv([row(), { ...row(['categoryMismatch', 'existingPoint']), rowNumber: 8,
    name: '=1+1', location: '一楼,"门口"' }], ['行号', '分类', '点位', '位置', '错误'], code => code)
  assert.ok(csv.startsWith('\uFEFF'))
  assert.ok(!csv.includes('"2"'))
  assert.ok(csv.includes('"8","分类","\'=1+1","一楼,""门口""","categoryMismatch；existingPoint"'))
})

 test('导入窗口可以选择项目，切换项目清除旧预检文件', async () => {
  globalThis.__pointImport = { project: undefined, preview: async () => ({ success: true, result: { rows: [row()] } }) }
  const state = usePointImport(() => {})
  state.projectId.value = 'project-a'
  state.selectFile(new File(['xlsx'], 'points.xlsx')); await tick()
  assert.equal(state.valid.value, true)
  state.projectId.value = 'project-b'
  assert.equal(state.file.value, undefined)
  assert.deepEqual(state.rows.value, [])
  assert.equal(state.valid.value, false)
})
