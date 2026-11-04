import { ref, shallowRef } from 'vue'
import { request as host, type Request } from '@jetlinks-web/core'
const request: Pick<Request, 'get'> = host
import { findOrganization, projectTree, type OrganizationNode } from '../model/projects'

const tree = shallowRef<OrganizationNode[]>([])
const selected = ref<string>()
const revision = ref(0)
let generation = 0
const loading = ref(false), failed = ref(false)
/** 只保存当前界面筛选，不缓存授权；每次进入页面重新读取已过滤树，服务端逐请求校验。 */
export function useProjects() {
  async function load() {
    const current = ++generation
    loading.value = true; failed.value = false
    try {
      const response = await request.get<OrganizationNode[]>('/park/patrol/projects/_tree')
      if (current !== generation) return
      if (!response.success) throw new Error('project tree failed')
      tree.value = response.result
      const node = findOrganization(tree.value, selected.value)
      if (selected.value && (!node || projectTree([node])[0].disabled)) select(undefined)
    } catch {
      if (current === generation) { failed.value = true; tree.value = []; select(undefined) }
    } finally { if (current === generation) loading.value = false }
  }
  function select(value?: string) {
    const node = findOrganization(tree.value, value)
    if (value && (!node || projectTree([node])[0].disabled)) return
    if (value !== selected.value) { selected.value = value; revision.value++ }
  }
  return { tree, selected, revision, loading, failed, load, select }
}
export function selectedProject() { return selected.value }
