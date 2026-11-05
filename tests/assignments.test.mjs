import test from 'node:test'
import assert from 'node:assert/strict'
import { assignmentDraft } from '../model/assignments.ts'
test('batch rules accept same posts regardless of order and copy only first point configuration', () => {
  const draft = assignmentDraft([
    { pointId: 'a', assignments: [{ roleId: 'p1', levelId: 'l1', standardId: 's1' }, { roleId: 'p2' }] },
    { pointId: 'b', assignments: [{ roleId: 'p2', levelId: 'other' }, { roleId: 'p1' }] },
  ])
  assert.equal(draft.samePosts, true)
  assert.deepEqual(draft.rules, [{ roleId: 'p1', levelId: 'l1', standardId: 's1' }, { roleId: 'p2', levelId: undefined, standardId: undefined }])
})
test('batch rules reject unassigned points and different post sets', () => {
  assert.equal(assignmentDraft([{ pointId: 'a', assignments: [] }]).samePosts, false)
  assert.equal(assignmentDraft([{ pointId: 'a', assignments: [{ roleId: 'p1' }] }, { pointId: 'b', assignments: [{ roleId: 'p2' }] }]).samePosts, false)
})
test('all-staff rule has its own draft and survives alongside assigned role rules', () => {
  const draft = assignmentDraft([{ pointId: 'a', assignments: [
    { roleId: '', levelId: 'shared-level', standardId: 'shared-standard' }, { roleId: 'security' },
  ] }])
  assert.deepEqual(draft.roleIds, ['', 'security'])
  assert.equal(draft.rules[0].roleId, '')
  assert.equal(draft.rules[0].levelId, 'shared-level')
})

// Exercise the real draft/request orchestration; only the transport and host messages are replaced.
const { readFile } = await import('node:fs/promises')
const ts = (await import('typescript')).default
const { nextTick, effectScope } = await import('vue')
const moduleUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const source = async path => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const modelUrl = moduleUrl(await source('../model/assignments.ts'))
const categoriesUrl = moduleUrl(await source('../model/point-categories.ts'))
const transportUrl = moduleUrl(`
  export const calls = [];
  export let response = { success: true, result: [{ pointId: 'point', assignments: [{ roleId: 'r1', levelId: 'l1', standardId: 's1' }] }] };
  export let saveResponse = { success: true };
  export const setSaveResponse = value => { saveResponse = value };
  export const getPointAssignments = async (...args) => { calls.push(['read', ...args]); return response };
  export const assignPointRoles = async (...args) => { calls.push(['roles', ...args]); return saveResponse };
  export const savePointConfiguration = async (...args) => { calls.push(['configuration', ...args]); return saveResponse };
`)
const hookCode = (await source('../composables/usePointAssignments.ts'))
  .replace(/from ['"]vue['"]/, `from ${JSON.stringify(import.meta.resolve('vue'))}`)
  .replace(', onBeforeUnmount', '')
  .replace(/onBeforeUnmount\(.*\);?/, '')
  .replace(/import .* from ['"]vue-i18n['"];?/, "const useI18n = () => ({ t: key => key });")
  .replace(/import .* from ['"]@jetlinks-web\/utils['"];?/, 'const onlyMessage = () => {};')
  .replace(/from ['"]\.\.\/api\/assignments['"]/, `from ${JSON.stringify(transportUrl)}`)
  .replace(/from ['"]\.\.\/model\/assignments['"]/, `from ${JSON.stringify(modelUrl)}`)
  .replace(/from ['"]\.\.\/model\/point-categories['"]/, `from ${JSON.stringify(categoriesUrl)}`)
const { usePointAssignments } = await import(moduleUrl(hookCode))
const transport = await import(transportUrl)
async function editor(run) {
  transport.calls.length = 0
  transport.setSaveResponse({ success: true })
  const scope = effectScope()
  let saved = 0
  const draft = scope.run(() => usePointAssignments([{ id: 'point', categoryIds: ['category'] }], () => saved++))
  await nextTick()
  try { await run(draft, () => saved) } finally { scope.stop() }
}

test('opening configuration immediately shows roles and rules without a write', () => editor(async draft => {
  assert.deepEqual(draft.roleIds.value, ['r1'])
  assert.equal(draft.rules.value[0].levelId, 'l1')
  assert.deepEqual(transport.calls.map(call => call[0]), ['read'])
}))

test('role edits retain existing and unsaved rule drafts, then submit one combined request', () => editor(async (draft, saved) => {
  draft.updateRoles(['r1', 'r2'])
  draft.rules.value[1].levelId = 'l2'
  draft.rules.value[1].standardId = 's2'
  draft.updateRoles(['r1'])
  draft.updateRoles(['r2', 'r1'])
  assert.equal(draft.rules.value[0].levelId, 'l2')
  assert.equal(draft.rules.value[1].standardId, 's1')
  assert.equal(await draft.save(), true)
  assert.deepEqual(transport.calls.map(call => call[0]), ['read', 'configuration'])
  assert.deepEqual(transport.calls[1].slice(1), [['point'], [
    { roleId: 'r2', levelId: 'l2', standardId: 's2' },
    { roleId: 'r1', levelId: 'l1', standardId: 's1' },
  ], 'category'])
  assert.equal(saved(), 1)
}))

test('failed save keeps the draft; unconfigured roles are saved in the same request', () => editor(async (draft, saved) => {
  draft.updateRoles(['r1', 'r2'])
  transport.setSaveResponse({ success: false })
  assert.equal(await draft.save(), undefined)
  assert.equal(saved(), 0)
  assert.equal(draft.saveFailed.value, true)
  assert.equal(draft.rules.value[0].levelId, 'l1')
  transport.setSaveResponse({ success: true })
  assert.equal(await draft.save(), true)
  assert.deepEqual(transport.calls.at(-1), ['configuration', ['point'], [
    { roleId: 'r1', levelId: 'l1', standardId: 's1' }, { roleId: 'r2' },
  ], 'category'])
  assert.equal(saved(), 1)
}))

test('all-staff configuration and clearing all configurations use the same save endpoint', () => editor(async draft => {
  draft.updateRoles([''])
  draft.rules.value[0].levelId = 'all-level'
  draft.rules.value[0].standardId = 'all-standard'
  assert.equal(await draft.save(), true)
  assert.deepEqual(transport.calls.at(-1), ['configuration', ['point'], [
    { roleId: '', levelId: 'all-level', standardId: 'all-standard' },
  ], 'category'])
  draft.updateRoles([])
  assert.equal(await draft.save(), true)
  assert.deepEqual(transport.calls.at(-1), ['configuration', ['point'], [], 'category'])
}))
