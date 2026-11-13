import { ref, shallowRef, onScopeDispose } from 'vue'
import { useI18n } from 'vue-i18n'
import { queryConfig } from '../api/patrol'
import type { ConfigEntity, Query } from '../api/types'
import { pointQrFilename } from '../model/point-qr'
/** 二维码预览和当前条件批量打印；沿用标准点位查询权限，超限不静默截断。 */
export function usePointQr() {
  const { t } = useI18n()
  const printing = ref(false), downloading = ref(false), visible = ref(false), loading = ref(false), failed = ref(false), tooMany = ref(false)
  const rows = shallowRef<ConfigEntity[]>([])
  let version = 0, printFrame: HTMLIFrameElement | undefined
  let printUrls: string[] = []
  function clearPrint() {
    printFrame?.remove(); printFrame = undefined
    printUrls.forEach(url => URL.revokeObjectURL(url)); printUrls = []
  }
  function close() { version++; visible.value = false; loading.value = false; rows.value = []; clearPrint() }
  onScopeDispose(close)
  async function open(source: ConfigEntity | Query) {
    const current = ++version
    visible.value = true; failed.value = false; tooMany.value = false; rows.value = []
    if ('name' in source) { loading.value = false; rows.value = [source as ConfigEntity]; return }
    loading.value = true
    try {
      const response = await queryConfig('points', { ...source, pageIndex: 0, pageSize: 500 })
      if (current !== version) return
      if (!response.success) { failed.value = true; return }
      if (response.result.total > 500) { tooMany.value = true; return }
      rows.value = response.result.data
    } catch { if (current === version) failed.value = true }
    finally { if (current === version) loading.value = false }
  }
  async function render(point: ConfigEntity, card: HTMLElement | undefined): Promise<Blob> {
    const svg = card?.querySelector('.ant-qrcode svg') ?? card?.querySelector('svg'); if (!svg) throw new Error('QR not ready')
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }))
    try {
      const image = new Image(); image.src = url; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1520
      const context = canvas.getContext('2d'); if (!context) throw new Error('canvas unavailable')
      context.scale(2, 2)
      context.fillStyle = '#fff'; context.fillRect(0, 0, 600, 760); context.drawImage(image, 50, 20, 500, 500)
      // 下载和打印与弹窗使用相同的项目、点位信息；长名称换行，不挤压二维码留白。
      context.textAlign = 'left'; context.font = '22px sans-serif'
      const labelWidth = Math.max(context.measureText(t('Patrol.projects.label')).width, context.measureText(t('Patrol.point')).width)
      const valueX = 40 + labelWidth + 20, valueWidth = 560 - valueX
      for (const [index, [label, value]] of [
        [t('Patrol.projects.label'), point.projectName || '—'],
        [t('Patrol.point'), point.name],
      ].entries()) {
        const y = 570 + index * 90
        context.fillStyle = '#666'; context.fillText(label, 40, y)
        context.fillStyle = '#1f2329'
        const lines: string[] = []; let line = ''
        for (const char of value) {
          if (context.measureText(line + char).width > valueWidth) { lines.push(line); line = char } else line += char
        }
        if (line) lines.push(line)
        lines.slice(0, 2).forEach((text, lineIndex) => context.fillText(text + (lineIndex === 1 && lines.length > 2 ? '…' : ''), valueX, y + lineIndex * 32, valueWidth))
      }
      return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('QR image failed')), 'image/png'))
    } finally { URL.revokeObjectURL(url) }
  }
  function saveBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function download(point: ConfigEntity, card: HTMLElement | undefined) {
    if (downloading.value) return
    const current = version
    downloading.value = true; failed.value = false
    try {
      const blob = await render(point, card)
      if (current === version) saveBlob(blob, pointQrFilename(point))
    } catch { if (current === version) failed.value = true }
    finally { downloading.value = false }
  }
  /** 一次ZIP下载避免浏览器拦截多文件；加入点位ID避免同名文件覆盖。 */
  async function downloadAll(cards: HTMLElement | undefined) {
    if (!cards || downloading.value || !rows.value.length) return
    const current = version, points = [...rows.value], elements = cards.querySelectorAll<HTMLElement>('.qr-card')
    downloading.value = true; failed.value = false
    try {
      const { zipSync } = await import('fflate')
      const files: Record<string, Uint8Array> = {}
      for (const [index, point] of points.entries()) {
        if (current !== version) return
        const image = await render(point, elements[index])
        files[`${index + 1}-${point.id}-${pointQrFilename(point)}`] = new Uint8Array(await image.arrayBuffer())
      }
      if (current === version) saveBlob(new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' }), '巡更点位二维码.zip')
    } catch { if (current === version) failed.value = true }
    finally { downloading.value = false }
  }
  /** 打印复用下载图片，避开 AntD 二维码外层固定200px与放大SVG相互覆盖。 */
  async function print(cards: HTMLElement | undefined) {
    if (!cards || !rows.value.length || printing.value) return
    const current = version, points = [...rows.value]
    const elements = cards.querySelectorAll<HTMLElement>('.qr-card')
    printing.value = true; failed.value = false
    clearPrint()
    try {
      const images: Blob[] = []
      for (const [index, point] of points.entries()) images.push(await render(point, elements[index]))
      if (current !== version) return
      printFrame = document.createElement('iframe')
      printFrame.setAttribute('aria-hidden', 'true'); printFrame.tabIndex = -1
      printFrame.style.cssText = 'position:fixed;width:0;height:0;border:0;'
      document.body.appendChild(printFrame)
      const doc = printFrame.contentDocument, target = printFrame.contentWindow
      if (!doc || !target) throw new Error('print document unavailable')
      doc.title = '巡更点位二维码'
      const style = doc.createElement('style')
      style.textContent = '@page{size:A4;margin:20mm}body{margin:0;width:170mm}.qr-print-page{width:170mm;height:250mm;display:flex;align-items:center;justify-content:center;break-inside:avoid;break-after:page}.qr-print-page:last-child{break-after:auto}.qr-print-page img{display:block;width:130mm;height:auto;max-height:240mm;object-fit:contain}'
      doc.head.appendChild(style)
      const ready: Promise<void>[] = []
      for (const blob of images) {
        const page = doc.createElement('section'), image = doc.createElement('img')
        page.className = 'qr-print-page'
        const url = URL.createObjectURL(blob); printUrls.push(url)
        image.src = url; page.appendChild(image); doc.body.appendChild(page)
        ready.push(image.decode())
      }
      await Promise.all(ready)
      if (current === version) { target.focus(); target.print() }
    } catch { if (current === version) failed.value = true }
    finally { printing.value = false }
  }

  return { visible, loading, failed, tooMany, rows, printing, downloading, open, close, download, downloadAll, print }
}
