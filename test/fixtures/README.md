# 模块升级验收的旧版包

`nova-pocket-module-0.1.0-rc.1.tgz` 是山岚步道首次模块化接入时，用 `npm run pack:module` 实际生成的本地候选包。包内只含模块源码、图标、许可证及安装入口。SHA-256 为 `47273f3df5bff8981cdfebcd6e729ede7975a636cdbcba240e8d61315a116e70`。

`npm run check:module-upgrade` 使用这份固定输入建立旧版运行环境。复测其他版本组合时，可传入两个本地包的路径。
