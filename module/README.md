# Nova Pocket 用户中心模块

适用于使用 Vue 3 的 UniApp 项目。宿主维护登录、会员存储、原生底栏、业务页和品牌。模块提供账户页面、状态、样式、图标及类型声明。

## 安装和升级

在宿主根目录执行以下命令，按收到的文件名替换版本号。

```sh
npm exec --offline --yes --package=./nova-pocket-module-0.1.0.tgz -- install-nova-pocket .
```

安装位置是 `src/uni_modules/nova-pocket/`。升级时用新包再次执行同一条命令并重新构建。该目录的内容按版本整体替换。把应用定制放到下面的宿主文件中，升级前可在 Git 中保存当前版本，以便回退。

## 首次接线

1. 提供 `src/pocket.config.js` 默认导出配置，以及 `src/adapters/index.js` 的命名导出 `auth` 和 `messages`。最小配置见下方，登录态至少实现 `auth.getSession()`。消息未接入时导出 `messages = null`。类型见模块内的 `pocket-types.d.ts`。
2. 在宿主 `pages.json` 登记以下页面，并在 `host.accountTab`、`host.loginPage` 中填写宿主已有的「我的」原生底栏和普通登录页。资料编辑能力由 `auth.updateProfile` 提供。

   ```json
   { "pages": [
     { "path": "uni_modules/nova-pocket/pages/account/detail", "style": { "navigationStyle": "custom", "disableScroll": true } },
     { "path": "uni_modules/nova-pocket/pages/account/profile", "style": { "navigationStyle": "custom", "disableScroll": true, "mp-weixin": { "disableSwipeBack": true } } }
   ] }
   ```

3. 在宿主 App 引入 `./uni_modules/nova-pocket/account.css`，并在 `onShow` 调用模块公开入口 `index.js` 导出的 `account.restoreSession()`。H5 在 `createApp` 里调用 `installPocketH5()`，该导入和调用都使用 UniApp 的 `// #ifdef H5` 包裹。
4. 宿主「我的」页引入模块 `components/AccountScreen.vue`，传 `route="mine" tab="mine"`。需要业务按钮时放入 `#business` 插槽，并在 `blocks.mine` 里设置它的位置。
5. 在原有 Vite 配置中引入 `./src/uni_modules/nova-pocket/vite.js` 的 `pocketPlugin`，将 `pocketPlugin(pages)` 加到已有插件列表，`pages` 是宿主解析后的页面配置。它检查宿主页路径并为两端生成本地主题图标。宿主照常使用自己的 UniApp 构建命令。
6. 业务页用公开入口的 `openAccountView(view, id, tab)` 打开详情。登录页使用 `accountTarget`、`pageRecordId` 解析回跳目标，登录成功后刷新会话并调用 `leaveAuthPages(target)`，取消时调用 `leaveAuthPages()`。旧版山岚步道的分享路径由宿主保留的两个转发页接续。

## 宿主最小配置

下面的 `src/pocket.config.js` 使用宿主已有的「我的」与登录页，请将这两条路径改成项目实际注册的路径。

```js
export default {
  brand: { name: '我的俱乐部' },
  defaultTheme: 'teal',
  defaultLayout: 'minimal',
  host: { accountTab: '/pages/trail/mine', loginPage: '/pages/trail/login' },
  tabs: [['mine', '我的', 'user-round']],
  blocks: { mine: ['identity', { type: 'menu', title: '账号', entries: ['messages', 'settings'] }] },
  shortcuts: [],
  modules: {},
}
```

在 `src/adapters/index.js` 接入现有会员服务。以下示例中的导入路径和函数应替换为宿主已有实现。`getSession()` 返回 `{ id, nickname }` 或访客值 `null`，`updateProfile({ nickname })` 返回保存后的用户。

```js
import { getSession, updateProfile, signOut } from '../trail/member.js'

export const auth = { getSession, updateProfile, logout: signOut }
export const messages = null
```

可选的消息适配器实现 `list()` 和 `markRead(ids)` 后，配置中的消息入口就会显示。分页形式与返回值见模块的 `pocket-types.d.ts`。

运行 H5 与微信小程序构建，验证改昵称、保存通知偏好、从业务页打开通知并登录返回。项目采用 MIT 许可，图标许可见 `static/icons/LICENSE.txt`。
