# 青禾书房接入示例

这个示例把 Nova Pocket 换成一个读者中心，底栏依次为「首页、书房通知、服务、我的」。服务页包含内置的「使用统计」和书房自己的「我的借阅」。登录、借阅查询和消息同步都经过本地 HTTP 服务。

## 创建独立项目

在 Nova Pocket 仓库根目录执行 `npm run create -- ../my-reading-room`。进入新目录后执行 `npm ci`，按生成的 README 启动 API 与 H5。目标已有文件时请选择新目录或空目录。开发本仓库内的示例时，也可使用下面的准备命令。[独立项目使用说明](standalone.md)

## 在本仓库中跑起来

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

打开终端输出的本机地址，进入「书房通知 → 去登录」。青禾使用 `reader@example.test`，小林使用 `lin@example.test`。两人都可使用演示密码 `ReadingDemo2026`，验证码登录会在页面显示演示码。服务只监听本机，接受至少 8 个字符的演示密码。每次登录发放独立的 30 分钟会话，同一读者的会话共享昵称、消息已读状态和借阅记录。重启服务会还原示例数据并使旧会话失效。

从「书房通知」打开第一页，初始共有 2 条未读。点「加载更多」打开第二页的「借阅到期提醒」，返回列表后角标应变为 1。也可在退出后直接访问 `/#/pages/account/detail?view=message&id=%E5%80%9F%E9%98%85%2F%E6%8F%90%E9%86%92`，登录成功后应回到同一条通知。

## 验证「我的借阅」

1. 以青禾登录，进入「服务 → 我的借阅」，打开《山川笔记》。H5 点击「复制详情链接」，微信点击「分享详情」。详情中的应还日期为 2026-12-10。
2. 在访客会话打开这条链接，以青禾登录，应回到《山川笔记》。在「我的 → 账户设置」退出，重新打开同一条链接，以小林登录，应显示「借阅记录不可用」。点「返回列表」只会看到小林的《河岸手记》。
3. 保持小林的详情页打开，重启本地示例服务后刷新页面或重新进入。页面会提示重新登录，以小林登录后回到原记录。网络中断时可在恢复后点「重试」。

借阅记录保存在示例服务端。两个接口均从令牌识别读者。

| 请求 | 返回 |
| --- | --- |
| `GET /api/loans` | 当前读者的记录数组，无借阅时返回 `[]` |
| `GET /api/loans/{id}` | 当前读者的单条记录。ID 作为单个路径段编码，记录不存在或属于其他读者时均返回相同的 404 |

令牌无效或过期时，两者均返回 401。页面会保留当前记录作为登录目标。换号、离开页面或切换记录后，先前请求的结果会被丢弃。关闭 `modules.loans.enabled` 并重新构建后，旧分享链接显示「页面不可用」。

## 迁移到自己的项目

| 要改什么 | 示例文件 | 作用 |
| --- | --- | --- |
| 品牌、首页和服务 | [pocket.config.js](src/pocket.config.js) | 设置品牌与主题，调整底栏顺序，关闭订单和评价。旧订单、评价链接显示返回账户中心的入口 |
| 读者借阅列表与详情 | [借阅页面](src/pocket-services/loans/index.vue) · [加载逻辑](src/pocket-services/loans/use-loans.js) | 页面按会话和记录 ID 请求列表或详情，公共组件处理登录、返回与分享 |
| 接口选择 | [adapters/index.js](src/adapters/index.js) | 将项目自带的 HTTP 适配器设为认证和消息入口，开启游标分页 |
| 请求和凭据 | [request.js](src/adapters/request.js) | 使用 `uni.request` 发送请求，保存登录返回的示例令牌，保留 HTTP 状态码供页面显示错误或提示重新登录 |
| H5 本地代理 | [vite.config.js](vite.config.js) | H5 从同源的 `/api` 请求，本地开发服务器转发到 4318 端口 |
| 本地接口实现 | [server.js](server.js) | 提供可运行的响应示例，查询与写入都经过 HTTP |

在自己的副本中将示例 `src/` 下的文件放入同名位置，保留模板的 `src/adapters/http.js`。单独迁移借阅服务时，复制整个 `pocket-services/loans/` 目录和入口配置，并接入自己的带凭据请求函数。如果需要 H5 本地代理，将示例 Vite 配置的 `proxy` 设置并入项目。对接业务后端时，把 `request.js` 中登录响应的 `{ user, token }`、凭据存取和错误消息改为业务接口约定，凭据有效期由后端管理。[主项目接入说明](../../README.md#接入自己的登录与消息)

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

H5 验收会用独立的临时端口启动接口和预览服务，使用 Chromium 打开生产包，检查品牌与底栏、关闭模块的旧链接、登录回到原消息、分页、已读、刷新恢复和退出。借阅验收会复制实际分享链接，分别以两位读者登录，再检查空列表、断网重试与会话过期后的回跳。

在微信开发者工具中导入 `.build/reading-room/dist/build/mp-weixin`，保持 `npm run example:api` 运行。可按相同顺序检查首页与消息链路。手机上的 `127.0.0.1` 指向手机自身，真机测试请使用上面的 HTTPS 配置。
