# 山岚步道 · 已有 UniApp 接入用户中心

示例宿主自带「路线 / 我的」原生底栏、步行路线详情和会员登录页。首次打开会提供已登录的本机示例会员林溪。示例在设备上保存单个会员的资料、站内通知和行程，仅用于验证接入流程。

## 运行和验证

生成项目中的 [移动端验收](docs/mobile-acceptance.md) 列出窄屏、键盘、系统返回和真机复测的操作与通过条件。

在生成项目里执行 `npm ci`、`npm run dev:h5`。自动验证使用 `npm run build:h5`、`npx playwright-core install --only-shell chromium`、`npm run check:h5`。运行 `npm run build:mp-weixin` 后，把 `dist/build/mp-weixin` 导入微信开发者工具，可选择工具提供的测试号在模拟器运行。真机预览时在 `src/manifest.json` 配置自己的小程序 AppID。

1. 从「路线」进入「我的」，编辑昵称。回到路线页会看到宿主读出的新昵称。
2. 在「我的 → 账户设置 → 通知偏好」关闭行程提醒。重开后设置保留。首次加入河岸晨行时，只有开着提醒才会新增一条站内消息，已有公告仍可阅读。
3. 在「我的 → 账户设置」退出。从「路线 → 河岸晨行 → 查看集合通知」点「去登录」。宿主登录完成后显示原通知，返回一次回到河岸晨行，再返回到路线底栏。取消登录会回到同一条记录的访客态。
4. 直接打开 `/pages/account/detail?view=message&id=%E6%B2%B3%E5%B2%B8%2F%E9%9B%86%E5%90%88`。冷启动无历史页时，返回到宿主「我的」。未配置的 `view=security` 会显示「页面不可用」。

## 移入已有项目

- 保留宿主的 App、原生 tabBar、首页和登录页。在 pages.json 注册 `pages/account/detail` 和需要的 `pages/account/profile`，沿用本示例的自定义导航设置。「我的」tab 渲染 AccountScreen，传 `route="mine" tab="mine"`。在 blocks.mine 中移动 business 即可调整宿主业务入口的位置，按钮与跳转由 business 插槽提供，参见本项目的 src/pages/trail/mine.vue。
- 复制本项目的通用组件、组件引用的 JS 模块、account.css 和 static/icons（含许可证）。在宿主 App 引入 account.css，保留宿主自己的全局样式。在主入口沿用 src/main.js 的 H5 未保存表单返回保护与键盘缩小视口时的输入框定位。在宿主 App 的 onShow 恢复账户会话，在宿主登录或切换账号成功后也调用 account.restoreSession()。
- 在 pocket.config.js 的 host.accountTab 填「我的」原生底栏路径，在 host.loginPage 填普通登录页路径，tabs 保留 mine。brand 使用宿主品牌，账户页配色集中在 `themes.trail`，`defaultTheme: 'trail'` 使头像、按钮与图标沿用山岚绿。宿主页面和原生导航栏在宿主的 pages.json 维护。
- 将 adapters/index.js 的 auth.getSession、auth.updateProfile、auth.logout 以及 messages 映射到宿主已有服务。宿主继续管理凭据。无需资料编辑时省略 updateProfile。没有收件箱时导出 messages = null。宿主适配器导出 demoSettingsEnabled = false。
- 在 accountPages 中按需注册 security（设备、验证方式等）、activity、notifications、privacy、help。每个值都是已注册的普通页面绝对路径，页面负责数据、登录校验和保存操作。空缺的能力不会生成菜单或可用的详情链接。
- 在宿主业务页使用 openAccountView('message', id, 'mine') 打开账户详情。宿主登录页通过 accountTarget 和 pageRecordId 解析登录目标，成功后调用 leaveAuthPages(target)，取消时调用 leaveAuthPages()。保留已存在的宿主页栈，冷启动回退由 host.accountTab 接管。可直接参照 src/pages/trail/login.vue。
- H5 和小程序构建沿用 scripts/uni.js 的条件编译参数，以及生成项目根目录的 index.html 和 Vite 入口约定。合并到既有 Vite 构建时，从 `scripts/theme-icons.js` 引入 `themeIcons` 并将 `themeIcons()` 加入原有插件列表，用于开发预览与两端构建的本地强调色图标。模板的 `package.json` 将 `#pocket/types` 映射到 `src/pocket-types.d.ts`。复制接入时也可以在 JSDoc 中用相对路径引用此文件。

项目源码采用 [MIT 许可证](LICENSE)，图标许可随 [图标资源](src/static/icons/LICENSE.txt) 分发。
