# Nova Pocket

基于 UniApp + Vue 3 的通用移动端用户中心。项目从公开演示 v7 整理而来。
https://nova-pocket-account-demo.mingyueshi.chatgpt.site/

## 快速启动

使用 Node.js 22.13+（22.x）或 24 及以上版本，在 nova-pocket 目录执行以下命令。

```bash
npm ci
npm run dev:h5
```

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

## 接入自己的登录与消息

`src/adapters/index.js` 导出 `auth` 和 `messages`。可以分别替换，页面只调用这两个接口。内置的 `createHttpAdapters` 可对接已有请求客户端。以下写法放在适配器入口，保留文件中现有的 `config` 导入和 `demoSettingsEnabled` 导出。

```js
import { createHttpAdapters } from './http.js'
import { request } from './my-request.js' // 接入方自己的请求函数

export const { auth, messages } = createHttpAdapters(request)
```

请求函数签名为 `request(method, path, body?)`，负责 API 地址、平台凭据和错误转换，成功时返回解包后的数据，失败时抛出带可展示消息的 `Error`。示例路径集中在 `src/adapters/http.js`。方法可以同步返回或返回 Promise。

| 接口 | 输入及返回 |
| --- | --- |
| `auth.getSession()` | 当前用户 `{ id, nickname, mode? }` 或访客 `null`。`mode` 可选 `member / incomplete` |
| `auth.login(form)` | `{ account, method, password }` 或 `{ account, method, code }`，返回当前用户。方法值为 `password / code` |
| `auth.sendCode({ account, purpose })` | 用途为 `login / register / recover`。可返回 `{ hint }` 提示用户下一步 |
| `auth.register(form)`、`auth.recover(form)` | 两者接收 `account / password / code`。注册另含 `nickname` 并返回已登录用户。找回成功后回到登录页 |
| `auth.updateProfile({ nickname })`、`auth.logout()` | 更新返回保存后的用户；退出成功后清除当前账户和收件箱 |
| `messages.list()` | 当前用户的完整消息数组。每项含字符串 `id / title / date / body` 和布尔值 `read`。列表、详情及角标共用此数据 |
| `messages.markRead(ids)` | 接收字符串 ID 数组，同一 ID 可重复提交。成功后更新角标，失败时保留未读并支持重试 |

本地演示适配器包含专用的示例邮箱与验证码。接入自己的认证适配器后，表单会将凭据交给该适配器，并隐藏演示填充按钮。

## 详情链接与演示状态

订单、评价和消息通过视图类型与记录 ID 定位。H5 可以打开、收藏或分享下列地址，小程序可使用同样的页面路径和参数。

- 订单 `/#/pages/account/detail?view=order&id=NP-1042`
- 评价 `/#/pages/account/detail?view=review&id=NP-1038`
- 消息 `/#/pages/account/detail?view=message&id=welcome`

小程序页面路径以 `/pages/account/detail` 开头。详情页刷新后仍打开同一示例记录，昵称、登录状态、已读和提交的评价随新演示会话重置。

## 校验

```bash
npm run lint
npm test
npm run icons:check
```

图标名单在 `src/icons.js`。更新 Lucide 或调整图标名单后，运行 `npm run icons:sync` 生成色调变体，并提交对应资源。

## 项目结构

- `src/pages/index/index.vue` 管理概览、服务、消息和我的四个底栏入口。`src/pages/account/` 注册详情与资料编辑页面。
- `src/pages/auth/`：登录、注册和找回，公共表单在 `src/components/AuthScreen.vue`。
- `src/components/Service*.vue`：订单、统计图表与评论演示。
- `src/account-data.js` 管理会话和收件箱。`src/adapters/demo.js` 与 `src/service-demo.js` 提供默认示例数据。
- `src/static/icons/LICENSE.txt`：Lucide 图标许可。

最初归档标注的上游源码基线为 `07ba6ab98d4e29cefbc96227ad0dc4951fef1a9b`。原 Git 历史未随归档导入，提交哈希需在上游仓库核对。
