import test from 'node:test'
import assert from 'node:assert/strict'
import { recordAbnormalState } from '../model/display.ts'

const now = 100000
const group = changes => ({requiredCount:4, completedCount:0, endTime:now - 1, ...changes})

test('记录按老巡更整组截止口径互斥判断漏检与缺勤', () => {
  assert.equal(recordAbnormalState(group({}), now), 'absent')
  assert.equal(recordAbnormalState(group({completedCount:1}), now), 'missed')
  assert.equal(recordAbnormalState(group({completedCount:4}), now), undefined)
  assert.equal(recordAbnormalState(group({completedCount:5}), now), undefined)
  assert.equal(recordAbnormalState(group({requiredCount:0}), now), undefined)
})

test('全部时段结束前不提前标色，角色行分别判断', () => {
  for (const completedCount of [0, 1]) {
    assert.equal(recordAbnormalState(group({completedCount, endTime:now}), now), undefined)
    assert.equal(recordAbnormalState(group({completedCount, endTime:now + 100}), now), undefined)
    assert.equal(recordAbnormalState(group({completedCount, endTime:undefined}), now), undefined)
  }
  const roles = [group({completedCount:0}), group({completedCount:2}), group({completedCount:4})]
  assert.deepEqual(roles.map(row => recordAbnormalState(row, now)), ['absent', 'missed', undefined])
})
