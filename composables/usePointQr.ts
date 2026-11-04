import { ref, shallowRef, onScopeDispose } from 'vue'
import { queryConfig } from '../api/patrol'
import type { ConfigEntity, Query } from '../api/types'
import { pointQrFilename } from '../model/point-qr'
/** 二维码预览和当前条件批量打印；沿用标准点位查询权限，超限不静默截断。 */
export function usePointQr() {
  const visible = ref(false), loading = ref(false), failed = ref(false), tooMany = ref(false)
  const rows = shallowRef<ConfigEntity[]>([])
  let version = 0, printFrame: HTMLIFrameElement | undefined
  function close() { version++; visible.value = false; loading.value = false; rows.value = []; printFrame?.remove(); printFrame = undefined }
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
  async function download(point: ConfigEntity, card: HTMLElement | undefined) {
    const svg = card?.querySelector('svg'); if (!svg) return
    failed.value = false
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }))
    try {
      const image = new Image(); image.src = url; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 760
      const context = canvas.getContext('2d'); if (!context) throw new Error('canvas unavailable')
      context.fillStyle = '#fff'; context.fillRect(0, 0, 600, 760); context.drawImage(image, 50, 20, 500, 500)
      context.fillStyle = '#000'; context.textAlign = 'center'; context.font = '24px sans-serif'
      // 两行点位名和一行编码；避免长名称越出图片边缘。
      const chars = [...point.name]; const lines: string[] = []; let line = ''
      for (const char of chars) {
        if (context.measureText(line + char).width > 540) { lines.push(line); line = char } else line += char
      }
      if (line) lines.push(line)
      lines.slice(0, 2).forEach((value, index) => context.fillText(value + (index === 1 && lines.length > 2 ? '…' : ''), 300, 570 + index * 36, 540))
      context.fillText(point.code || '', 300, 680, 540)
      const anchor = document.createElement('a'); anchor.download = pointQrFilename(point); anchor.href = canvas.toDataURL('image/png'); anchor.click()
    } catch { failed.value = true } finally { URL.revokeObjectURL(url) }
  }
  function print(cards: HTMLElement | undefined) {
    if (!cards || !rows.value.length) return
    printFrame?.remove(); printFrame = document.createElement('iframe')
    printFrame.setAttribute('aria-hidden', 'true'); printFrame.tabIndex = -1
    printFrame.style.cssText = 'position:fixed;width:0;height:0;border:0;'
    document.body.appendChild(printFrame)
    const doc = printFrame.contentDocument, target = printFrame.contentWindow
    if (!doc || !target) { failed.value = true; return }
    const style = doc.createElement('style')
    style.textContent = '@page{size:A4;margin:20mm}body{font:20px sans-serif}.qr-card{height:240mm;break-after:page;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;overflow-wrap:anywhere}.qr-card:last-child{break-after:auto}svg{width:100mm;height:100mm}.qr-card button{display:none}'
    doc.head.appendChild(style)
    // cloneNode 复制 Vue 已转义的名称与 SVG，不拼接用户输入到 HTML 或脚本。
    for (const card of Array.from(cards.querySelectorAll('.qr-card'))) doc.body.appendChild(card.cloneNode(true))
    target.focus(); target.print()
  }
  return { visible, loading, failed, tooMany, rows, open, close, download, print }
}
