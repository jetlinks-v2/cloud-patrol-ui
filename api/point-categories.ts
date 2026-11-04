import { request } from '@jetlinks-web/core'
export const changePointCategory = (action: 'link' | 'cancel', pointIds: string[], categoryId: string) =>
  request.post(`/park/patrol/point-categories/${action}`, { pointIds, categoryId })
