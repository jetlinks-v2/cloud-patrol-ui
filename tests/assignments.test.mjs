import test from 'node:test'
import assert from 'node:assert/strict'
import { assignmentDraft } from '../model/assignments.ts'
test('batch rules accept same posts regardless of order and copy only first point configuration', () => {
  const draft = assignmentDraft([
    { pointId: 'a', assignments: [{ postId: 'p1', levelId: 'l1', standardId: 's1' }, { postId: 'p2' }] },
    { pointId: 'b', assignments: [{ postId: 'p2', levelId: 'other' }, { postId: 'p1' }] },
  ])
  assert.equal(draft.samePosts, true)
  assert.deepEqual(draft.rules, [{ postId: 'p1', levelId: 'l1', standardId: 's1' }, { postId: 'p2', levelId: undefined, standardId: undefined }])
})
test('batch rules reject unassigned points and different post sets', () => {
  assert.equal(assignmentDraft([{ pointId: 'a', assignments: [] }]).samePosts, false)
  assert.equal(assignmentDraft([{ pointId: 'a', assignments: [{ postId: 'p1' }] }, { pointId: 'b', assignments: [{ postId: 'p2' }] }]).samePosts, false)
})
