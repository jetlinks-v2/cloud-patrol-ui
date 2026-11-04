import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('../model/projects.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
const { projectTree, findOrganization } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
test('项目树只允许标注项目节点选择，普通组织和外协保留层级且禁用', () => {
  const tree = [{ id: 'A', name: 'A', children: [
    { id: 'B', name: 'B', organizationType: { value: 'project', text: '项目' } },
    { id: 'C', name: 'C', organizationType: 'project' },
    { id: 'D', name: 'D', children: [{ id: 'E', name: 'E', organizationType: 'project' }] },
    { id: 'X', name: 'X', organizationType: 'external' },
  ] }]
  const [root] = projectTree(tree)
  assert.equal(root.disabled, true)
  assert.equal(root.selectable, false)
  assert.deepEqual(root.children.map(node => [node.value, node.disabled]), [['B', false], ['C', false], ['D', true], ['X', true]])
  assert.equal(root.children[2].children[0].selectable, true)
  assert.equal(findOrganization(tree, 'E').name, 'E')
  assert.equal(findOrganization(tree, 'hidden'), undefined)
  assert.equal(projectTree(tree, false)[0].selectable, true)
})
test('空权限树保持空，不能补出不可见组织或项目', () => assert.deepEqual(projectTree([]), []))
