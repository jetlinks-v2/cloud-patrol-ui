import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createRenderer, defineComponent, h, provide, ref, nextTick } from 'vue'

const result = await build({
  entryPoints: [fileURLToPath(new URL('../composables/usePatrolImage.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', external: ['vue'],
  plugins: [{ name: 'image-api', setup(builder) {
    builder.onResolve({ filter: /api\/patrol$/ }, () => ({ path: 'image-api', namespace: 'mock' }))
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `
      export const uploadImage = (...args) => globalThis.__patrolImageApi.uploadImage(...args);
      export const previewImage = (...args) => globalThis.__patrolImageApi.previewImage(...args);` }))
  } }],
})
const module = { exports: {} }
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports)
const { usePatrolImage } = module.exports

function mount(project, api, onUploaded = () => {}) {
  globalThis.__patrolImageApi = api
  let state
  const renderer = createRenderer({
    createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
    insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
    parentNode: () => null, nextSibling: () => null,
  })
  const Child = defineComponent({ setup() {
    state = usePatrolImage(id => { state.syncFile(id); onUploaded(id) })
    return () => h('div')
  } })
  const app = renderer.createApp(defineComponent({ setup() {
    provide('patrolAttachmentProject', project)
    return () => h(Child)
  } }))
  app.mount({})
  return { state, unmount: () => app.unmount() }
}

test('未选择所属项目时禁用上传，选定项目后将表单项目传给图片接口', async () => {
  const project = ref(), calls = [], uploaded = []
  const { state, unmount } = mount(project, {
    uploadImage: async (...args) => { calls.push(args); return { success: true, result: { id: 'photo' } } },
  }, id => uploaded.push(id))
  try {
    assert.equal(state.projectMissing.value, true)
    await state.upload(new Blob(['png'], { type: 'image/png' }))
    assert.equal(calls.length, 0)
    assert.equal(state.failed.value, false)
    project.value = 'form-project'
    await nextTick()
    assert.equal(state.projectMissing.value, false)
    await state.upload(new Blob(['png'], { type: 'image/png' }))
    assert.equal(calls[0][1], 'example')
    assert.equal(calls[0][2], 'form-project')
    assert.deepEqual(uploaded, ['photo'])
    assert.equal(state.failed.value, false)
    assert.match(state.dataUrl.value, /^blob:/)
  } finally { unmount() }
})

test('例图上传成功并回写表单后保留缩略图，替换附件时清理旧预览', async () => {
  const { state, unmount } = mount(ref('project'), {
    uploadImage: async () => ({ success: true, result: { id: 'photo' } }),
  })
  try {
    await state.upload(new Blob(['png'], { type: 'image/png' }))
    const thumbnail = state.dataUrl.value
    state.syncFile('photo')
    assert.equal(state.dataUrl.value, thumbnail)
    assert.match(thumbnail, /^blob:/)
    state.syncFile('different-photo')
    assert.equal(state.dataUrl.value, '')
  } finally { unmount() }
})

test('预览使用当前表单项目，请求失败后可重试', async () => {
  const calls = []; let fail = true
  const { state, unmount } = mount(ref('editor-project'), {
    previewImage: async (...args) => {
      calls.push(args)
      if (fail) throw new Error('network unavailable')
      return { success: true, result: { dataUrl: 'data:image/png;base64,test' } }
    },
  })
  try {
    await state.preview('photo')
    assert.equal(state.failed.value, true)
    assert.equal(state.loading.value, false)
    fail = false
    await state.preview('photo')
    assert.deepEqual(calls, [['photo', 'editor-project'], ['photo', 'editor-project']])
    assert.equal(state.failed.value, false)
    assert.equal(state.dataUrl.value, 'data:image/png;base64,test')
  } finally { unmount() }
})

test('关闭表单后迟到的上传结果不会回写附件', async () => {
  let resolveUpload
  const uploaded = []
  const { state, unmount } = mount(ref('project'), {
    uploadImage: () => new Promise(resolve => { resolveUpload = resolve }),
  }, id => uploaded.push(id))
  const pending = state.upload(new Blob(['png'], { type: 'image/png' }))
  unmount()
  resolveUpload({ success: true, result: { id: 'late-photo' } })
  await pending
  assert.deepEqual(uploaded, [])
  assert.equal(state.dataUrl.value, '')
})
