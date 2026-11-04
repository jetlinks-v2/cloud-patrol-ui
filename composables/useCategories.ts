import { computed, onBeforeUnmount, ref } from 'vue'
import { queryConfig } from '../api/patrol'
import type { ConfigEntity } from '../api/types'
import { categoryTree } from '../model/categories'
/** 完整分页读取当前授权分类，失败时不以半棵树继续操作。每个页面拥有独立请求生命周期。 */
export function useCategories() {
  const rows = ref<ConfigEntity[]>([]), loading = ref(false), failed = ref(false)
  let generation = 0
  async function load() {
    const current = ++generation
    loading.value = true; failed.value = false
    try {
      const result: ConfigEntity[] = []
      let pageIndex = 0
      while (true) {
        const response = await queryConfig('categories', { pageIndex, pageSize: 200, sorts: [{ name: 'name', order: 'asc' }, { name: 'id', order: 'asc' }] })
        if (current !== generation) return
        if (!response.success) throw new Error('categories')
        result.push(...response.result.data)
        if (result.length >= response.result.total) break
        if (!response.result.data.length) throw new Error('categories')
        pageIndex++
      }
      rows.value = result
    } catch {
      if (current === generation) { rows.value = []; failed.value = true }
    } finally {
      if (current === generation) loading.value = false
    }
  }
  onBeforeUnmount(() => { generation++ })
  return { rows, tree: computed(() => categoryTree(rows.value)), loading, failed, load }
}
