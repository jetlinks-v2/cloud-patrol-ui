import type { ConfigEntity } from '../api/types'

/** 空数组表示全部关系已取消；只有未提供投影的旧响应才读取初始分类。 */
export function pointCategoryIds(point: ConfigEntity): string[] {
  return [...new Set(point.categoryIds ?? (point.categoryId ? [point.categoryId] : []))]
}

export function commonPointCategories(points: ConfigEntity[]): string[] {
  const first = points[0] ? pointCategoryIds(points[0]) : []
  return first.filter(id => points.every(point => pointCategoryIds(point).includes(id)))
}

/** 批量操作只选择共同分类；多分类时保留选择步骤，不以初始分类猜测目标。 */
export function initialPointCategory(points: ConfigEntity[], preferred?: string): string | undefined {
  const common = commonPointCategories(points)
  return preferred && common.includes(preferred) ? preferred : common.length === 1 ? common[0] : undefined
}
