import type { PatrolRule, RuleWindow } from '../api/types'

export interface RuleSummaryRow {
  days: number[]
  date?: string
  windows: RuleWindow[]
}

/** 合并相同的星期规则仅用于展示；指定日期（含停巡）仍逐条保留。 */
export function ruleSummaryRows(rule?: PatrolRule): RuleSummaryRow[] {
  if (!rule) return []
  const weekly = new Map<string, RuleSummaryRow>()
  for (let day = 1; day <= 7; day++) {
    const windows = rule.weekly?.[day] ?? []
    if (!windows.length) continue
    const key = JSON.stringify(windows)
    const row = weekly.get(key)
    if (row) row.days.push(day)
    else weekly.set(key, { days: [day], windows })
  }
  return [...weekly.values(), ...Object.entries(rule.dates ?? {}).sort(([a], [b]) => a.localeCompare(b))
    .map(([date, windows]) => ({ days: [], date, windows }))]
}

/** 24:00 表示当日结束；小于开始的结束分钟按既有跨天规则展示。 */
export function ruleWindowTime(window: RuleWindow) {
  const format = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
  return { start: format(window.startMinute), end: format(window.endMinute), nextDay: window.endMinute < window.startMinute }
}
