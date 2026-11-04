import test from 'node:test'
import assert from 'node:assert/strict'
import { groupMissedTerm } from '../model/record-filters.ts'

test('record list distinguishes current pending applications from any historical application', () => {
  assert.deepEqual(groupMissedTerm('pending'), {
    column: 'id', termType: 'patrol-group-missed', value: { status: 'pending' },
  })
  assert.deepEqual(groupMissedTerm('applied'), {
    column: 'id', termType: 'patrol-group-missed', value: { 'applicationId$notnull': true },
  })
})
