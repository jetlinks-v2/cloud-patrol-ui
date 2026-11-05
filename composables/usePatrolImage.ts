import { ref, computed, onScopeDispose, inject, type Ref } from 'vue'
import { uploadImage, previewImage } from '../api/patrol'

/** 请求和竞态留在编排层；保存的是受控附件 ID，不保存带凭证的临时 URL。 */
export function usePatrolImage(onUploaded: (id: string) => void) {
  const project = inject<Ref<string | undefined> | undefined>('patrolAttachmentProject', undefined)
  const uploading = ref(false), loading = ref(false), failed = ref(false), dataUrl = ref('')
  const projectMissing = computed(() => !!project && !project.value)
  let requestVersion = 0, disposed = false, currentId: string | null | undefined, localUrl: string | undefined
  function clearLocalImage() {
    if (localUrl) URL.revokeObjectURL(localUrl)
    localUrl = undefined
  }
  onScopeDispose(() => { disposed = true; requestVersion++; clearLocalImage() })
  async function upload(file: File) {
    // 未选项目属于表单未完成，由项目提示引导，不显示为网络上传失败。
    if (projectMissing.value) { failed.value = false; return }
    const version = ++requestVersion
    uploading.value = true
    failed.value = false
    try {
      const response = await uploadImage(file, 'example', project?.value)
      if (disposed || version !== requestVersion) return
      if (!response.success) { failed.value = true; return }
      clearLocalImage()
      localUrl = URL.createObjectURL(file)
      dataUrl.value = localUrl
      currentId = response.result.id
      onUploaded(response.result.id)
    } catch { if (!disposed && version === requestVersion) failed.value = true }
    finally { if (!disposed && version === requestVersion) uploading.value = false }
  }
  async function preview(id: string) {
    const version = ++requestVersion
    loading.value = true
    failed.value = false
    try {
      const response = await previewImage(id, project?.value)
      if (disposed || version !== requestVersion) return
      if (response.success) { clearLocalImage(); dataUrl.value = response.result.dataUrl; currentId = id }
      else failed.value = true
    } catch { if (!disposed && version === requestVersion) failed.value = true }
    finally { if (!disposed && version === requestVersion) loading.value = false }
  }
  function reset() { requestVersion++; clearLocalImage(); currentId = undefined; dataUrl.value = ''; uploading.value = false; loading.value = false; failed.value = false }
  // 上传回执同步给父表单时保留本次缩略图；切换为其他附件才清理旧预览。
  function syncFile(id?: string | null) { if (id !== currentId) { reset(); currentId = id } }
  return { uploading, loading, failed, dataUrl, projectMissing, upload, preview, reset, syncFile }
}
