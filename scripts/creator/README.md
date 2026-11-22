# 青禾书房项目创建器

这个 npm 包内含完整的青禾书房模板。准备好 Node.js 22.13 及以上的 22.x 版本，或 Node.js 24 及以上版本，将收到的 `.tgz` 放入工作目录。以下命令以 0.1.0 版为例，请使用实际文件名。

```sh
npm exec --offline --yes --package=./create-nova-pocket-0.1.0.tgz -- create-nova-pocket ./my-reading-room
cd my-reading-room
npm ci
```

创建器直接读取本地包，目标可以是新目录或空目录。遇到已有内容（包括隐藏文件）会退出并保留下游改动。`npm ci` 使用生成项目自带的锁文件安装应用依赖。

在项目目录运行 `npm run api`，再打开第二个终端运行 `npm run dev:h5`。按项目内的 README 更换品牌、使用两位示例读者验证借阅分享，以及构建 H5 和微信小程序。

已解包的创建器也可以直接运行 `node package/cli.js ./my-reading-room`。创建器和模板源码使用 MIT 许可证，模板内另附 Lucide 图标许可证。
