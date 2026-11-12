import test from 'node:test'
import assert from 'node:assert/strict'
import { draftOf } from '../model/resources.ts'
import { changeItemType, standardError, itemType, enumValue, answerIsAbnormal } from '../model/standards.ts'
const legacy = () => ({ id: 'lock', title: 'Lock', required: true, options: ['normal', 'abnormal'] })
test('deployed choice standards edit without changing originals and use their first option as normal', () => {
  const source = { name: 'Safety', enabled: true, items: [legacy()] }
  const draft = draftOf('standards', source)
  assert.equal(draft.items[0].type, 'choice')
  assert.deepEqual(draft.items[0].qualifiedOptions, ['normal'])
  assert.equal(source.items[0].type, undefined)
  assert.equal(itemType({ ...legacy(), type: null }), 'choice')
  assert.equal(enumValue(null), undefined)
  draft.items[0].options.push('other')
  assert.equal(source.items[0].options.length, 2)
})
test('changing item type removes hidden choice rules and numeric limits', () => {
  const numeric = changeItemType({ ...legacy(), qualifiedOptions: ['normal'] }, 'number')
  assert.deepEqual(numeric.options, [])
  assert.deepEqual(numeric.qualifiedOptions, [])
  const text = changeItemType({ ...numeric, lowerLimit: '0.2', upperLimit: '0.4' }, 'text')
  assert.equal(text.lowerLimit, null)
  assert.equal(text.upperLimit, null)
  assert.equal(itemType({ ...text, type: { value: 'image', text: 'Image' } }), 'image')
})
test('standard validation handles typed options, invalid ranges, duplicate items and high precision', () => {
  const number = { ...changeItemType(legacy(), 'number'), lowerLimit: '0.2', upperLimit: '0.4' }
  assert.equal(standardError([number]), undefined)
  assert.equal(standardError([{ ...number, lowerLimit: '0.5' }]), 'Patrol.invalidLimits')
  assert.equal(standardError([{ ...number, lowerLimit: '999999999999999999', upperLimit: '999999999999999998' }]), 'Patrol.invalidLimits')
  assert.equal(standardError([{ ...number, lowerLimit: '-0.2', upperLimit: '-0.1' }]), undefined)
  assert.equal(standardError([{ ...legacy(), qualifiedOptions: ['unknown'] }]), 'Patrol.invalidOptions')
  assert.equal(standardError([legacy(), legacy()]), 'Patrol.duplicateItems')
  assert.equal(standardError([]), 'Patrol.standardItemsRequired')
  assert.equal(standardError([{ ...legacy(), title: '项'.repeat(200) }]), undefined)
  assert.equal(standardError([{ ...legacy(), title: '项'.repeat(201) }]), 'Patrol.itemTitleRequired')
})

test('original choice convention uses the first snapshot option, ignoring former passing selections', () => {
  const choice = { ...legacy(), qualifiedOptions: ['abnormal'] }
  assert.equal(answerIsAbnormal(choice, { value: 'normal' }), false)
  assert.equal(answerIsAbnormal(choice, { value: 'abnormal' }), true)
  assert.equal(answerIsAbnormal({ ...choice, options: ['abnormal', 'normal'] }, { value: 'normal' }), true)
  assert.equal(answerIsAbnormal(choice), false)
})
test('numeric answers mark only values outside inclusive snapshot limits, preserving precision', () => {
  const number = { ...changeItemType(legacy(), 'number'), lowerLimit: '-0.2', upperLimit: '0.4' }
  for (const value of ['-0.20000', '0.4', '+0.400']) assert.equal(answerIsAbnormal(number, { value }), false)
  for (const value of ['-0.200000000000000001', '0.400000000000000001']) assert.equal(answerIsAbnormal(number, { value }), true)
  assert.equal(answerIsAbnormal({ ...number, lowerLimit: '999999999999999998', upperLimit: '999999999999999999' }, { value: '999999999999999997' }), true)
  assert.equal(answerIsAbnormal({ ...number, lowerLimit: null, upperLimit: null }, { value: '100' }), false)
  assert.equal(answerIsAbnormal(number, { value: 'old invalid value' }), false)
})
test('text, image and blank optional answers remain plain content rather than failed checks', () => {
  for (const type of ['text', 'image']) assert.equal(answerIsAbnormal(changeItemType(legacy(), type), { value: 'any content' }), false)
  assert.equal(answerIsAbnormal(legacy(), { value: '' }), false)
})
