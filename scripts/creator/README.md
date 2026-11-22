# Nova Pocket 项目创建器

这个 npm 包提供两种模板。准备好 Node.js 22.13 及以上的 22.x 版本，或 Node.js 24 及以上版本，将收到的 `.tgz` 放入工作目录。以下命令以 0.2.0 版为例，请使用实际文件名。

### 通用账户中心

```sh
npm exec --offline --yes --package=./create-nova-pocket-0.2.0.tgz -- create-nova-pocket ./my-account --template basic
cd my-account
npm ci
npm run dev:h5
```

`basic` 使用本地演示适配器，提供登录、昵称编辑和消息已读。打开 H5 即可体验。

### 青禾书房

`reading-room` 提供示例 HTTP API 和两位读者的借阅分享流程。省略 `--template` 也会生成此模板。

```sh
npm exec --offline --yes --package=./create-nova-pocket-0.2.0.tgz -- create-nova-pocket ./my-reading-room --template reading-room
cd my-reading-room
npm ci
```

在书房项目目录运行 `npm run api`，再打开第二个终端运行 `npm run dev:h5`。

两种模板都接受新目录或空目录。遇到已有内容（包括隐藏文件）会退出并保留下游改动。生成项目各自带有依赖锁文件和 README，包含换品牌、浏览器验收和双端构建步骤。

已解包的创建器也可以直接运行 `node package/cli.js ./my-reading-room`。创建器和模板源码使用 MIT 许可证，模板内另附 Lucide 图标许可证。
