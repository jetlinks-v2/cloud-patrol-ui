import { ref, onScopeDispose } from 'vue'
import { uploadImage, previewImage } from '../api/patrol'

/** 请求和竞态留在编排层；保存的是受控附件 ID，不保存带凭证的临时 URL。 */
export function usePatrolImage(onUploaded: (id: string) => void) {
  const uploading = ref(false), loading = ref(false), failed = ref(false), dataUrl = ref('')
  let requestVersion = 0, disposed = false
  onScopeDispose(() => { disposed = true; requestVersion++ })
  async function upload(file: File) {
    const version = ++requestVersion
    uploading.value = true
    failed.value = false
    try {
      const response = await uploadImage(file)
      if (disposed || version !== requestVersion) return
      if (!response.success) { failed.value = true; return }
      dataUrl.value = ''
      onUploaded(response.result.id)
    } catch { if (!disposed && version === requestVersion) failed.value = true }
    finally { if (!disposed && version === requestVersion) uploading.value = false }
  }
  async function preview(id: string) {
    const version = ++requestVersion
    loading.value = true
    failed.value = false
    try {
      const response = await previewImage(id)
      if (disposed || version !== requestVersion) return
      if (response.success) dataUrl.value = response.result.dataUrl
      else failed.value = true
    } catch { if (!disposed && version === requestVersion) failed.value = true }
    finally { if (!disposed && version === requestVersion) loading.value = false }
  }
  function reset() { requestVersion++; dataUrl.value = ''; uploading.value = false; loading.value = false; failed.value = false }
  return { uploading, loading, failed, dataUrl, upload, preview, reset }
}
