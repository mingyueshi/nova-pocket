# Nova Pocket

基于 UniApp + Vue 3 的通用移动端用户中心。此源码对应公开演示 v7：
https://nova-pocket-account-demo.mingyueshi.chatgpt.site/

## 快速启动

在解压后的 nova-pocket 目录执行：

```bash
npm ci
npm run dev:h5
```

## 构建

```bash
npm run build:h5
npm run build:mp-weixin
```

H5 产物在 `dist/build/h5`。微信小程序产物在 `dist/build/mp-weixin`，可导入微信开发者工具预览。项目未配置正式小程序 AppID，真机预览或发布时按需配置自己的 AppID。本版本仅验证了小程序构建，未做微信真机验收。

## 项目结构

- `src/pages/index/index.vue`：概览、服务、消息、我的四个底部导航及演示设置。
- `src/pages/auth/`：登录、注册和找回，公共表单在 `src/components/AuthScreen.vue`。
- `src/components/Service*.vue`：订单、统计图表与评论演示。
- `src/state.js`、`src/service-demo.js`：本地演示状态与示例数据。登录、验证码和订单均为演示，不连接真实服务。
- `src/static/icons/LICENSE.txt`：Lucide 图标许可。

源码基线：`07ba6ab98d4e29cefbc96227ad0dc4951fef1a9b`。归档去掉了站点专用配置、构建产物、依赖目录和 Git 历史，仅新增本说明。
