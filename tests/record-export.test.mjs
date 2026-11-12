import test from 'node:test'
import assert from 'node:assert/strict'
import { waitForRecordExport } from '../model/record-export.ts'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const running = { id: 'job', state: 'running', processedGroups: 0, totalGroups: 10 }
test('长时间生成持续查询进度，只有完成才返回下载编号', async () => {
  const seen = []; let reads = 0, delays = 0
  const id = await waitForRecordExport(running, async id => {
    assert.equal(id, 'job'); reads++
    return { ...running, state: reads === 100 ? 'ready' : 'running', processedGroups: Math.min(10, reads) }
  }, status => seen.push(status), async () => { delays++ })
  assert.equal(id, 'job'); assert.equal(reads, 100); assert.equal(delays, 100)
  assert.equal(seen.at(-1).state, 'ready'); assert.equal(seen.length, 101)
})
test('后台明确失败保留原因，不返回下载编号或继续轮询', async () => {
  let reads = 0
  await assert.rejects(waitForRecordExport(running, async () => {
    reads++; return { ...running, state: 'failed', errorCode: 'error.patrol_record_export_image_limit' }
  }, undefined, async () => {}), /error.patrol_record_export_image_limit/)
  assert.equal(reads, 1)
})

const compiled = await build({entryPoints: [fileURLToPath(new URL('../api/patrol.ts', import.meta.url))], bundle: true,
  platform: 'node', format: 'cjs', write: false,
  plugins: [{name:'export-boundaries', setup(build) {
    build.onResolve({filter:/^\.\/request$/}, () => ({path:'request', namespace:'stub'}))
    build.onResolve({filter:/useProjects$/}, () => ({path:'project', namespace:'stub'}))
    build.onLoad({filter:/.*/, namespace:'stub'}, ({path}) => ({contents: path === 'request'
      ? 'export const request = globalThis.__patrolExportTest.request'
      : 'export const selectedProject = () => globalThis.__patrolExportTest.project', loader:'js'}))
  }}]})

test('导出创建、状态和文件请求均取消客户端超时且固定点击时项目，完成后才下载', async () => {
  const calls = [], clicks = []
  globalThis.__patrolExportTest = {project: 'original', request: {
    post: async (...args) => { calls.push(args); return {success:true, result:{...running, state:'ready'}} },
    get: async (...args) => { calls.push(args); return {data: new ArrayBuffer(4)} },
  }}
  const module = {exports:{}}
  new Function('module','exports',compiled.outputFiles[0].text)(module, module.exports)
  const previousDocument = globalThis.document, previousTimeout = globalThis.setTimeout
  const anchor = {click: () => clicks.push(anchor.download), remove: () => {}}
  globalThis.document = {createElement: () => anchor, body: {appendChild: () => {}}}
  globalThis.setTimeout = callback => { callback(); return 0 }
  try {
    await module.exports.exportTaskGroups({terms:[]}, () => { globalThis.__patrolExportTest.project = 'changed' })
    assert.equal(calls.length, 2)
    assert.equal(calls[0][0], '/park/patrol/task-groups/export-jobs')
    assert.equal(calls[1][0], '/park/patrol/task-groups/export-jobs/job/file')
    for (const args of calls) { assert.equal(args[2].timeout, 0); assert.equal(args[2].headers['X-Patrol-Project'], 'original') }
    assert.equal(calls[1][2].responseType, 'arraybuffer'); assert.deepEqual(clicks, ['点位巡更记录.xlsx'])
  } finally { globalThis.document = previousDocument; globalThis.setTimeout = previousTimeout; delete globalThis.__patrolExportTest }
})
