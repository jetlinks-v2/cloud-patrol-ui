import test from 'node:test'
import assert from 'node:assert/strict'
import { pointCategoryIds, commonPointCategories, initialPointCategory } from '../model/point-categories.ts'

test('a cancelled last category stays empty instead of resurrecting the initial category', () => {
  assert.deepEqual(pointCategoryIds({ categoryId: 'A', categoryIds: [] }), [])
  assert.deepEqual(pointCategoryIds({ categoryId: 'A' }), ['A'])
  assert.deepEqual(pointCategoryIds({ categoryId: 'A', categoryIds: ['B', 'B'] }), ['B'])
})

test('batch edits require a shared category and never guess between two valid classifications', () => {
  const points = [{ categoryIds: ['A', 'B'] }, { categoryIds: ['B', 'A', 'C'] }]
  assert.deepEqual(commonPointCategories(points), ['A', 'B'])
  assert.equal(initialPointCategory(points), undefined)
  assert.equal(initialPointCategory(points, 'B'), 'B')
  assert.equal(initialPointCategory(points, 'C'), undefined)
  assert.equal(initialPointCategory([{ categoryIds: ['A', 'B'] }, { categoryIds: ['B'] }]), 'B')
})

test('uncategorized points cannot be silently included in category-specific assignments', () => {
  assert.deepEqual(commonPointCategories([{ categoryId: 'A', categoryIds: [] }, { categoryId: 'A' }]), [])
  assert.equal(initialPointCategory([{ categoryIds: [] }], 'A'), undefined)
  assert.deepEqual(commonPointCategories([]), [])
})
