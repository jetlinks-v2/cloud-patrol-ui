import test from 'node:test'
import assert from 'node:assert/strict'
import { reactive } from 'vue'
import { draftOf } from '../model/resources.ts'
import { taskState, dateTime } from '../model/display.ts'

test('editing clones Vue proxy data and normalizes enum value without changing the source', () => {
  const source = reactive({
    id: 'p1',
    name: 'Night shift',
    enabled: true,
    rosterPolicy: { value: 'required', text: 'Required' },
    rule: {
      weekly: { 1: [{ startMinute: 480, endMinute: 600, intervalMinutes: 60, requiredCount: 1 }] },
      dates: {},
      cooldownMinutes: 30,
    },
  })
  const draft = draftOf('plans', source)
  assert.equal(draft.rosterPolicy, 'required')
  draft.rule.weekly['1'][0].requiredCount = 3
  assert.equal(source.rule.weekly['1'][0].requiredCount, 1)
})
test('a new standard and post have independent collections', () => {
  const one = draftOf('standards'),
    two = draftOf('standards')
  one.items.push({ id: 'one', title: 'Safety', required: true, options: ['OK'] })
  assert.equal(two.items.length, 0)
  assert.deepEqual(draftOf('posts').userIds, [])
})
test('task states use half-open windows and completion facts', () => {
  const task = { startTime: 1000, endTime: 2000, requiredCount: 2, completedCount: 1 }
  assert.equal(taskState(task, 999), 'pending')
  assert.equal(taskState(task, 1000), 'running')
  assert.equal(taskState(task, 2000), 'missed')
  assert.equal(taskState({ ...task, completedCount: 2 }, 3000), 'completed')
})

test('business timestamps remain UTC+08 regardless of the browser timezone', () => {
  assert.equal(dateTime(Date.parse('2026-11-02T00:00:00Z')), '2026-11-02 08:00:00')
  assert.equal(dateTime(0), '1970-01-01 08:00:00')
})
