import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarPoints } from '../model/calendar.ts'

const now = 100000
const task = changes => ({ id: 'a', pointId: 'point', pointName: '门口', projectId: 'project', roleName: '保安',
  taskGroupId: 'security', startTime: 1, endTime: 90000, requiredCount: 2, completedCount: 1, ...changes })

test('一个点位多个角色多个时段仍只展示一行，部分完成可以同时有漏检', () => {
  const points = calendarPoints([task({}), task({ id: 'b', roleName: '保洁', taskGroupId: 'cleaning', completedCount: 0 }),
    task({ id: 'c', completedCount: 2 })], now)
  assert.equal(points.length, 1)
  assert.deepEqual(points[0].roles, ['保安', '保洁'])
  assert.equal(points[0].status, 'partial')
  assert.equal(points[0].missed, true)
  assert.equal(points[0].tasks.length, 3)
})

test('已完成要求全部角色全部任务完成，完成一个角色不能计入已完成点位', () => {
  const security = task({ completedCount: 2 })
  const cleaning = task({ id: 'b', roleName: '保洁', completedCount: 0, endTime: now + 1 })
  assert.equal(calendarPoints([security, cleaning], now)[0].status, 'partial')
  assert.equal(calendarPoints([security, cleaning], now)[0].missed, false)
  const done = calendarPoints([security, { ...cleaning, completedCount: 2 }], now)[0]
  assert.equal(done.status, 'completed')
  assert.equal(done.missed, false)
})

test('按项目和点位ID去重，不按名称或任务组；未来任务不算漏检', () => {
  const points = calendarPoints([task({}), task({ id: 'b', pointId: 'another' }), task({ id: 'c', projectId: 'another-project' }),
    task({ id: 'future', pointId: 'future', startTime: now + 1, endTime: now + 2, completedCount: 0 })], now)
  assert.equal(points.length, 4)
  assert.equal(points[3].status, 'pending')
  assert.equal(points[3].missed, false)
})

test('全部时段截止后完全未巡计缺勤，不再计漏检；存在未来时段时不提前判缺勤', () => {
  const [point] = calendarPoints([task({ completedCount: 0, endTime: now })], now)
  assert.equal(point.status, 'unvisited')
  assert.equal(point.missed, false)
  assert.equal(point.absent, true)
  const [ongoing] = calendarPoints([task({ completedCount: 0 }), task({ id: 'b', completedCount: 0, endTime: now + 1 })], now)
  assert.equal(ongoing.absent, false)
  assert.equal(ongoing.missed, false)
  assert.equal(calendarPoints([task({ requiredCount: 0, completedCount: 0 })], now)[0].absent, false)
})
