import { onMounted, onScopeDispose, ref, type Ref } from 'vue'
import type { MobileTask } from '../model'
import { host } from '../transport'
import { scanCamera } from './camera'

/** 扫码、重新校验任务、选择岗位；每次重试独立取消，旧响应不能打开新页面。 */
export function usePointScanner(video: Ref<HTMLVideoElement | undefined>,
  resolve: (raw: string) => Promise<MobileTask[]>, select: (row: MobileTask) => void) {
  const matches = ref<MobileTask[]>([]), busy = ref(false), error = ref(''), scanning = ref(false)
  let operation: AbortController | undefined
  function fail(cause: unknown) {
    const name = cause instanceof Error ? cause.name : ''
    error.value = name === 'NotAllowedError' || name === 'SecurityError' ? 'Mobile.scanPermission'
      : name === 'NotFoundError' || name === 'NotReadableError' ? 'Mobile.scanCameraUnavailable'
      : cause instanceof Error && cause.message.startsWith('Mobile.') ? cause.message : 'Mobile.scanFailed'
    scanning.value = false; busy.value = false
  }
  async function accept(raw: string, current: AbortController) {
    if (current.signal.aborted) return
    scanning.value = false; busy.value = true
    try {
      const rows = await resolve(raw)
      if (current.signal.aborted) return
      matches.value = rows
      if (rows.length === 1) select(rows[0])
      else if (!rows.length) error.value = 'Mobile.scanNoTask'
    } catch (cause) { if (!current.signal.aborted) fail(cause) }
    finally { if (!current.signal.aborted) busy.value = false }
  }
  async function start() {
    operation?.abort()
    const current = operation = new AbortController()
    matches.value = []; error.value = ''; busy.value = false; scanning.value = true
    try {
      if (host.scanQrCode) {
        const raw = await host.scanQrCode({ signal: current.signal })
        if (current.signal.aborted) return
        if (raw === null) { scanning.value = false; error.value = 'Mobile.scanCancelled' }
        else await accept(raw, current)
      } else if (video.value) {
        await scanCamera(video.value, current.signal, raw => { void accept(raw, current) },
          cause => { if (!current.signal.aborted) fail(cause) })
      } else fail(new Error('Mobile.scanUnsupported'))
    } catch (cause) { if (!current.signal.aborted) fail(cause) }
  }
  function hidden() {
    if (document.hidden && scanning.value && !host.scanQrCode) {
      operation?.abort(); scanning.value = false; error.value = 'Mobile.scanPaused'
    }
  }
  onMounted(() => { document.addEventListener('visibilitychange', hidden); void start() })
  onScopeDispose(() => { operation?.abort(); document.removeEventListener('visibilitychange', hidden) })
  return { matches, busy, scanning, error, start }
}
