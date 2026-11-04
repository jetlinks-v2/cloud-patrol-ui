import test from 'node:test'
import assert from 'node:assert/strict'
import { ruleSummaryRows, ruleWindowTime } from '../model/rules.ts'

test('rule summary groups equal weekdays and preserves date overrides and rest days', () => {
  const window = { startMinute: 480, endMinute: 1080, intervalMinutes: 60, requiredCount: 1 }
  const rule = { weekly: { 1: [window], 2: [{ ...window }], 7: [{ ...window, requiredCount: 2 }] },
    dates: { '2026-11-05': [], '2026-11-04': [window] }, cooldownMinutes: 30 }
  const before = JSON.stringify(rule)
  assert.deepEqual(ruleSummaryRows(rule), [
    { days: [1, 2], windows: [window] },
    { days: [7], windows: [{ ...window, requiredCount: 2 }] },
    { days: [], date: '2026-11-04', windows: [window] },
    { days: [], date: '2026-11-05', windows: [] },
  ])
  assert.equal(JSON.stringify(rule), before)
  assert.deepEqual(ruleSummaryRows(), [])
})

test('rule summary distinguishes midnight end and overnight', () => {
  assert.deepEqual(ruleWindowTime({ startMinute: 0, endMinute: 1440 }), { start: '00:00', end: '24:00', nextDay: false })
  assert.deepEqual(ruleWindowTime({ startMinute: 1320, endMinute: 480 }), { start: '22:00', end: '08:00', nextDay: true })
})
