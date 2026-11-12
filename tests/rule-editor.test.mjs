import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultPeriod, ruleDraft, serializeRule, ruleDraftIssue, periodCount, defaultRule } from '../model/rule-editor.ts'
const period = (patch = {}) => ({ ...defaultPeriod(), start: '08:00', end: '12:00', ...patch })
const dateOnly = periods => ({ weekRules: [], dateRules: [{ date: '2026-11-03', periods }] })
test('advanced date rules work alone and coexist with weekday rules without losing overrides', () => {
  const draft = dateOnly([period()])
  assert.equal(ruleDraftIssue(draft), undefined)
  const rule = serializeRule(draft, 0)
  assert.deepEqual(rule.weekly, {})
  assert.equal(rule.dates['2026-11-03'][0].intervalMinutes, 60)
  draft.weekRules.push({ days: [1, 2, 3, 4, 5], periods: [period({ start: '13:00', end: '18:00' })] })
  assert.equal(ruleDraftIssue(draft), undefined)
  const both = serializeRule(draft, 0)
  assert.equal(both.weekly['2'][0].startMinute, 780)
  assert.equal(both.dates['2026-11-03'][0].startMinute, 480)
})
test('same weekdays are grouped on opening and units and per-period intervals survive save and reopening', () => {
  const draft = { weekRules: [{ days: [1, 2], periods: [period({ frequency: 60, frequencyUnit: '1', interval: 10, intervalUnit: '1' }), period({ start: '13:00', end: '18:00', frequency: 2, interval: 2 })] }], dateRules: [] }
  assert.equal(ruleDraftIssue(draft), undefined)
  const rule = serializeRule(draft, 0)
  const reopened = ruleDraft(rule)
  assert.deepEqual(reopened.weekRules[0].days, [1, 2])
  assert.equal(reopened.weekRules[0].periods[0].frequency, 60)
  assert.equal(reopened.weekRules[0].periods[0].frequencyUnit, '1')
  assert.equal(reopened.weekRules[0].periods[1].interval, 2)
  assert.equal(reopened.weekRules[0].periods[1].intervalUnit, '2')
  assert.notEqual(rule.weekly['1'], rule.weekly['2'])
})
test('duplicate weekdays and dates and unfinished rule cards are rejected before map serialization', () => {
  assert.match(ruleDraftIssue({ weekRules: [], dateRules: [] }).key, /empty$/)
  assert.match(ruleDraftIssue({ weekRules: [{ days: [], periods: [period()] }], dateRules: [] }).key, /days$/)
  assert.match(ruleDraftIssue({ weekRules: [{ days: [1], periods: [] }], dateRules: [] }).key, /periods$/)
  const rows = [{ days: [1], periods: [period()] }, { days: [1, 2], periods: [period()] }]
  assert.match(ruleDraftIssue({ weekRules: rows, dateRules: [] }).key, /duplicateDay$/)
  const dates = dateOnly([period()]); dates.dateRules.push({ ...dates.dateRules[0] })
  assert.match(ruleDraftIssue(dates).key, /duplicateDate$/)
  assert.match(ruleDraftIssue(dateOnly([])).key, /datePeriods$/)
})
test('preview uses complete cycles while equal times and day units represent 24 hours', () => {
  assert.equal(periodCount(period()), 4)
  assert.equal(periodCount(period({ end: '10:10', times: 2 })), 4)
  assert.equal(periodCount(period({ end: '08:30' })), 0)
  assert.equal(periodCount(period({ start: '00:00', end: '00:00' })), 24)
  assert.equal(periodCount(period({ start: '22:00', end: '06:00', frequency: 2 })), 4)
  assert.equal(periodCount(period({ start: '00:00', end: '00:00', frequencyUnit: '3', intervalUnit: '3' })), 1)
})
test('weekly wrapping and both special date boundaries reject overnight overlaps', () => {
  const night = period({ start: '22:00', end: '06:00', frequency: 2 }), morning = period({ start: '05:00', end: '08:00' })
  assert.match(ruleDraftIssue({ weekRules: [{ days: [7], periods: [night] }, { days: [1], periods: [morning] }], dateRules: [] }).key, /overlap$/)
  assert.match(ruleDraftIssue({ weekRules: [{ days: [1], periods: [night] }], dateRules: [{ date: '2026-11-03', periods: [morning] }] }).key, /overlap$/)
  assert.match(ruleDraftIssue({ weekRules: [{ days: [2], periods: [morning] }], dateRules: [{ date: '2026-11-02', periods: [night] }] }).key, /overlap$/)
})
test('capacity, invalid dates and fractional quantities are rejected', () => {
  assert.match(ruleDraftIssue(dateOnly([period({ interval: 2 })])).key, /capacity$/)
  assert.match(ruleDraftIssue(dateOnly([period({ frequency: 1.5 })])).key, /number$/)
  const draft = dateOnly([period()]); draft.dateRules[0].date = '2026-02-30'
  assert.match(ruleDraftIssue(draft).key, /date$/)
})
test('persisted global zero gap and empty-date rest remain readable without changing their meaning', () => {
  const oldWindow = { startMinute: 480, endMinute: 720, intervalMinutes: 60, requiredCount: 1 }
  const original = { weekly: { 2: [oldWindow] }, dates: { '2026-11-04': [] }, cooldownMinutes: 0 }
  const before = JSON.stringify(original), draft = ruleDraft(original)
  assert.equal(ruleDraftIssue(draft), undefined)
  const result = serializeRule(draft, original.cooldownMinutes)
  assert.equal(result.weekly['2'][0].cooldownMinutes, 0)
  assert.equal(result.weekly['2'][0].cooldownUnit, null)
  assert.deepEqual(result.dates['2026-11-04'], [])
  assert.equal(JSON.stringify(original), before)
  assert.equal(ruleDraftIssue(ruleDraft(defaultRule())), undefined)
})
