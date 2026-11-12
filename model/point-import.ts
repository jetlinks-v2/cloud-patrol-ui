import type { PointImportRow } from '../api/points'

/** 错误表保留原始行号；所有单元格按文本输出，避免用户填入的公式被表格软件执行。 */
export function pointImportErrorsCsv(rows: PointImportRow[], headers: string[], errorText: (code: string) => string): string {
  const cell = (value: string | number) => {
    const text = String(value)
    const safe = /^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }
  const values = rows.filter(row => row.errors.length).map(row => [row.rowNumber, row.categoryName,
    row.name, row.location, row.errors.map(errorText).join('；')])
  return '\uFEFF' + [headers, ...values].map(row => row.map(cell).join(',')).join('\r\n')
}
