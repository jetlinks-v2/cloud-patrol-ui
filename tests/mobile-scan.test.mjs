import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { inflateSync } from 'node:zlib'
import jsQR from 'jsqr'
import { matchScannedTasks, scannedPointId } from '../mobile/scan/match.ts'
import { scanCamera } from '../mobile/scan/camera.ts'

const fixture = JSON.parse(await readFile(new URL('./fixtures/point-qr-pixels.json', import.meta.url), 'utf8'))
const gray = inflateSync(Buffer.from(fixture.grayDeflate, 'base64'))
function pixels(inverted = false, rotated = false) {
  const data = new Uint8ClampedArray(gray.length * 4), n = fixture.width
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const offset = (y * n + x) * 4, value = gray[rotated ? (n - x - 1) * n + y : y * n + x]
    data.fill(inverted ? 255 - value : value, offset, offset + 3); data[offset + 3] = 255
  }
  return { data, width: n, height: n }
}
const row = (id, changes = {}) => ({ executable: true, reason: '', task: {
  id, pointId: fixture.value, startTime: 100, endTime: 200, requiredCount: 2, completedCount: 0, ...changes,
} })
test('QR from real PC download decodes in normal, inverted and rotated camera frames', () => {
  for (const variant of [[false, false], [true, false], [false, true]]) {
    const image = pixels(...variant)
    assert.equal(jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })?.data, fixture.value)
  }
})
test('scan preserves multiple posts, exact identity, current time and authoritative eligibility', () => {
  const a = row('a'), b = row('b'), denied = { ...row('denied'), executable: false }
  const rows = [a, b, a, denied, row('completed', { completedCount: 2 }), row('future', { startTime: 151 }),
    row('ended', { endTime: 150 }), row('other', { pointId: 'other-point' })]
  assert.deepEqual(matchScannedTasks(` ${fixture.value} `, rows, 150).map(r => r.task.id), ['a', 'b'])
  assert.deepEqual(matchScannedTasks('missing', rows, 150), [])
  assert.equal(matchScannedTasks(fixture.value, [a], 100).length, 1)
  assert.equal(matchScannedTasks(fixture.value, [a], 200).length, 0)
  for (const value of ['', 'https://example.com/' + fixture.value, '{"pointId":"x"}', '../x', 'x'.repeat(129)])
    assert.throws(() => scannedPointId(value), /Mobile.scanInvalid/)
})
function camera(options = {}) {
  let stops = 0, requests = 0, plays = 0
  const stream = { getTracks: () => [{ stop: () => { stops++ } }] }
  const video = { readyState: 2, videoWidth: 260, videoHeight: 260, srcObject: null,
    async play() { plays++ }, pause() {} }
  const environment = { secure: true,
    media: { async getUserMedia() { requests++; return options.pending || stream } },
    decoder: async () => jsQR,
    canvas: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => pixels() }) }),
    ...options.environment,
  }
  return { stream, video, environment, counts: () => ({ stops, requests, plays }) }
}
test('camera decodes a real PC frame once and releases all resources before returning result', async () => {
  const c = camera(), controller = new AbortController(), found = []
  await scanCamera(c.video, controller.signal, value => {
    assert.equal(c.video.srcObject, null); assert.equal(c.counts().stops, 1); found.push(value)
  }, cause => assert.fail(String(cause)), c.environment)
  controller.abort()
  assert.deepEqual(found, [fixture.value]); assert.equal(c.counts().stops, 1)
})
test('cancel while permission is pending stops the late camera without playing or accepting a frame', async () => {
  let permit
  const pending = new Promise(resolve => { permit = resolve }), c = camera({ pending })
  const controller = new AbortController()
  const running = scanCamera(c.video, controller.signal, () => assert.fail('late QR'), () => assert.fail('cancel error'), c.environment)
  await Promise.resolve(); controller.abort(); permit(c.stream); await running
  assert.deepEqual(c.counts(), { stops: 1, requests: 1, plays: 0 })
  assert.equal(c.video.srcObject, null)
})
test('already aborted, insecure and unsupported environments never request camera access', async () => {
  const controller = new AbortController(); controller.abort()
  const c = camera()
  await scanCamera(c.video, controller.signal, () => assert.fail(), () => assert.fail(), c.environment)
  assert.equal(c.counts().requests, 0)
  for (const [change, expected] of [[{ secure: false }, 'Mobile.scanHttps'], [{ media: undefined }, 'Mobile.scanUnsupported']]) {
    const c = camera({ environment: change }), errors = []
    await scanCamera(c.video, new AbortController().signal, () => assert.fail(), cause => errors.push(cause.message), c.environment)
    assert.deepEqual(errors, [expected]); assert.equal(c.counts().requests, 0)
  }
})
test('camera permission rejection is reported once without leaving a stream attached', async () => {
  const denied = new DOMException('denied', 'NotAllowedError'), errors = []
  const c = camera({ environment: { media: { async getUserMedia() { throw denied } } } })
  await scanCamera(c.video, new AbortController().signal, () => assert.fail(), cause => errors.push(cause), c.environment)
  assert.deepEqual(errors, [denied]); assert.equal(c.video.srcObject, null)
})
