import test from 'node:test'
import assert from 'node:assert/strict'
import { pointRolesTerm, pointTagsTerm } from '../model/point-filters.ts'
test('point reference filters preserve multi selections and map exclusion to standard term options', () => {
  assert.deepEqual(pointTagsTerm(['t1', 't2'], false), { column: 'tagIds', termType: 'patrol-point-tags', value: ['t1', 't2'] })
  assert.deepEqual(pointRolesTerm(['p1', 'p2'], false), { column: 'id', termType: 'patrol-point-plan', value: { 'roleId$in': ['p1', 'p2'], enabled: true } })
  assert.equal(pointTagsTerm(['t1'], true).termType, 'patrol-point-tags$not')
  assert.equal(pointRolesTerm(['p1'], true).termType, 'patrol-point-plan$not')
})
