import test from 'node:test'
import assert from 'node:assert/strict'
import { selectedExportQuery } from '../model/export-query.ts'

test('勾选导出与原OR筛选整体相交，不丢失条件或扩大查询', () => {
  const query = { terms: [{ column: 'name', value: 'A' }, { column: 'name', value: 'B', type: 'or' }], sorts: [{ name: 'id', order: 'asc' }] }
  const selected = selectedExportQuery(query, ['id-a', 'id-a', 'id-b'])
  assert.deepEqual(selected.terms, [{ terms: query.terms, type: 'and' }, { column: 'id', termType: 'in', value: ['id-a', 'id-b'] }])
  assert.equal(query.terms.length, 2)
  assert.deepEqual(selected.sorts, query.sorts)
  assert.equal(selectedExportQuery(query, []), query)
})
