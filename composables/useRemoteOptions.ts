import { ref, watch, onBeforeUnmount, type Ref } from 'vue'
import { queryConfig, queryPeople } from '../api/patrol'
import type { Resource, Term } from '../api/types'
/** 远程候选保留已选项，搜索防抖并丢弃过期响应，避免快速输入时回显串页。 */
export function useRemoteOptions(
  resource: Resource | 'persons',
  value: Ref<string | string[] | undefined>
) {
  const options = ref<{ label: string; value: string }[]>([])
  const loading = ref(false),
    failed = ref(false)
  let generation = 0,
    timer: ReturnType<typeof setTimeout> | undefined
  async function load(keyword = '', selected = false) {
    const current = ++generation
    loading.value = true
    failed.value = false
    const ids = Array.isArray(value.value) ? value.value : value.value ? [value.value] : []
    const terms: Term[] = selected
      ? [{ column: 'id', termType: 'in', value: ids }]
      : keyword
      ? [{ column: 'name', termType: 'like', value: `%${keyword}%` }]
      : []
    try {
      const query = { pageSize: 200, pageIndex: 0, terms, sorts: [{ name: 'name', order: 'asc' }] }
      const response =
        resource === 'persons' ? await queryPeople(query) : await queryConfig(resource, query)
      if (current !== generation) return
      if (!response.success) {
        failed.value = true
        return
      }
      const merged = new Map(
        options.value
          .filter((option) => ids.includes(option.value))
          .map((option) => [option.value, option])
      )
      response.result.data.forEach((row) => {
        if (row.id) merged.set(row.id, { value: row.id, label: row.name })
      })
      options.value = [...merged.values()]
    } catch {
      if (current === generation) failed.value = true
    } finally {
      if (current === generation) loading.value = false
    }
  }
  function search(keyword: string) {
    clearTimeout(timer)
    timer = setTimeout(() => void load(keyword), 250)
  }
  watch(
    value,
    () => {
      const ids = Array.isArray(value.value) ? value.value : value.value ? [value.value] : []
      if (ids.some((id) => !options.value.some((option) => option.value === id)))
        void load('', true)
    },
    { immediate: true }
  )
  onBeforeUnmount(() => {
    clearTimeout(timer)
    generation++
  })
  return { options, loading, failed, search, load }
}
