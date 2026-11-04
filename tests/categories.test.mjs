import test from 'node:test'
import assert from 'node:assert/strict'
import { categoryTree, categoryDescendants, filterCategoryTree } from '../model/categories.ts'
const rows = [
  { id: 'root', name: 'Building', enabled: true },
  { id: 'floor', name: 'Floor', parentId: 'root', enabled: true },
  { id: 'room', name: 'Room', parentId: 'floor', enabled: true },
  { id: 'other', name: 'Outside', parentId: 'invisible', enabled: true },
]
test('authorized flat categories form a tree, preserving inaccessible-parent nodes as roots', () => {
  const tree = categoryTree(rows, 'floor')
  assert.deepEqual(tree.map(row => row.key), ['root', 'other'])
  assert.equal(tree[0].disabled, false)
  assert.equal(tree[0].children[0].disabled, true)
  assert.equal(tree[0].children[0].children[0].disabled, true)
  assert.equal(rows[0].children, undefined)
  assert.deepEqual(categoryDescendants(rows, 'floor'), ['floor', 'room'])
})
test('tree search retains ancestors and their hierarchy without dropping matching descendants', () => {
  const tree = categoryTree(rows)
  const matches = filterCategoryTree(tree, 'room')
  assert.equal(matches.length, 1)
  assert.equal(matches[0].children[0].children[0].key, 'room')
  assert.equal(filterCategoryTree(tree, 'missing').length, 0)
  assert.deepEqual(filterCategoryTree(tree, 'Building')[0].children, tree[0].children)
  assert.deepEqual(filterCategoryTree(tree, ''), tree)
})
