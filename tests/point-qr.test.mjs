import test from 'node:test'
import assert from 'node:assert/strict'
import { pointQrValue, pointQrFilename } from '../model/point-qr.ts'
test('QR identity remains stable across point name/code edits and does not use NFC', () => {
  assert.equal(pointQrValue({ id: 'point-uuid', name: 'Before', code: 'A', nfcCode: 'hardware' }), 'point-uuid')
  assert.equal(pointQrValue({ id: 'point-uuid', name: 'After', code: 'B' }), 'point-uuid')
  assert.equal(pointQrFilename({ name: '../水泵:房', code: 'A/1' }), '.._水泵_房-A_1.png')
})
