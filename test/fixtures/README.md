# 模块升级验收的旧版包

`nova-pocket-module-0.1.0-rc.1.tgz` 是山岚步道首次模块化接入时，用 `npm run pack:module` 实际生成的本地候选包。包内只含模块源码、图标、许可证及安装入口。SHA-256 为 `47273f3df5bff8981cdfebcd6e729ede7975a636cdbcba240e8d61315a116e70`。

`npm run check:module-upgrade` 默认使用上一次通过 CI 的 0.1.1 安装包。两批 0.1.1 都从 Actions 的实际候选附件取出，文件名保留来源提交。打开[修复前的构建](https://github.com/mingyueshi/nova-pocket/actions/runs/45188054999)和[修复后的构建](https://github.com/mingyueshi/nova-pocket/actions/runs/45196002834)可查看各自来源。三份旧包的 SHA-256 均固定在 [upgrade-baselines.json](upgrade-baselines.json)，CI 逐个验证升级。复测其他版本组合时，可传入两个本地包的路径。
