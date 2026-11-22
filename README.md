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
- `src/state.js`、`src/service-demo.js`：本地演示状态与示例数据。登录、验证码和订单均为演示，不连接真实服务。
- `src/static/icons/LICENSE.txt`：Lucide 图标许可。

最初归档标注的上游源码基线为 `07ba6ab98d4e29cefbc96227ad0dc4951fef1a9b`。原 Git 历史未随归档导入，提交哈希需在上游仓库核对。
