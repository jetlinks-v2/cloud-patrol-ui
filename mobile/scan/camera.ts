import type jsQR from 'jsqr'
type Decoder = typeof jsQR
interface CameraEnvironment {
  secure: boolean
  media?: Pick<MediaDevices, 'getUserMedia'>
  canvas(): HTMLCanvasElement
  decoder(): Promise<Decoder>
}
const browserEnvironment = (): CameraEnvironment => ({
  secure: window.isSecureContext, media: navigator.mediaDevices,
  canvas: () => document.createElement('canvas'),
  decoder: async () => (await import('jsqr')).default,
})

/** 关闭、后台化或卸载立即释放镜头；晚到的授权也必须停止，不能重启已取消的扫描。 */
export async function scanCamera(video: HTMLVideoElement, signal: AbortSignal,
  found: (value: string) => void, failed: (cause: unknown) => void,
  environment: CameraEnvironment = browserEnvironment()): Promise<void> {
  let stream: MediaStream | undefined, timer: ReturnType<typeof setTimeout> | undefined
  let stopped = signal.aborted
  const stop = () => {
    stopped = true; clearTimeout(timer)
    stream?.getTracks().forEach(track => track.stop())
    video.pause(); video.srcObject = null
    signal.removeEventListener('abort', stop)
  }
  if (stopped) return
  signal.addEventListener('abort', stop, { once: true })
  try {
    if (!environment.secure) throw new Error('Mobile.scanHttps')
    if (!environment.media?.getUserMedia) throw new Error('Mobile.scanUnsupported')
    // 解码库先加载，失败时不申请或占用摄像头。
    const decode = await environment.decoder()
    if (stopped) return
    stream = await environment.media.getUserMedia({ audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } })
    if (stopped) { stream.getTracks().forEach(track => track.stop()); return }
    video.srcObject = stream
    await video.play()
    if (stopped) return
    const canvas = environment.canvas(), context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Mobile.scanUnsupported')
    const frame = () => {
      if (stopped) return
      try {
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight))
          canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale)
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
          const result = decode(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })
          if (result?.data) { stop(); found(result.data); return }
        }
        timer = setTimeout(frame, 180)
      } catch (cause) { stop(); failed(cause) }
    }
    frame()
  } catch (cause) { const active = !stopped; stop(); if (active) failed(cause) }
}
