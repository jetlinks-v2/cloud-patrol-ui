import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { getApplicationRuntimeEntry, getProjectCodeFromPathname, isProjectStorageEnabled } from '@jetlinks-web-core/utils'
import { selectedProject } from './useProjects'

/** 同源打开手机页，只传上下文标识；登录凭证继续由现有会话读取。 */
export function useMobileEntry() {
  const { t } = useI18n()
  function openMobile() {
    const applicationId = getApplicationRuntimeEntry().applicationId
    if (!applicationId) { message.warning(t('Patrol.mobileEntryRequiresApplication')); return }
    const url = new URL('/patrol-h5/', window.location.origin)
    url.searchParams.set('applicationScope', applicationId)
    // 请求层按当前路径读取会话；固定项目构建配置不能替代应用路径上的登录会话。
    const projectCode = isProjectStorageEnabled() ? getProjectCodeFromPathname() : ''
    if (projectCode) url.searchParams.set('projectCode', projectCode)
    const project = selectedProject()
    if (project) url.searchParams.set('patrolProjectId', project)
    window.open(url.href, '_blank', 'noopener,noreferrer')
  }
  return { openMobile }
}
