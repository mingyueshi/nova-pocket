# Nova Pocket 候选包使用说明

本套附件对应源码提交 `{{commit}}`。`candidate.json` 列出创建器与独立模块各自的包名、版本、文件名、SHA-256 和主要变化。`baseline/` 中的旧模块仅作为升级验收的起点。

查询该提交的远端验收记录可运行 `gh run list --repo mingyueshi/nova-pocket --workflow ci.yml --commit {{commit}}`。也可在 [项目 CI](https://github.com/mingyueshi/nova-pocket/actions/workflows/ci.yml) 中按提交查看三种模板的任务结果。

在解压后的附件目录先校验全部文件。Linux 使用 `sha256sum -c SHA256SUMS`，macOS 使用 `shasum -a 256 -c SHA256SUMS`。向维护者反馈时请附上提交号、包文件名及校验值。

## 新建项目

使用 Node.js 22.13 及以上的 22.x 版本，或 Node.js 24 及以上版本。把下面的 `basic` 换成 `reading-room` 或 `embedded` 可选择其他模板。省略模板参数默认生成青禾书房。

```sh
npm exec --offline --yes --package=./{{creator}} -- create-nova-pocket ./my-account --template basic
cd my-account
npm ci
npm run dev:h5
```

青禾书房需要在另一个终端运行 `npm run api`。各模板根目录的 README 提供换品牌、浏览器验收和微信小程序构建步骤。

## 在已有宿主安装或升级

从附件目录执行以下命令，将最后一个参数换成已有 UniApp 项目的路径。首次安装和升级使用同一个入口，仅替换宿主的 `src/uni_modules/nova-pocket/`。首次使用时按该目录内的 README 接入宿主账号、页面与底栏。

```sh
npm exec --offline --yes --package=./{{module}} -- install-nova-pocket ../my-uniapp
```

## 在独立示例中复核升级

在附件目录运行以下命令。验收使用生成项目的临时副本，先在无模块的宿主中安装当前包，再从随附旧版升级。脚本构建两端、比较宿主文件，并在浏览器中检查升级前保存的会员资料、行程和通知偏好。

```sh
npm exec --offline --yes --package=./{{creator}} -- create-nova-pocket ./trail-check --template embedded
cd trail-check
npm ci
npx --no-install playwright-core install --only-shell chromium
npm run check:module-upgrade -- ../{{baseline}} ../{{module}}
```

## 真机验收记录

用同一批附件生成测试项目，按项目内的 `docs/mobile-acceptance.md` 复测。记录来源提交 `{{commit}}`，创建器 SHA-256 为 `{{creatorSha256}}`，独立模块 SHA-256 为 `{{moduleSha256}}`。填写实际机型、系统、微信版本及输入法；在手机上测量后再填写结论。

| 平台 | 机型、系统、微信与输入法 | 大字号、键盘和取消返回后继续中文输入 | 深处消息的返回位置与已读数 | 分享回跳、换号和读屏 | 结果与证据 |
| --- | --- | --- | --- | --- | --- |
| iOS | 待记录 | 待测 | 待测 | 待测 | 待记录 |
| Android | 待记录 | 待测 | 待测 | 待测 | 待记录 |
