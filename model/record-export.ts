export interface RecordExportStatus {
  id: string
  state: 'running' | 'ready' | 'failed'
  processedGroups: number
  totalGroups: number
  errorCode?: string
}

/** 生成耗时不设页面倒计时上限；只有后台明确失败或请求失败才结束等待。 */
export async function waitForRecordExport(
  initial: RecordExportStatus,
  readStatus: (id: string) => Promise<RecordExportStatus>,
  progress?: (status: RecordExportStatus) => void,
  delay: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 1500)),
): Promise<string> {
  let status = initial
  for (;;) {
    progress?.(status)
    if (status.state === 'failed') throw new Error(status.errorCode || 'error.patrol_record_export_failed')
    if (status.state === 'ready') return status.id
    await delay()
    status = await readStatus(status.id)
  }
}
