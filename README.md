# Nova Pocket

基于 UniApp + Vue 3 的通用移动端用户中心。项目从公开演示 v7 整理而来。
https://nova-pocket-account-demo.mingyueshi.chatgpt.site/

## 快速启动

使用 Node.js 22.13+（22.x）或 24 及以上版本，在 nova-pocket 目录执行以下命令。

```bash
npm ci
npm run dev:h5
```

第一次接入自己的产品，可以先运行「青禾书房」示例。它换了品牌、调整了底栏顺序、关闭了订单和评价，并通过本地 HTTP 服务登录、同步消息和查询当前读者的借阅记录。[运行与接入步骤](examples/reading-room/README.md)

## 构建

```bash
npm run build:h5
npm run build:mp-weixin
```

H5 产物在 `dist/build/h5`。微信小程序产物在 `dist/build/mp-weixin`，可导入微信开发者工具预览。项目未配置正式小程序 AppID，真机预览或发布时按需配置自己的 AppID。Android 返回确认、侧滑及 WXSS 表现请在目标微信真机上验收。

## 换品牌与导航

修改 `src/pocket.config.js` 后重新启动开发服务或构建。默认配置保留四个底栏入口、三个业务模块和应用内演示设置。

| 配置 | 用途 |
| --- | --- |
| `brand.name`、`brand.subtitle`、`brand.logo` | 品牌名称、H5 标题副标题、可选 Logo。将图片放入 `src/static/`，路径写成 `/static/brand.png` |
| `defaultTheme`、`defaultLayout` | 默认主题选 `blue / teal / dark`，首页布局选 `overview / shortcuts / minimal` |
| `tabs` | 内置入口的键、显示名称和图标。可以删除或重排，首个可用入口是默认页，至少需保留一项 |
| `shortcuts` | 首页快捷入口的目标、名称、图标和说明，已关闭的目标会自动隐藏 |
| `modules` | 订单 `orders`、评价 `reviews`、统计 `stats` 各自的入口文案、图标与 `enabled` 开关。设置 `requiresLogin: true` 可要求访客登录，详情直达同样生效 |
| `demoSettings` | 是否展示演示控制页。只有登录和消息都使用演示适配器时才开放 |

例如，将 `modules.reviews.enabled` 改为 `false`，订单详情中的评价按钮会一同隐藏，已有评价链接会显示返回账户中心的入口。关闭全部服务会移除服务底栏。三个模块的界面分别参与条件编译，订单与评价共用示例订单数据。构建命令也会把品牌标题同步到 UniApp 的 `manifest.json` 和 `pages.json`，其他平台参数仍在这两个文件中配置。

### 添加自己的服务页面

青禾书房通过一项入口配置注册「我的借阅」页面。借阅接口和加载逻辑归示例项目维护，下游可按相同方式添加预约、课程等服务。[入口配置](examples/reading-room/src/pocket.config.js) · [完整借阅页面](examples/reading-room/src/pocket-services/loans/index.vue)

1. 在 `src/pocket.config.js` 的 `modules` 中添加服务。键用作长期分享标识，`page` 指向 `src/pocket-services/` 下的相对路径，省略 `.vue` 后缀。

   ```js
   loans: {
     enabled: true, label: '我的借阅', icon: 'layers', description: '查看在借与已归还的图书',
     requiresLogin: true, page: 'loans/index',
   }
   ```

2. 新建 `src/pocket-services/loans/index.vue`。在页面的 `<script setup>` 中调用 `useServicePage()`，将返回的 `target` 传给 `<ServicePage :target="target">`，在其默认插槽里放业务内容。`target.id` 为空时显示列表，点击一条记录时调用 `openRecord(id)`，ID 使用非空字符串。详情可通过 `:shareable="!!record"` 开启分享按钮。微信页面还需在页面本身调用 `onShareAppMessage(shareMessage)`，具体写法见完整借阅页面。

重新启动开发服务或构建后，框架会在 `pages.json` 的 `pocket-services` 分包中注册启用的页面。该分包由配置生成，其他分包可照常维护。每个服务使用独立的页面路径，服务键请避开内置视图名。

H5 的「复制详情链接」与微信分享使用相同的站内路径，例如 `/pages/account/detail?view=loans&id=BR-1038`。模板根据服务键查找当前页面，所以移动页面文件后旧分享仍然有效。访客登录后会返回原记录。关闭模块或移除服务底栏后，原分享会显示「页面不可用」。`requiresLogin` 管理前端展示，接入个人业务数据时，后端还需按当前用户校验记录归属。

## 接入自己的登录与消息

`src/adapters/index.js` 导出 `auth` 和 `messages`。可以分别替换，页面只调用这两个接口。内置的 `createHttpAdapters` 可对接已有请求客户端。以下写法放在适配器入口，保留文件中现有的 `config` 导入和 `demoSettingsEnabled` 导出。

```js
import { createHttpAdapters } from './http.js'
import { request } from './my-request.js' // 接入方自己的请求函数

export const { auth, messages } = createHttpAdapters(request)
```

请求函数签名为 `request(method, path, body?)`，负责 API 地址、平台凭据和错误转换，成功时返回解包后的数据，失败时抛出带可展示消息的 `Error`，并保留 HTTP 状态码 `statusCode`、`status` 或 `response.status`。示例路径集中在 `src/adapters/http.js`。方法可以同步返回或返回 Promise。

| 接口 | 输入及返回 |
| --- | --- |
| `auth.getSession()` | 当前用户 `{ id, nickname, mode? }` 或访客 `null`。`mode` 可选 `member / incomplete` |
| `auth.login(form)` | `{ account, method, password }` 或 `{ account, method, code }`，返回当前用户。方法值为 `password / code` |
| `auth.sendCode({ account, purpose })` | 用途为 `login / register / recover`。可返回 `{ hint }` 提示用户下一步 |
| `auth.register(form)`、`auth.recover(form)` | 两者接收 `account / password / code`。注册另含 `nickname` 并返回已登录用户。找回成功后回到登录页 |
| `auth.updateProfile({ nickname })`、`auth.logout()` | 更新返回保存后的用户；退出成功后清除当前账户和收件箱 |
| `messages.list()` | 当前用户的完整消息数组。每项含字符串 `id / title / date / body` 和布尔值 `read`。列表、详情及角标共用此数据 |
| `messages.markRead(ids)` | 接收字符串 ID 数组，同一 ID 可重复提交。成功后更新角标，失败时保留未读并支持重试 |

### 会话与返回页面

首次打开及从后台回到前台时，应用会调用 `auth.getSession()`。已登录用户变成访客，或受保护的接口返回 HTTP 401 / `code: 'SESSION_EXPIRED'` 时，应用会清除该会话的消息和角标，提示重新登录。网络错误可在原页重试。登录表单收到的 401 会显示为凭据错误。

从访客快捷入口、消息详情或过期提示进入认证时，登录、注册和找回页会携带目标视图、记录 ID 和底栏来源。登录页刷新后仍可恢复目标。只接受当前配置中可用的站内页面。

### 游标分页

完整数组适配器可以继续使用。启用分页时，在 `createHttpAdapters(request, { paginatedMessages: true })` 中传入第二个参数，或为自己的消息适配器提供以下方法。

| 方法 | HTTP 示例与约定 |
| --- | --- |
| `listPage({ cursor, limit })` | `GET /messages?limit=20&cursor=…`。首页省略 cursor。返回 `{ items, nextCursor, unreadCount }`，末页的游标为 `null`，未读数覆盖整个收件箱 |
| `get(id)` | `GET /messages/:id`。返回含正文的消息，找不到时返回 `null` 或抛出 404。分享链接可直接打开尚未加载到列表的记录 |
| `markRead(ids)` | `POST /messages/read`，请求体为 `{ ids }`。成功后同步详情、列表和底栏角标 |
| `markAllRead()` | `POST /messages/read-all`。作用于该用户的全部消息，包括尚未加载的页。两种已读操作均应支持重复调用，成功响应可返回最新的 `{ unreadCount }` |

“加载更多”追加下一页，失败时保留现有列表并重试原游标。“只看未读”筛选已加载的记录，可继续翻页。“刷新”重新读取首页和全局未读数。

本地演示适配器包含专用的示例邮箱与验证码。接入自己的认证适配器后，表单会将凭据交给该适配器，并隐藏演示填充按钮。

## 详情链接与演示状态

订单、评价和消息通过视图类型与记录 ID 定位。H5 可以打开、收藏或分享下列地址，小程序可使用同样的页面路径和参数。

- 订单 `/#/pages/account/detail?view=order&id=NP-1042`
- 评价 `/#/pages/account/detail?view=review&id=NP-1038`
- 消息 `/#/pages/account/detail?view=message&id=welcome`

小程序页面路径以 `/pages/account/detail` 开头。内置演示共用一个虚构账号，其昵称、登录或退出状态和消息已读记录保存在本机，演示登录有效期为 7 天。密码与验证码仅用于当前表单和校验。可以在「我的 → 演示设置」重置演示数据。订单评价仍按本次运行保存。

## 校验

```bash
npm run lint
npm test
npm run icons:check
```

图标名单在 `src/icons.js`。更新 Lucide 或调整图标名单后，运行 `npm run icons:sync` 生成色调变体，并提交对应资源。

CI 另会构建青禾书房的 H5 和微信小程序产物，在 Chromium 中运行关键页面验收，并检查微信构建是否正确裁剪关闭的模块。[本地复现方法](examples/reading-room/README.md#双端验收)

## 项目结构

- `src/pages/index/index.vue` 管理概览、服务、消息和我的四个底栏入口。`src/pages/account/` 注册详情与资料编辑页面。
- `src/pages/auth/`：登录、注册和找回，公共表单在 `src/components/AuthScreen.vue`。
- `src/components/Service*.vue`：订单、统计图表与评论演示。
- `src/account-data.js` 管理会话，`src/inbox.js` 管理收件箱分页和已读同步。`src/adapters/demo.js` 与 `src/service-demo.js` 提供默认示例数据。
- `src/static/icons/LICENSE.txt`：Lucide 图标许可。

## 许可与来源

项目源码按 MIT 许可证提供，版权署名为 `mingyueshi`。复制或分发本项目时请保留版权与许可声明。[项目许可证](LICENSE)

图标来自 Lucide，分发时请一并保留图标许可文件，其中包含 Lucide 的 ISC 许可和源自 Feather 的图标所适用的 MIT 声明。[图标许可证](src/static/icons/LICENSE.txt)

最初导入的 `Nova-Pocket-v7-source.zip` 标注基线为 `07ba6ab98d4e29cefbc96227ad0dc4951fef1a9b`。归档未附原始 Git 历史。对照本仓库的导入提交 `b225183`，归档内 107 个文件中有一处差异，为 `.gitignore` 的忽略规则。
