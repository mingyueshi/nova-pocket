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

本示例通过 `src/uni_modules/nova-pocket/` 使用独立模块。新宿主从版本包安装模块，使用包内 README 完成首次接线。已有宿主升级时再次运行安装命令，再构建 H5 和微信小程序。

```sh
npm exec --offline --yes --package=./nova-pocket-module-0.1.0.tgz -- install-nova-pocket .
```

| 宿主文件 | 山岚步道的接法 |
| --- | --- |
| `src/pocket.config.js`、`src/adapters/index.js` | 提供品牌、区块、会员和消息接口。实际数据保存在宿主的 `src/trail/member.js` |
| `src/pages.json`、`src/pages/trail/mine.vue` | 注册模块的资料与详情页，「我的」原生底栏加载 AccountScreen，通过 business 插槽插入行程入口 |
| `src/App.vue`、`src/main.js`、`vite.config.js` | 引入模块 CSS，在 onShow 恢复会话，安装 H5 表单监听，并在宿主 Vite 插件列表添加 `pocketPlugin(pages)` |
| `src/pages/trail/login.vue`、`walk.vue` | 通过模块的 `index.js` 打开通知、传递登录目标并回到业务页。宿主保管会员存储与登录流程 |
| `src/pages/account/` | 两个转发页仅用于原版山岚步道的旧链接。新链接使用 `/uni_modules/nova-pocket/pages/account/` 下的页面 |

从旧版复制式示例迁移时，先安装模块，参照上述宿主文件替换导入、页面注册和 Vite 配置。启动脚本使用宿主自己的 UniApp CLI；保留原会员存储键、业务页和分享转发页。完成上面四项交互验收后即可移除已无引用的旧副本。

`src/uni_modules/nova-pocket/README.md` 提供接线清单和类型说明。项目与模块采用 MIT 许可，图标许可位于模块的 `static/icons/LICENSE.txt`。
