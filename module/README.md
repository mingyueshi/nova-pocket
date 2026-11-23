# Nova Pocket 用户中心模块

在已有的 Vue 3 UniApp 项目中，把账户中心放进原生「我的」底栏。首次接入只需要读出当前会员，之后可以单独启用消息、资料编辑或业务入口。

## 安装到已有项目

在含 `src/pages.json` 的宿主根目录运行。收到候选附件时，用附件里的实际文件名替换命令中的包名。

```sh
npm exec --offline --yes --package=./nova-pocket-module-0.1.2.tgz -- install-nova-pocket .
```

安装器只写入 `src/uni_modules/nova-pocket/`。将下面的接线放在宿主自己的文件中。升级时使用新版包再次运行安装命令并重新构建，模块目录会整体替换。

## 第一步，用现有会员登录「我的」

下面假设「我的」和登录页分别在 `src/pages/mine/index.vue` 和 `src/pages/member/login.vue`，宿主的 `src/member.js` 已提供会话读取和登录操作。用自己项目实际的路径和函数名替换它们。

**1. 新增两个文件**。`src/pocket.config.js` 填宿主品牌和路由。页面路径以 `/` 开头，`tabs` 只声明账户中心使用的 `mine`。首页等其他原生底栏继续由宿主管理。

```js
export default {
  brand: { name: '港湾会员' },
  defaultTheme: 'teal',
  defaultLayout: 'minimal',
  host: { accountTab: '/pages/mine/index', loginPage: '/pages/member/login' },
  tabs: [['mine', '我的', 'user-round']],
  blocks: { mine: ['identity', { type: 'menu', title: '通知', entries: ['messages'] }] },
  shortcuts: [],
  modules: {},
}
```

`src/adapters/index.js` 暴露两个命名导出。宿主的 `getSession()` 返回 `{ id, nickname }` 或访客值 `null`，也可以返回 Promise。

```js
import { getSession } from '../member.js'

export const auth = { getSession }
export const messages = null
```

**2. 注册页面与构建插件**。在 `src/pages.json` 的已有 `pages` 数组中追加详情页。保留原生底栏配置，并把「我的」页的 `style` 也设为 `{"navigationStyle":"custom","disableScroll":true}`，由账户中心绘制标题和处理滚动。登录页须注册为可携带回跳参数的普通页面。

```json
{ "path": "uni_modules/nova-pocket/pages/account/detail", "style": { "navigationStyle": "custom", "disableScroll": true } }
```

在宿主 `vite.config.js` 追加两行导入，把 `pocketPlugin(pages)` 加入已有的 `plugins` 数组。插件校验上述路由，并为两端生成主题图标。示例使用标准 JSON，如宿主使用带注释的 pages.json，请传入宿主解析后的页面配置。

```js
import { pocketPlugin } from './src/uni_modules/nova-pocket/vite.js'
import pages from './src/pages.json'
// 在已有的 defineConfig 中使用 plugins: [uni(), pocketPlugin(pages)]
```

如果构建提示 `host.loginPage` 指向 `tabBar.list`，请在 `src/pocket.config.js` 把该值改为宿主的普通登录页（本例为 `/pages/member/login`），保留原来的首页和「我的」底栏。

**3. 挂载账户页**。在 `src/App.vue` 合并下列生命周期与样式。应用前台恢复时也会重新读取会员。

```vue
<script>
import { account } from './uni_modules/nova-pocket/index.js'
export default {
  onShow() { account.restoreSession() },
}
</script>
<style src="./uni_modules/nova-pocket/account.css"></style>
```

在 `src/main.js` 顶部导入 H5 初始化函数，并在现有 `createApp()` 中调用。两处都要使用 H5 条件编译。

```js
// #ifdef H5
import { installPocketH5 } from './uni_modules/nova-pocket/index.js'
// #endif

export function createApp() {
  // #ifdef H5
  installPocketH5()
  // #endif
  return { app: createSSRApp(App) }
}
```

`src/pages/mine/index.vue` 使用模块组件。切回这个原生底栏时刷新会话，以便读到宿主在其他页面做的登录或退出操作。

```vue
<script setup>
import { onShow } from '@dcloudio/uni-app'
import { account } from '../../uni_modules/nova-pocket/index.js'
import AccountScreen from '../../uni_modules/nova-pocket/components/AccountScreen.vue'
onShow(() => account.restoreSession())
</script>
<template><AccountScreen route="mine" tab="mine" /></template>
```

**4. 保留宿主登录和返回行为**。在 `src/pages/member/login.vue` 保存入口参数。登录完成后先等会话刷新，再返回原来的「我的」或通知。下面的 `signIn()` 代表宿主原有的登录与会话保存操作。宿主其他入口沿用原成功和取消逻辑，示例中两者都是 `uni.navigateBack()`。

```js
import { onLoad } from '@dcloudio/uni-app'
import { account, accountTarget, leaveAuthPages, pageRecordId } from '../../uni_modules/nova-pocket/index.js'
import { signIn } from '../../member.js'

let target
onLoad(query => {
  target = accountTarget(query.returnView, pageRecordId(query.returnId), query.returnTab)
})

async function login() {
  await signIn()
  await account.restoreSession()
  if (target) return leaveAuthPages(target)
  return uni.navigateBack()
}

function cancel() {
  if (target) return leaveAuthPages()
  return uni.navigateBack()
}
```

打开「我的」。已登录会员应直接看到原昵称。访客可点「登录」使用原登录页。当前配置会隐藏整个空的「通知」分组。这个步骤涉及两个新增文件和六个已有文件，宿主的首页和会员存储都可以沿用。

## 第二步，在同一个宿主启用消息

在上述 `src/adapters/index.js` 中将 `export const messages = null` 替换为下面的导入和导出，对接宿主已有的通知服务。`list()` 获取当前会员的通知，`markRead(ids)` 保存这些通知的已读状态。配置里已预留 `messages` 入口，重新构建即可看到「消息中心」。

```js
import { listMyNotices, markMyNoticesRead } from '../notices.js'
export const messages = { list: listMyNotices, markRead: markMyNoticesRead }
```

`list()` 的每条记录形如 `{ id: '港湾/集合', title: '集合通知', body: '请在东门集合。', date: '2026-11-23', read: false }`。在「消息中心」点开记录，复制浏览器地址，在无登录态的新窗口打开。点「去登录」，先试一次取消，应回到原记录的访客页。再次登录，应看到同一条通知的正文，刷新仍可阅读。H5 和微信对页面参数的解码时机不同，登录页使用上面的 `pageRecordId()`，业务代码传原始 ID。业务按钮也可以调用公开入口 `openAccountView('message', id, 'mine')`。

## 继续扩展

- **资料编辑**。在 `auth` 增加 `updateProfile({ nickname })` 并返回保存后的用户，在 `pages.json` 注册 `uni_modules/nova-pocket/pages/account/profile`。其 `style` 使用 `{"navigationStyle":"custom","disableScroll":true,"mp-weixin":{"disableSwipeBack":true}}`。需要退出按钮时可增加 `auth.logout` 并在菜单中配置 `settings`。
- **业务按钮**。在 `blocks.mine` 中加入 `business`，然后把按钮放入 `AccountScreen` 的 `#business` 插槽。
- **分页消息**。完整的 `listPage`、`get`、`markRead` 和 `markAllRead` 契约见模块内的 [pocket-types.d.ts](pocket-types.d.ts)。

使用宿主自己的命令分别构建 H5 和微信小程序。项目采用 MIT 许可，图标许可见 [static/icons/LICENSE.txt](static/icons/LICENSE.txt)。
