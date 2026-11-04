import type { Term } from '../api/types'

/** 旧列表的“已申报”包含已通过、驳回及撤回的历史申请；不等同于当前待审。 */
export function groupMissedTerm(value: 'pending' | 'applied') {
  return {
    column: 'id',
    termType: 'patrol-group-missed',
    value: value === 'pending' ? { status: 'pending' } : { 'applicationId$notnull': true },
  } satisfies Term
}
