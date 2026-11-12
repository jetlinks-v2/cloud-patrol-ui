import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { getApplicationRuntimeEntry } from '@jetlinks-web-core/utils'

/** 打开独立登录页，不读取或传递 PC 登录凭证。日历入口默认隐藏。 */
export function useMobileEntry() {
  const { t } = useI18n()
  function openMobile() {
    const applicationId = getApplicationRuntimeEntry().applicationId
    if (!applicationId) { message.warning(t('Patrol.mobileEntryRequiresApplication')); return }
    const url = new URL('/patrol-h5/', window.location.origin)
    url.searchParams.set('applicationScope', applicationId)
    window.open(url.href, '_blank', 'noopener,noreferrer')
  }
  return { openMobile }
}
