import { computed, onBeforeUnmount, ref, inject, watch, type Ref } from 'vue'
import { queryConfig } from '../api/patrol'
import type { ConfigEntity } from '../api/types'
import { categoryTree } from '../model/categories'
/** 完整分页读取当前授权分类，失败时不以半棵树继续操作。每个页面拥有独立请求生命周期。 */
export function useCategories(source?: Ref<ConfigEntity[] | undefined>) {
  const project = inject<Ref<string | undefined> | undefined>('patrolEditorProject', undefined)
  const fetched = ref<ConfigEntity[]>([]), loading = ref(false), failed = ref(false)
  const rows = computed(() => source?.value ?? fetched.value)
  let generation = 0
  async function load() {
    const current = ++generation
    // 分类编辑直接复用页面已授权的完整树，不能受尚未填写的表单项目阻断。
    if (source?.value !== undefined) return
    if (project && !project.value) { fetched.value = []; loading.value = false; return }
    loading.value = true; failed.value = false
    try {
      const result: ConfigEntity[] = []
      let pageIndex = 0
      while (true) {
        const response = await queryConfig('categories', { pageIndex, pageSize: 200, sorts: [{ name: 'name', order: 'asc' }, { name: 'id', order: 'asc' }] }, project?.value)
        if (current !== generation) return
        if (!response.success) throw new Error('categories')
        result.push(...response.result.data)
        if (result.length >= response.result.total) break
        if (!response.result.data.length) throw new Error('categories')
        pageIndex++
      }
      fetched.value = result
    } catch {
      if (current === generation) { fetched.value = []; failed.value = true }
    } finally {
      if (current === generation) loading.value = false
    }
  }
  if (project) watch(project, () => { fetched.value = []; void load() })
  onBeforeUnmount(() => { generation++ })
  return { rows, tree: computed(() => categoryTree(rows.value)), loading, failed, load }
}
