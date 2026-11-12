# Cloud Patrol UI · 巡更 PC 管理端

Vue3/TypeScript 的 JetLinks **runtime-ui 应用模块**，不是单独登录的后台。复用宿主请求、应用上下文、ConditionFilter、ProTable 和权限按钮，不注册第二个路由器或 Axios 客户端。后端在 `项目/property-management/modules/property-patrol`，由 `services/property-patrol-service` 独立启动。

## 页面与交互

- 分类、点位、检查标准、岗位人员、排班、巡更计划：条件查询、分页、只读详情和独立编辑副本；配置停用代替物理删除。
- 标准：维护数值/文本/选项/图像四类检查项，支持精确上下限、合格选项、参考说明、必填、必需图片和例图上传/替换/预览；上传未完成时不能保存。历史任务保留标准快照。
- 规则：七天时段、指定日期覆盖、周期/次数及冷却配置，不用 JSON 输入框代替规则编辑器。日期覆盖为空表示休巡，删除覆盖后恢复星期规则。
- 任务：按计划和业务日期预览/手动生成，展示岗位、时窗、已巡/应巡和随时钟更新的状态。
- 执行记录：条件查询、整体及逐题判定、参考范围与答案快照、例图和提交图片的受控预览，不提供管理端任意修改执行事实的入口。
- 完成统计：显式日期范围刷新，查询真实应巡/已巡、达标时段与逾期缺巡次数，不以零值或旧范围结果冒充加载成功。

资源选择器使用远程搜索、已选项回显、防抖和过期响应丢弃。表格加载/空态由宿主负责，动作失败保留输入。业务时间显示采用 UTC+08:00，与后端 Asia/Shanghai 一致。

**不包含小程序或 PC 模拟打卡界面。** 也不包含集团模板、标签、批量导入导出、二维码图片、地图、排班日历、APP 现场拍摄采集、离线补传、漏检申报审批、预警配置、人员评价或集团报表。不要将这九个管理页面视为旧系统全功能等价替换。业务契约和接口见后端 README。文本/图片及未配置合格规则的题目保持未判定，旧记录不回算；完成次数不等于合格次数。

## 目录

- `api/`：共享请求封装与明确的实体/分页/规则类型。
- `model/`：资源权限映射、编辑副本、枚举提交值、时间和状态规则。
- `composables/`：请求与页面状态编排。
- `components/`：配置编辑、标准/频次编辑、远程选择器等复用组件。
- `views/patrol/`：九个业务页面。
- `index.ts`、`baseMenu.ts/json`、`locales/lang/`：宿主模块、菜单与双语注册入口。

## 接入 runtime-ui

正式位置为 `runtime-ui/modules/cloud-patrol-ui`，推荐按宿主已有 Git 子模块管理方式接入。宿主自动发现模块入口、菜单和字典。此仓库的库构建产物**不能**直接当成完整 SaaS 前端发布目录。

挂载到宿主后，使用宿主锁文件和依赖环境。执行模块构建时需包含认证模块，确保应用入口和路由页面同时参与构建：

```bash
# 在 runtime-ui 根目录，使用其约定的 pnpm 版本。
pnpm --filter jetlinks-web-core build -- --module-name cloud-patrol-ui,authentication-manager-ui
pnpm exec vue-tsc -p modules/cloud-patrol-ui/tsconfig.json --noEmit
node --test modules/cloud-patrol-ui/tests/*.test.mjs
```

`baseMenu` 的根及叶子均为 `owner: app`，`options.appName` 为 `cloud-patrol`。业务页面显式声明 `accessSupport: support` 和 `assetTypes`，岗位菜单同时声明 `patrolPost` / `user`，使模板编辑器能够配置人员查询的数据范围；六类配置使用 `SELECT_AND_BIND`，人员使用 `SELECT`。按菜单管理流程增量导入，不全量初始化覆盖其他业务菜单。模板及项目应用创建步骤见后端 `deploy/patrol/authentication-patrol-application.yml` 和 README。源码菜单不是自动授权，已持久化的菜单或模板也不会只因改源码自动更新。

图片通过巡更附件 API 复用平台文件服务，只保存业务附件 ID；每题最多一张，支持 JPEG/PNG/WebP、最大5MB，错误时保留原附件以便重试。标准/任务/记录菜单声明 `patrolAttachment` 与 `patrol-attachment:query`，标准保存动作另含 `patrol-attachment:save`；CloudPatrol 模板同步新增附件资产 `SELECT_AND_BIND`。已存在环境须增量更新菜单、模板、订阅和应用授权，重启不会自动补齐。PC 上传不能证明现场拍摄，APP 相机/水印和真机验收仍属后续范围。

必须从 SaaS 项目的巡更应用入口进入。宿主负责身份、项目、网关地址和 `X-Asset-Scope`；不要把应用 ID 当项目 ID，也不要另外加自签 token。前端按钮用菜单键 `patrol/tasks:generate`，映射后端资源 `patrol-task:generate`，并要求关联计划的资产 save 权限。

## 当前多仓工作目录下的开发

`tsconfig.json` 面向正式宿主目录；`tsconfig.workspace.json` 适配当前 `园区sass/项目/智能巡更/` 到 `sass平台/cloud.jetlinks/runtime-ui/` 的位置，引用**真实宿主源码**。移动目录后必须相应调整，不能用伪造声明替代宿主类型。

可以临时链接宿主 `node_modules` 做只读依赖复用；该链接已忽略，不应提交。共享链接存在时不要在巡更目录运行可能自动安装/清理依赖的包管理器命令，避免影响正在工作的宿主。可直接调用已经安装的工具：

```bash
node --test tests/*.test.mjs
node node_modules/vite/bin/vite.js build
node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.workspace.json
```

独立 Vite 命令只检查模块编译及产物生成，宿主依赖外置；不能据此宣称宿主完整打包、浏览器交互、真实网关和权限联调已经通过。全量类型检查会同时检查导入的宿主源码，必须区分诊断归属，但不能忽略这些错误并宣称全量通过。模块 `tsconfig.json` 将 Vue 类型解析到宿主 `node_modules/vue`，避免子模块的独立依赖副本导致模板 ref 类型身份不一致；多仓开发使用 `tsconfig.workspace.json` 中对应的宿主路径。此设置只约束类型解析，实际发布仍使用宿主构建与依赖版本。

测试约束包含菜单/页面/后端权限/模板的契约对齐、双语 key、Vue 代理编辑副本、枚举值、任务时窗及业务时区。真实接入还必须检查分页筛选、候选人员、编辑清空字段、只读角色、生成后刷新、快照详情、跨项目/应用拒绝及失败重试。

跨仓契约测试读取 `property-management/modules/property-patrol` 中的真实后端源码。支持 SaaS 聚合布局 `cloud.jetlinks/modules/property-management` 和本地 `项目/property-management`；其他布局设置 `PATROL_BACKEND_ROOT=/absolute/path/to/property-management`（指向物业仓库根目录）。不再读取旧独立巡更后端仓库。未检出后端会明确失败，不用复制接口快照或跳过断言掩盖缺失依赖。
