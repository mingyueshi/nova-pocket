# 青禾书房

一个基于 UniApp 和 Vue 3 的独立读者中心。源码位于 `src/`，`server.js` 提供本地登录、消息和按读者查询借阅的 HTTP 接口。以下命令均在本项目根目录执行。

## 安装与启动

使用 Node.js 22.13 及以上的 22.x 版本，或 Node.js 24 及以上版本。先在第一个终端安装锁文件中的依赖并启动示例 API。

```sh
npm ci
npm run api
```

保持 API 运行，在第二个终端启动 H5，打开 Vite 输出的本机地址。

```sh
npm run dev:h5
```

H5 通过 Vite 将同源的 `/api` 请求转发到 `127.0.0.1:4318`。示例 API 只监听本机，使用虚构的读者和借阅数据，重启会还原示例并使旧会话失效。

## 换成自己的品牌

打开 [品牌与导航配置](src/pocket.config.js)，将 `brand.name` 从「青禾书房」改为自己的名称，例如「溪桥阅览室」。`brand.subtitle` 控制 H5 标题的副标题。自定义 Logo 放在 `src/static/` 中，将 `brand.logo` 设为对应的 `/static/文件名`。重新启动 API 和 H5 开发服务，或重新构建，首页和页面标题会使用新名称。

## 两位读者打开同一条分享链接

两位读者均可使用演示密码 `ReadingDemo2026`。

1. 从「服务 → 我的借阅」进入，以青禾（`reader@example.test`）登录，打开《山川笔记》。应还日期为 2026-12-10。H5 点「复制详情链接」，微信点「分享详情」。
2. 在访客会话打开该链接，以青禾登录后会回到同一笔记录。
3. 从「我的 → 账户设置」退出，重新打开同一条链接，以小林（`lin@example.test`）登录。页面显示「借阅记录不可用」，点「返回列表」只会看到小林的《河岸手记》。

借阅页面在 [我的借阅](src/pocket-services/loans/index.vue)。示例 API 通过会话令牌确定当前读者，`GET /api/loans` 返回此人的借阅列表，`GET /api/loans/{id}` 返回一条记录。记录不存在或属于其他读者时均返回 404。

## 构建和验收

```sh
npm run build:h5
npx playwright-core install --only-shell chromium
npm run check:h5
npm run build:mp-weixin
```

H5 产物在 `dist/build/h5/`。浏览器验收会在临时端口启动自己的 API 和预览服务，检查当前品牌、分享回跳、账号隔离和异常状态。Linux CI 安装浏览器时可以加 `--with-deps`。

将 `dist/build/mp-weixin/` 导入微信开发者工具，运行 `npm run api` 后可在本机模拟器中验证借阅流程。连接自己的后端时，在项目根目录的 `.env.local` 设置 `VITE_API_BASE_URL` 并重新构建。微信真机使用设备可达的 HTTPS 地址，并配置自己的 AppID 和合法请求域名。

## 许可

项目源码使用 [MIT 许可证](LICENSE)，署名为 mingyueshi。分发图标时请一并保留 [Lucide 图标许可证](src/static/icons/LICENSE.txt)。
