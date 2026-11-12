import test from 'node:test'
import assert from 'node:assert/strict'
import { canApplyMissed, missedState, missedDecisions } from '../model/missed.ts'
test('only absent, rejected and withdrawn applications can be resubmitted', () => {
  for (const status of ['none', 'rejected', 'withdrawn']) assert(canApplyMissed({ status }))
  for (const value of ['pending', 'approved']) {
    assert.equal(canApplyMissed({ status: { value, text: 'display' } }), false)
    assert.equal(missedState({ status: { value, text: 'display' } }), value)
  }
})
test('audits bind the selected current application as well as the occurrence', () => {
  assert.deepEqual(missedDecisions([{ id: 'occurrence-3', applicationId: 'attempt-2' }]),
    [{ itemId: 'occurrence-3', applicationId: 'attempt-2' }])
})
