import { ref } from 'vue'
/** 业务项目筛选与 SaaS 应用/技术项目上下文分开；服务端仍校验已授权树。 */
export const patrolProject = ref<string | undefined>(new URLSearchParams(location.search).get('patrolProjectId') || undefined)
