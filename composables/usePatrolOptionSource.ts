import { queryConfig } from '../api/patrol'
import type { Resource, Term } from '../api/types'
/** 宿主选项源没有请求头扩展点；保留公共筛选编辑器，仅用巡更传输层加载候选。 */
export function patrolOptionSource(resource: Resource) {
  async function load(terms: Term[], pageIndex = 0, pageSize = 12) {
    const response = await queryConfig(resource, { terms, pageIndex, pageSize,
      sorts: [{ name: 'name', order: 'asc' }, { name: 'id', order: 'asc' }] })
    if (!response.success) throw new Error('Unable to load patrol options')
    return response.result.data
  }
  return {
    loadOptions: (keyword = '', params: { pageIndex?: number; pageSize?: number } = {}) => load(
      keyword.trim() ? [{ column: 'name', termType: 'like', value: `%${keyword.trim()}%` }] : [], params.pageIndex, params.pageSize),
    loadSelectedOptions: (values: string[] = []) => values.length ? load([{ column: 'id', termType: 'in', value: values }], 0, Math.min(200, values.length)) : Promise.resolve([]),
  }
}
