# 青禾书房接入示例

这个示例把 Nova Pocket 换成一个读者中心，底栏依次为「首页、书房通知、服务、我的」。服务中只保留使用统计。访客登录、消息详情、分页和已读角标都通过本地 HTTP 服务工作。

## 跑起来

在仓库根目录使用项目要求的 Node.js 版本。打开第一个终端，安装依赖、生成示例并启动接口服务。

```sh
npm ci
npm run example:prepare
npm run example:api
```

打开第二个终端，从仓库根目录启动 H5。

```sh
npm --prefix .build/reading-room run dev:h5
```

打开终端输出的本机地址，进入「书房通知 → 去登录」。邮箱填写 `reader@example.test`，密码可以用 `ReadingDemo2026`。本地服务模拟一个虚构读者，接受至少 8 个字符的演示密码。验证码流程会在页面显示演示码。每次登录发放独立的 30 分钟会话，昵称和已读状态由这个读者共享。服务仅监听本机，重启会清空演示数据并使旧会话失效。

从「书房通知」打开第一页，初始共有 2 条未读。点「加载更多」打开第二页的「借阅到期提醒」，返回列表后角标应变为 1。也可在退出后直接访问 `/#/pages/account/detail?view=message&id=%E5%80%9F%E9%98%85%2F%E6%8F%90%E9%86%92`，登录成功后应回到同一条通知。

## 迁移到自己的项目

| 要改什么 | 示例文件 | 作用 |
| --- | --- | --- |
| 品牌、首页和服务 | [pocket.config.js](src/pocket.config.js) | 设置品牌与主题，调整底栏顺序，关闭订单和评价。旧订单、评价链接显示返回账户中心的入口 |
| 接口选择 | [adapters/index.js](src/adapters/index.js) | 将项目自带的 HTTP 适配器设为认证和消息入口，开启游标分页 |
| 请求和凭据 | [request.js](src/adapters/request.js) | 使用 `uni.request` 发送请求，保存登录返回的示例令牌，保留 HTTP 状态码供页面显示错误或提示重新登录 |
| H5 本地代理 | [vite.config.js](vite.config.js) | H5 从同源的 `/api` 请求，本地开发服务器转发到 4318 端口 |
| 本地接口实现 | [server.js](server.js) | 提供可运行的响应示例，查询与写入都经过 HTTP |

在自己的副本中将示例 `src/` 下的三个文件放入同名位置，保留模板的 `src/adapters/http.js`。如果需要 H5 本地代理，将示例 Vite 配置的 `proxy` 设置并入项目。页面和组件可以直接沿用。对接业务后端时，把 `request.js` 中登录响应的 `{ user, token }`、凭据存取和错误消息改为业务接口约定，凭据有效期由后端管理。接口方法见[主项目接入说明](../../README.md#接入自己的登录与消息)。

默认的小程序 API 地址为 `http://127.0.0.1:4318/api`，适合在运行服务的同一台电脑上用微信开发者工具调试。使用自己的后端时，在环境变量或生成项目根目录的 `.env.local` 中设置 `VITE_API_BASE_URL=https://你的接口域名/api`，重新启动或构建项目。H5 发布时也可由同源服务器挂载 `/api`。微信真机需使用设备可达且符合小程序域名配置的 HTTPS 服务。前端环境变量只填写公开的 API 地址。

`example:prepare` 将模板和示例配置复制到 `.build/reading-room/`。修改仓库里的示例源文件后重新执行该命令，再运行开发或构建命令。

## 双端验收

从仓库根目录依次执行以下命令。

```sh
npm run example:prepare
npm --prefix .build/reading-room run build:h5
npx playwright-core install chromium --only-shell
npm run example:check:h5
npm --prefix .build/reading-room run build:mp-weixin
```

H5 验收会用独立的临时端口启动接口和预览服务，使用 Chromium 打开生产包，检查品牌与底栏、关闭模块的旧链接、登录回到原消息、分页、已读、刷新恢复和退出。

在微信开发者工具中导入 `.build/reading-room/dist/build/mp-weixin`，保持 `npm run example:api` 运行。可按相同顺序检查首页与消息链路。手机上的 `127.0.0.1` 指向手机自身，真机测试请使用上面的 HTTPS 配置。
