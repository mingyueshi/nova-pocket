# Nova Pocket

基于 UniApp + Vue 3 的通用移动端用户中心。项目从公开演示 v7 整理而来。
https://nova-pocket-account-demo.mingyueshi.chatgpt.site/

## 下载候选附件

在 [GitHub 预发布](https://github.com/mingyueshi/nova-pocket/releases) 下载候选 ZIP。开发中的候选包可在 [GitHub Actions](https://github.com/mingyueshi/nova-pocket/actions/workflows/ci.yml) 选择对应提交且验收通过的运行，下载 `nova-pocket-candidate-<完整提交号>`。解压后先按附件 README 校验 `SHA256SUMS`。新建项目使用创建器，已有 UniApp 宿主使用独立模块安装包。两者独立编号，候选附件文件名含提交号；`candidate.json` 记录各自的版本、SHA-256 和主要变化。

在仓库运行 `npm run pack:candidate` 可为当前 Git 提交生成同样结构的 `dist/candidates/<完整提交号>/`。打包读取该提交归档的文件。目录中包含两个安装包、使用说明、清单及升级验收所用的旧版模块。下游只需附件就能验证三种模板，并在山岚步道宿主中复核首次安装与跨版本升级。

iPhone 12 Pro Max 的中文输入、Safari 侧滑、VoiceOver、长列表返回及微信内大字号结果见 [0.3.0-rc.3 真机验收记录](docs/validation/2026-11-24-rc3-ios.md)。

## 快速启动

使用 Node.js 22.13+（22.x）或 24 及以上版本，在 nova-pocket 目录执行以下命令。

```bash
npm ci
npm run dev:h5
```

从本仓库选择模板生成独立项目。通用账户中心使用本地演示账号，开箱即可体验登录、资料和消息。

```sh
npm run create -- ../my-account --template basic
cd ../my-account
npm ci
npm run dev:h5
```

青禾书房提供示例 HTTP API 和借阅分享。可显式使用 `--template reading-room`，也可沿用下面的默认命令。

```sh
npm run create -- ../my-reading-room
cd ../my-reading-room
npm ci
```

创建命令接受新目录或空目录，遇到已有文件、非空目录或作为目标的符号链接会退出。每个模板都附有自己的启动、换品牌和验收说明。[通用账户中心](examples/basic/standalone.md) · [青禾书房接入示例](examples/reading-room/README.md)

### 已有 UniApp 项目接入

山岚步道示例保留宿主的原生「路线 / 我的」底栏、登录页和会员存储。「我的」使用用户中心的资料和消息页面。路线详情也能打开一条通知，访客登录后回到该通知，再返回原路线。

```sh
npm run create -- ../my-trail --template embedded
cd ../my-trail
npm ci
npm run dev:h5
```

接入时配置 `host.accountTab`、`host.loginPage`，把适配器映射到现有账户服务。资料编辑和消息入口跟随适配器能力。安全、活动、通知偏好、隐私与帮助通过 `accountPages` 指向宿主已注册的普通页面，未接入的能力在菜单和详情链接中同时关闭。通知偏好的读取、保存与生效由宿主实现。独立模板仍使用自己的导航与认证页面。[宿主接入与双端验收](examples/embedded/standalone.md) · [宿主路由](examples/embedded/src/pages.json) · [会员适配器](examples/embedded/src/adapters/index.js)

### 安装或升级独立用户中心模块

在本仓库运行 `npm run pack:module` 得到 `dist/module/nova-pocket-module-0.1.2.tgz`。把文件放在已有 UniApp 项目根目录，执行以下命令。升级时使用新版本的文件名。

```sh
npm exec --offline --yes --package=./nova-pocket-module-0.1.2.tgz -- install-nova-pocket .
```

安装命令只替换 `src/uni_modules/nova-pocket/`。首次接入可先用宿主的 `auth.getSession()` 显示现有会员，并导出 `messages = null` 隐藏消息入口。随后只需在适配器里接入消息列表和已读接口，就能从通知详情登录并回到原记录。山岚步道使用同一模块的公开入口，旧版的资料与消息链接通过宿主转发页继续生效。[模块接线清单](module/README.md) · [山岚步道示例](examples/embedded/standalone.md)

仓库内运行 `npm run pack:module`、`npx playwright-core install --only-shell chromium` 和 `npm run check:module-upgrade` 可重跑升级验收。脚本在临时宿主中依次安装两个实际版本包，分别构建 H5 和微信小程序，并核对宿主文件。浏览器用同一来源从旧版切到新版，验证昵称、提醒偏好、已加入的行程和登录回跳。默认旧包来自上一批 0.1.1 附件，CI 还覆盖同版本的前一批附件与 0.1.0-rc.1。也可在命令后加 `-- <旧包路径> <新包路径>`。[升级脚本](scripts/check-module-upgrade.js)

### 分发项目创建器

在仓库根目录运行以下命令。它使用 `npm pack` 将创建器、三种模板和各自的使用说明打成一个版本包，输出在 `dist/creator/`。

```sh
npm run pack:creator
```

把生成的 `.tgz` 交给下游开发者。对方将它放在自己的工作目录，按实际文件名运行以下命令即可创建项目。创建器从本地包读取模板，应用依赖随后由 `npm ci` 安装。

```sh
npm exec --offline --yes --package=./create-nova-pocket-0.3.0-rc.3.tgz -- create-nova-pocket ./my-account --template basic
cd my-account
npm ci
```

包内的 `package/README.md` 说明如何选择模板，生成项目根目录的 README 说明如何启动、换品牌以及做双端验收。[创建器使用说明](scripts/creator/README.md)

## 构建

```bash
npm run build:h5
npm run build:mp-weixin
```

H5 产物在 `dist/build/h5`。微信小程序产物在 `dist/build/mp-weixin`，可导入微信开发者工具预览。项目未配置正式小程序 AppID，真机预览或发布时按需配置自己的 AppID。Android 返回确认、侧滑及 WXSS 表现请在目标微信真机上验收。

basic 的 H5 验收覆盖 320 像素窄屏、24 像素最小字号、20 字符昵称和键盘占位。脚本验证取消离开后继续输入中文、保存与登录；在 390 和 320 像素宽度下，都从已滚动超过两屏的位置打开第 40 条消息，返回后核对原行、已读数及全部 48 条记录。微信模拟器步骤及 iOS、Android 真实输入法和返回手势的核对条件见[移动端验收](docs/mobile-acceptance.md)。


## 换品牌与导航

修改 `src/pocket.config.js` 后重新启动开发服务或构建。默认配置保留四个底栏入口、三个业务模块和应用内演示设置。

| 配置 | 用途 |
| --- | --- |
| `brand.name`、`brand.subtitle`、`brand.logo` | 品牌名称、H5 标题副标题、可选 Logo。将图片放入 `src/static/`，路径写成 `/static/brand.png` |
| `defaultTheme`、`defaultLayout` | 默认主题选内置的 `blue / teal / dark` 或 `themes` 中的键，首页布局选 `overview / shortcuts / minimal` |
| `tabs` | 内置入口的键、显示名称和图标。可以删除或重排，首个可用入口是默认页，至少需保留一项 |
| `shortcuts` | 首页快捷入口的目标、名称、图标和说明，已关闭的目标会自动隐藏 |
| `modules` | 订单 `orders`、评价 `reviews`、统计 `stats` 各自的入口文案、图标与 `enabled` 开关。设置 `requiresLogin: true` 可要求访客登录，详情直达同样生效 |
| `demoSettings` | 是否展示演示控制页。只有登录和消息都使用演示适配器时才开放 |

例如，将 `modules.reviews.enabled` 改为 `false`，订单详情中的评价按钮会一同隐藏，已有评价链接会显示返回账户中心的入口。关闭全部服务会移除服务底栏。三个模块的界面分别参与条件编译，订单与评价共用示例订单数据。构建命令也会把品牌标题同步到 UniApp 的 `manifest.json` 和 `pages.json`，其他平台参数仍在这两个文件中配置。

### 配置品牌主题

在 `src/pocket.config.js` 增加主题并将其设为默认值。下例来自青禾书房，首页的借阅入口使用金棕图标，选中底栏文字和登录按钮文字使用茶褐色，身份卡使用深棕纯色背景。[完整配置](examples/reading-room/src/pocket.config.js)

```js
defaultTheme: 'tea',
themes: {
  tea: {
    label: '书房茶褐', base: 'teal', brand: '#804322', iconAccent: '#98652D',
    soft: '#F6EBDD', canvas: '#FAF7F1', hero: '#503A2C', heroStyle: 'solid',
  },
},
```

| 字段 | 作用 |
| --- | --- |
| `label`、`base` | 必填。名称出现在「我的 → 账户设置 → 外观」。基础主题取 `blue`、`teal` 或 `dark`，提供未覆盖的颜色 |
| `brand`、`brandOn` | 主按钮底色与文字色。品牌色也用于当前底栏文字、头像文字和认证控件 |
| `iconAccent` | 选中底栏、快捷入口和业务菜单的图标色。省略时优先使用本主题指定的 `brand`，再沿用基础主题的强调色 |
| `soft`、`canvas` | 头像、图标等浅底色与页面底色 |
| `hero`、`heroStart`、`heroStyle` | 身份卡底色与渐变起点。样式取 `solid` 或 `gradient`。独立账户默认渐变，嵌入宿主默认纯色 |

主题键以小写字母开头，可含小写字母、数字和连字符。颜色填写六位十六进制值。改完后重新启动开发服务或构建，H5 和微信使用随包的本地图标。独立模板可在外观选择器中来回切换已注册主题。嵌入模板由宿主指定主题，原生底栏继续读宿主的 `pages.json`。[山岚步道接入步骤](examples/embedded/standalone.md#移入已有项目)

生成的 JavaScript 配置通过 JSDoc 引用 `PocketConfig`，编辑器能补全主题字段和区块类型。两端构建开始时会校验默认主题、基础主题、颜色、身份卡样式和默认布局。比如把默认键拼成 `teaa` 会报 `pocket.config.js: defaultTheme 找不到主题 teaa`，用颜色名设置图标则会指出 `themes.tea.iconAccent`。[类型声明](src/pocket-types.d.ts)

### 配置首页和「我的」区块

在 `src/pocket.config.js` 分别设置 `blocks.home` 和 `blocks.mine`。数组顺序就是屏幕顺序，删去一项或设置 `enabled: false` 即可隐藏。单页留空数组会清空内容区。省略该页则沿用原有布局预设、快捷入口与宿主插槽。自定义首页的设置入口由菜单配置，旧首页保留标题栏的设置按钮。

```js
blocks: {
  home: [
    { type: 'menu', title: '借阅服务', entries: ['loans'] },
    'identity',
  ],
  mine: [
    { type: 'identity', actions: false },
    'business',
    { type: 'menu', title: '账户管理', entries: ['profile', 'settings'] },
  ],
}
```

| 区块 | 内容 |
| --- | --- |
| `identity` | 身份卡。设 `actions: false` 仅展示身份，编辑或登录入口可放在其他位置 |
| `status` | 当前账户状态及相应操作，所需能力可用时显示 |
| `shortcuts`、`management`、`more`、`demo` | 已配置的快捷入口、账户管理、更多和演示菜单。空分组自动隐藏 |
| `menu` | 提供 `title` 和有序的 `entries`，引用底栏键、账户入口或已启用的服务键。名称、图标和说明沿用入口定义，可添加多个不同分组 |
| `business` | 在该位置渲染 AccountScreen 的 `#business` 插槽，内容与点击后的导航由宿主页提供 |

青禾书房复用已注册的 `loans` 服务，首页打开借阅页后可直接返回首页。山岚步道用同一个插槽把自己的行程按钮放在身份卡与行程通知之间。[书房配置](examples/reading-room/src/pocket.config.js) · [宿主页插槽](examples/embedded/src/pages/trail/mine.vue)

### 添加自己的服务页面

青禾书房通过一项入口配置注册「我的借阅」页面。借阅接口和加载逻辑归示例项目维护，下游可按相同方式添加预约、课程等服务。[入口配置](examples/reading-room/src/pocket.config.js) · [完整借阅页面](examples/reading-room/src/pocket-services/loans/index.vue)

1. 在 `src/pocket.config.js` 的 `modules` 中添加服务。键用作长期分享标识，`page` 指向 `src/pocket-services/` 下的相对路径，省略 `.vue` 后缀。

   ```js
   loans: {
     enabled: true, label: '我的借阅', icon: 'layers', description: '查看在借与已归还的图书',
     requiresLogin: true, page: 'loans/index',
   }
   ```

2. 新建 `src/pocket-services/loans/index.vue`。在页面的 `<script setup>` 中调用 `useServicePage()`，将返回的 `target` 传给 `<ServicePage :target="target">`，在其默认插槽里放业务内容。`target.id` 为空时显示列表，点击一条记录时调用 `openRecord(id)`，ID 使用非空字符串。详情可通过 `:shareable="!!record"` 开启分享按钮。微信页面还需在页面本身调用 `onShareAppMessage(shareMessage)`，具体写法见完整借阅页面。

重新启动开发服务或构建后，框架会在 `pages.json` 的 `pocket-services` 分包中注册启用的页面。该分包由配置生成，其他分包可照常维护。每个服务使用独立的页面路径，服务键请避开内置视图名。

H5 的「复制详情链接」与微信分享使用相同的站内路径，例如 `/pages/account/detail?view=loans&id=BR-1038`。模板根据服务键查找当前页面，所以移动页面文件后旧分享仍然有效。访客登录后会返回原记录。关闭模块或移除服务底栏后，原分享会显示「页面不可用」。`requiresLogin` 管理前端展示，接入个人业务数据时，后端还需按当前用户校验记录归属。

## 接入自己的登录与消息

`src/adapters/index.js` 导出 `auth` 和 `messages`。可以分别替换，页面只调用这两个接口。内置的 `createHttpAdapters` 可对接已有请求客户端。以下写法放在适配器入口，保留文件中现有的 `config` 导入和 `demoSettingsEnabled` 导出。

```js
import { createHttpAdapters } from './http.js'
import { request } from './my-request.js' // 接入方自己的请求函数

export const { auth, messages } = createHttpAdapters(request)
```

自写适配器时，可在 `export const auth = { ... }` 上方加 `/** @satisfies {import('#pocket/types').AuthAdapter} */`，在消息适配器上使用 `MessageAdapter`。前者提示会话用户、表单参数与可选能力，后者区分完整列表与分页接口。示例既支持同步返回，也支持 Promise。模块宿主可将该别名映射到模块里的类型文件，或直接用相对路径引用。[类型声明](src/pocket-types.d.ts) · [山岚步道适配器](examples/embedded/src/adapters/index.js)

请求函数签名为 `request(method, path, body?)`，负责 API 地址、平台凭据和错误转换，成功时返回解包后的数据，失败时抛出带可展示消息的 `Error`，并保留 HTTP 状态码 `statusCode`、`status` 或 `response.status`。示例路径集中在 `src/adapters/http.js`。方法可以同步返回或返回 Promise。

| 接口 | 输入及返回 |
| --- | --- |
| `auth.getSession()` | 当前用户 `{ id, nickname, mode? }` 或访客 `null`。`mode` 可选 `member / incomplete` |
| `auth.login(form)` | `{ account, method, password }` 或 `{ account, method, code }`，返回当前用户。方法值为 `password / code` |
| `auth.sendCode({ account, purpose })` | 用途为 `login / register / recover`。可返回 `{ hint }` 提示用户下一步 |
| `auth.register(form)`、`auth.recover(form)` | 两者接收 `account / password / code`。注册另含 `nickname` 并返回已登录用户。找回成功后回到登录页 |
| `auth.updateProfile({ nickname })`、`auth.logout()` | 更新返回保存后的用户；退出成功后清除当前账户和收件箱 |
| `messages.list()` | 当前用户的完整消息数组。每项含字符串 `id / title / date / body` 和布尔值 `read`。列表、详情及角标共用此数据 |
| `messages.markRead(ids)` | 接收字符串 ID 数组，同一 ID 可重复提交。成功后更新角标，失败时保留未读并支持重试 |

### 会话与返回页面

首次打开及从后台回到前台时，应用会调用 `auth.getSession()`。已登录用户变成访客，或受保护的接口返回 HTTP 401 / `code: 'SESSION_EXPIRED'` 时，应用会清除该会话的消息和角标，提示重新登录。网络错误可在原页重试。登录表单收到的 401 会显示为凭据错误。

从访客快捷入口、消息详情或过期提示进入认证时，登录、注册和找回页会携带目标视图、记录 ID 和底栏来源。登录页刷新后仍可恢复目标。只接受当前配置中可用的站内页面。

### 游标分页

完整数组适配器可以继续使用。启用分页时，在 `createHttpAdapters(request, { paginatedMessages: true })` 中传入第二个参数，或为自己的消息适配器提供以下方法。

| 方法 | HTTP 示例与约定 |
| --- | --- |
| `listPage({ cursor, limit })` | `GET /messages?limit=20&cursor=…`。首页省略 cursor。返回 `{ items, nextCursor, unreadCount }`，末页的游标为 `null`，未读数覆盖整个收件箱 |
| `get(id)` | `GET /messages/:id`。返回含正文的消息，找不到时返回 `null` 或抛出 404。分享链接可直接打开尚未加载到列表的记录 |
| `markRead(ids)` | `POST /messages/read`，请求体为 `{ ids }`。成功后同步详情、列表和底栏角标 |
| `markAllRead()` | `POST /messages/read-all`。作用于该用户的全部消息，包括尚未加载的页。两种已读操作均应支持重复调用，成功响应可返回最新的 `{ unreadCount }` |

“加载更多”追加下一页，失败时保留现有列表并重试原游标。“只看未读”筛选已加载的记录，可继续翻页。“刷新”重新读取首页和全局未读数。

分页详情在同一会话内复用。成功刷新首页后，下次打开详情会重新请求正文，同一会话已确认的已读状态会保留。

本地演示适配器包含专用的示例邮箱与验证码。接入自己的认证适配器后，表单会将凭据交给该适配器，并隐藏演示填充按钮。

## 详情链接与演示状态

订单、评价和消息通过视图类型与记录 ID 定位。H5 可以打开、收藏或分享下列地址，小程序可使用同样的页面路径和参数。

- 订单 `/#/pages/account/detail?view=order&id=NP-1042`
- 评价 `/#/pages/account/detail?view=review&id=NP-1038`
- 消息 `/#/pages/account/detail?view=message&id=welcome`

小程序页面路径以 `/pages/account/detail` 开头。内置演示共用一个虚构账号，其昵称、登录或退出状态和消息已读记录保存在本机，演示登录有效期为 7 天。密码与验证码仅用于当前表单和校验。可以在「我的 → 演示设置」重置演示数据。订单评价仍按本次运行保存。

## 校验

当前锁文件的修复项、剩余高危告警的适用场景和模板升级步骤见[依赖安全说明](docs/dependency-security.md)。

```bash
npm run lint
npm test
npm run icons:check
```

图标名单在 `src/icons.js`。更新 Lucide 或调整图标名单后，运行 `npm run icons:sync` 生成色调变体，并提交对应资源。

CI 用同一个 `.tgz` 在三个没有检出源码的任务里分别生成项目，核对锁文件、README、许可证及书房 API，并检查重复创建能保留下游编辑。三个项目都从 `npm ci` 开始，换品牌并构建 H5 和微信小程序。Chromium 分别验证通用账户的登录、昵称与消息已读，两位读者打开同一条借阅分享链接，以及宿主的登录回跳、原生底栏和通知偏好。[通用账户验收](examples/basic/standalone.md#构建和验收) · [书房验收](examples/reading-room/standalone.md#构建和验收)

## 项目结构

- `src/pages/index/index.vue` 管理概览、服务、消息和我的四个底栏入口。`src/pages/account/` 注册详情与资料编辑页面。
- `src/pages/auth/`：登录、注册和找回，公共表单在 `src/components/AuthScreen.vue`。
- `src/components/Service*.vue`：订单、统计图表与评论演示。
- `src/account-data.js` 管理会话，`src/inbox.js` 管理收件箱分页和已读同步。`src/adapters/demo.js` 与 `src/service-demo.js` 提供默认示例数据。
- `src/static/icons/LICENSE.txt`：Lucide 图标许可。

## 许可与来源

项目源码按 MIT 许可证提供，版权署名为 `mingyueshi`。复制或分发本项目时请保留版权与许可声明。[项目许可证](LICENSE)

图标来自 Lucide，分发时请一并保留图标许可文件，其中包含 Lucide 的 ISC 许可和源自 Feather 的图标所适用的 MIT 声明。[图标许可证](src/static/icons/LICENSE.txt)

最初导入的 `Nova-Pocket-v7-source.zip` 标注基线为 `07ba6ab98d4e29cefbc96227ad0dc4951fef1a9b`。归档未附原始 Git 历史。对照本仓库的导入提交 `b225183`，归档内 107 个文件中有一处差异，为 `.gitignore` 的忽略规则。
