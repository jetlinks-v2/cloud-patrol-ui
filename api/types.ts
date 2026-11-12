export type Resource = 'categories' | 'points' | 'standards' | 'posts' | 'rosters' | 'plans'
export interface EnumValue<T extends string = string> {
  value: T
  text: string
}
export type RosterPolicy = 'optional' | 'required'
export interface RuleWindow {
  startMinute: number
  endMinute: number
  intervalMinutes: number
  requiredCount: number
}
export interface PatrolRule {
  weekly: Record<string, RuleWindow[]>
  dates: Record<string, RuleWindow[]>
  cooldownMinutes: number
}
export interface CheckItem {
  id: string
  title: string
  required: boolean
  options: string[]
  type?: ItemType | EnumValue<ItemType> | null
  lowerLimit?: string | number | null
  upperLimit?: string | number | null
  referenceText?: string
  qualifiedOptions?: string[]
  photoRequired?: boolean
  exampleFileId?: string | null
}
export type ItemType = 'number' | 'text' | 'choice' | 'image'
export type CheckResult = 'pass' | 'fail' | 'not_evaluated'
export interface AttachmentReceipt { id: string; name: string; mediaType: string; length: number }
export interface ConfigEntity {
  id?: string
  name: string
  enabled: boolean
  description?: string
  parentId?: string
  code?: string
  categoryId?: string
  location?: string
  nfcCode?: string
  items?: CheckItem[]
  userIds?: string[]
  postId?: string
  businessDate?: string
  userId?: string
  startTime?: number
  endTime?: number
  pointId?: string
  standardId?: string
  effectiveFrom?: string
  effectiveTo?: string
  rosterPolicy?: RosterPolicy | EnumValue<RosterPolicy>
  rule?: PatrolRule
}
export interface Task {
  id: string
  name: string
  planId: string
  pointId: string
  pointName: string
  postName: string
  businessDate: string
  startTime: number
  endTime: number
  requiredCount: number
  completedCount: number
  standardSnapshot: CheckItem[]
}
export interface Answer {
  itemId: string
  value?: string | null
  attachmentId?: string | null
}
export interface Execution {
  id: string
  taskId: string
  planId: string
  pointName: string
  userName: string
  receiveTime: number
  remark?: string
  answers: Answer[]
  standardSnapshot: CheckItem[]
  result?: CheckResult | EnumValue<CheckResult> | null
  itemResults?: { itemId: string; result: CheckResult | EnumValue<CheckResult> }[]
}
export interface Person {
  id: string
  name: string
}
export interface Term {
  column?: string
  termType?: string
  value?: unknown
  type?: string
  terms?: Term[]
}
export interface Query {
  pageIndex?: number
  pageSize?: number
  paging?: boolean
  terms?: Term[]
  sorts?: { name: string; order: string }[]
}
export interface Page<T> {
  data: T[]
  total: number
  pageIndex: number
  pageSize: number
}
