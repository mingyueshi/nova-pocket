# Nova Pocket 通用账户中心

这个 UniApp 项目提供概览、消息和个人资料。登录和通知使用本地演示适配器，会话、昵称和已读状态保存在当前设备。

## 启动 H5

使用 Node.js 22.13 及以上的 22.x 版本，或 Node.js 24 及以上版本，在本项目目录运行以下命令，再打开终端输出的地址。

```sh
npm ci
npm run dev:h5
```

## 体验账户流程

1. 首次打开会看到已登录的「演示用户」。进入「我的 → 账户设置」退出，再点「登录 → 填入演示资料 → 登录」。演示邮箱为 `demo@example.test`，演示密码为 `NovaDemo2026`。
2. 在「我的 → 编辑资料」修改昵称并保存。刷新页面，昵称会保留。
3. 进入「消息」，打开欢迎通知。返回消息列表，通知会标记为已读，底栏的未读数会从 2 变为 1。

在 [品牌与导航配置](src/pocket.config.js) 中修改 `brand.name`、`brand.subtitle` 和底栏入口，重新启动或构建即可生效。接入自己的服务时，在 [适配器入口](src/adapters/index.js) 中替换登录和消息实现。

## 构建和验收

```sh
npm run build:h5
npx playwright-core install --only-shell chromium
npm run check:h5
npm run build:mp-weixin
```

浏览器验收会在临时端口打开 H5 生产包，检查品牌、登录、昵称和消息已读。H5 产物在 `dist/build/h5/`。将 `dist/build/mp-weixin/` 导入微信开发者工具即可检查小程序，真机预览时使用自己的 AppID。

源码按 [MIT 许可证](LICENSE) 分发，署名 mingyueshi。分发图标时请保留 [Lucide 图标许可证](src/static/icons/LICENSE.txt)。
