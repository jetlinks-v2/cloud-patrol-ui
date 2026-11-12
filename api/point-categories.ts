import { request } from './request'
export const changePointCategory = (action: 'link' | 'cancel', pointIds: string[], categoryId: string) =>
  request.post(`/park/patrol/point-categories/${action}`, { pointIds, categoryId })
