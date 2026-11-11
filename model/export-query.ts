import type { Query } from '../api/types'

/** 勾选只收窄当前筛选范围；服务端仍负责项目与资产授权。 */
export function selectedExportQuery(query: Query, ids: string[]): Query {
  if (!ids.length) return query
  return { ...query, terms: [
    ...(query.terms?.length ? [{ terms: query.terms, type: 'and' }] : []),
    { column: 'id', termType: 'in', value: [...new Set(ids)] },
  ] }
}
