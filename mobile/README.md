# 巡更 H5

与 PC 共用 `cloud-patrol-ui` 仓库、巡更后端、数据库和权限。手机入口独立构建，不加载 SaaS 桌面布局，不创建新的业务应用或服务。

## 本版功能

- 巡更点位：首页按原小程序展示“全员 / 我的”、分类与名称筛选、五列点位网格和状态图例；小于360px时采用四列。只展示当前时间窗，点位详情保留对应岗位与任务，避免同一点位有多个任务时随意提交。
- “我的”显示本人岗位；“全员”显示当前有权访问计划的点位，其他岗位任务可查看但不可提交。点位可巡、冷却中、已完成使用真实任务状态，无资格、停用或非班次保持不可执行。
- 检查：使用任务保存的标准快照填写选项、精确数值、文本、图片；支持参考说明、范围和例图。
- 提交：校验必填及必需图片，后台重新校验成员、资产权限、岗位、班次、时间、次数和冷却间隔。
- 我的记录：按提交日期查询本人记录，分页查看答案、整体和逐项判定、图片及备注。提交写入现有执行记录表，PC 查询同一份记录。
- 上传：现有巡更证据附件 API，JPEG/PNG/WebP、单张最大5MB，每项一张；文件选择不能证明现场拍摄。

本版不接扫码、NFC、定位、离线自动补传或正式 APP Bridge。普通输入草稿只保留在页面会话；待确认提交另外保存在当前标签页的 sessionStorage，刷新后可恢复原请求号和请求体，须手动重试。切换项目/应用/用户会阻止继续提交，不把旧用户的待确认请求带给新用户。

## 开发与构建

在本仓库使用宿主已有依赖，链接共享 node_modules 时不要执行安装或清理依赖操作：

```bash
node node_modules/vite/bin/vite.js --config vite.mobile.config.ts
node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.mobile.json
node --test tests/*.test.mjs
node node_modules/vite/bin/vite.js build --config vite.mobile.config.ts
```

也提供 `dev:mobile`、`typecheck:mobile`、`build:mobile` scripts。生产产物 `dist-mobile/` 与 PC 模块产物分开。

本机 H5 Vite 使用 9301；9300 的**本地临时** Vite 配置将 `/patrol-h5` 代理到 9301，页面与现有 PC 登录保持同源。H5 API 走 9300，复用原有代理：巡更到本地8502，其他请求到测试网关。9301 不作为日常登录入口，否则浏览器存储不同源。

```text
http://localhost:9300/patrol-h5/?projectCode=项目入口编码&applicationScope=巡更业务应用ID
```

先在同一浏览器、同一域名登录巡更所属 SaaS 应用，再打开上面的地址。`projectCode` 是宿主入口的存储编码，用于读取已有 `project_编码` 会话，不代表园区业务项目或租户 ID；平台应用的会话可以没有租户域名。仅在使用 SaaS 平台统一登录会话时可省略 `projectCode`，仍需 `applicationScope`。显式指定入口但缺少其登录会话时拒绝访问，不回退其他账号。`applicationScope` 是真实业务应用 ID，不是模板 ID。查询参数只选择上下文，不能代替后端的应用成员及资产授权；不接受 URL token、用户 ID 或任意 API 地址。

## 权限

`baseMenu.json` 在现有“巡更记录”菜单中增加 `mobile`（手机巡更）授权项，不增加 PC 业务菜单。部署模板 `authentication-patrol-application.yml` 对应声明该项：

| 用途 | 功能权限 |
| --- | --- |
| 点位任务、分类筛选 | `patrol-task:query`、`patrol-category:query` |
| 我的记录、图片预览 | `patrol-execution:query`、`patrol-attachment:query`（记录菜单已有） |
| 提交结果 | `patrol-execution:submit` |
| 上传图片 | `patrol-attachment:save` |

另外必须授予当前应用中的 `patrolPlan`、`patrolCategory`、`patrolAttachment`、`user` 资产范围，并具备当前应用成员身份、岗位指派和适用班次；已有租户边界由 SaaS 管理，巡更不强制应用绑定租户。查询权限与提交权限分开；没有手机授权的只读用户仍不能提交。

已有环境需要增量同步巡更模块的菜单、模板和应用/角色授权。仅重启后端不会更新已持久化配置。不需要修改 SaaS 平台源码或应用布局。

## 部署

将 `dist-mobile/` 内容部署到现有运行前端站点的 `/patrol-h5/` 目录，并继续复用该站点已有的 `/api` 网关代理。静态入口使用相对当前站点的同源 API；宿主保存的项目 `apiUrl` 如为跨域地址，需在部署时提供同源代理或由 APP 适配器处理，页面会拒绝把会话令牌直接发到任意其他站点。

需要更新巡更后端以提供以下两个只读接口，原提交与附件接口不变：

```text
POST /park/patrol/mobile/tasks/_query    { "date": "2026-11-03", "mine": true }
POST /park/patrol/mobile/history/_query  标准 QueryParamEntity
```

任务按业务时区 Asia/Shanghai 查询与所选自然日重叠的时段；记录按接收时间筛选。任务读取最多1000个可访问计划/1000条当日任务，超限返回业务错误；记录分页每页最多50条。后端强制本人记录及计划资产范围，调用方 OR 条件不能扩大范围。

## 后续 APP 接入

当前 APP 尚无已确认的 Bridge。`transport.ts` 的 `PatrolHost` 只是巡更侧的接入契约：宿主在加载 H5 模块前提供 `window.patrolHost`，实现 `context()` 与 `request(path, method, body)`。

- `context()` 返回服务器会话对应的 `userId`、`projectId`、`applicationId`，可附项目名称；每次请求前重新核对身份一致性。
- `request()` 仅接收巡更相对路径，负责现有认证、项目/应用头、JSON 或 FormData 上传，返回已解包的业务结果，并保留失败状态。
- 正式 APP 必须确认登录态传递、WebView 存储隔离、multipart 上传、登录过期和真机行为后再实现适配器。当前不把这个接口命名为平台已有原生 API。

### WebView 适配约定

- HTML 保留 `viewport-fit=cover`，页面处理 iOS 安全区；Android 宿主应把 WebView 放在系统栏以内，或提供 CSS 变量 `--patrol-app-safe-top` / `--patrol-app-safe-bottom`，单位 px。已经由原生容器留白时传0，避免重复内边距。
- 320–359px 使用四列，360px以上使用五列；点位名称允许换行，卡片不使用固定宽高比挤压长名称。
- 检查、点位、记录页面写入浏览器历史。APP 的原生返回先调用 WebView 的 `canGoBack/goBack`；提交中或结果待确认时，页面阻止退回丢失请求。宿主如果直接销毁整个 WebView，必须先与页面协商，不能靠浏览器事件阻止原生强制关闭。
- H5 首页的返回可由可选 `PatrolHost.back()` 交给原生容器关闭；没有适配器时回退浏览器历史。
- 有 VisualViewport 时检测软键盘，输入期间将提交按钮移入文档流，避免固定按钮压住输入区。旧 WebView 使用窗口 resize 回退；保留 100vh 作为不支持 100dvh 时的高度回退。
- 请求超时使用 AbortController，不依赖较新的 AbortSignal.timeout。上线使用 HTTPS。图片选择器及权限弹窗由原生 WebView 容器承接，iOS/WKWebView、Android WebView 均须真机确认；浏览器验证不能代替这一步。

本地构建和隔离的 UI 测试不能替代真实项目会话与 APP 真机验收。
