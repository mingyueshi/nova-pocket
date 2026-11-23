# 依赖安全与升级

2026-11-23 使用 Node.js 22.19.0、npm 10.9.3 和 npm 公共注册表复核。下表按 npm 报告中的包计数。同一底层公告可以沿多个依赖向上传递，因此需要结合依赖路径和构建产物判断影响。[npm audit 说明](https://docs.npmjs.com/cli/v10/commands/npm-audit/)

| 审计范围 | 更新前 | 创建器 0.3.0-rc.2 |
| --- | --- | --- |
| 完整锁文件 | 44 项，23 高危 | 23 项，9 高危、14 中危 |
| 排除开发依赖 | 36 项，19 高危 | 22 项，9 高危、13 中危 |

两次审计的严重（critical）项均为 0。UniApp 的平台包同时引用编译插件，`npm audit --omit=dev` 的结果仍包含构建工具。

## 已修复的依赖路径

- UniApp CLI 与 Vite 插件使用的 Babel、PostCSS、选择器解析和源映射工具已更新。插件的 Express 4 更新到 4.22.3，带入修复后的请求解析和路由依赖。
- UniApp 模块工具使用的 adm-zip 更新到 0.6.1。微信自动化工具的 ws 更新到 8.23.0，Jimp 下的 jpeg-js 更新到 0.4.4。回归测试覆盖 ZIP 往返和通过 Jimp 读取 JPEG 缓冲区。
- 国际化依赖保留 UniApp 自带适配层使用的 9.1 系列。core-base 与 message-resolver 更新到 9.1.11，回归测试覆盖预编译消息的具名参数。后续两个国际化公告仍需上游兼容升级。

版本约束在项目根目录的 `package.json` 中，由 `package-lock.json` 固定。创建器将两者一起带入三个模板。已有下游升级时，合并这些 `overrides`，保留自己的依赖和构建插件，重新生成本项目的锁文件后运行 `npm ci`。

## 剩余告警在哪些场景生效

| 公告直接涉及的包 | 当前使用路径与判断 |
| --- | --- |
| Vite 5.2.8 | 当前稳定版 UniApp 编译插件精确要求此版本。两条高危公告涉及 Windows 开发服务器调用编辑器。模板的 H5 开发服务默认绑定 `127.0.0.1`、关闭 Vite 的 CORS 响应头并启用工作区文件访问限制。这些设置缩小开发时的暴露面，仍需等待兼容的上游修复。部署 H5 时使用 `dist/build/h5` 的静态文件。[插件依赖声明](https://registry.npmjs.org/@dcloudio/vite-plugin-uni/3.0.0-5030420261029002) · [编辑器调用公告](https://github.com/advisories/GHSA-c27g-q93r-2cwf) · [后续公告](https://github.com/advisories/GHSA-587h-7wmj-h5pm) |
| @vue/server-renderer 3.4.21 | Vue 和 UniApp H5 包共同固定了渲染器版本，公告修复于 3.5.42。三个模板均在客户端渲染。下游启用 SSR 时需单独复核服务端渲染链。[Vue 官方公告](https://github.com/vuejs/core/security/advisories/GHSA-g2v6-rqmx-r4w6) |
| @intlify/core-base 9.1.11 | 剩余公告涉及翻译参数的 HTML 转义。当前模板没有使用该包渲染翻译 HTML。下游引入此用法时应复核对应公告。[属性转义公告](https://github.com/advisories/GHSA-x8qp-wqqm-57ph) · [混合参数公告](https://github.com/advisories/GHSA-8rc2-428q-7ww3) |
| esbuild 0.20.2 | Vite 和 UniApp 使用它处理构建输入。公告涉及 esbuild 自带的开发服务器，项目的 `dev:h5` 使用 Vite。[esbuild 官方公告](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99) |
| phin 2.9.3 | 微信自动化工具经 Jimp 引入。这个工具读取二维码时向 Jimp 传入图片缓冲区。公告涉及 HTTP 客户端跟随重定向时转发敏感请求头。[phin 公告](https://github.com/advisories/GHSA-x565-32qp-m3vf) |

本次从创建器压缩包在仓库外分别生成 basic、reading-room、embedded，再检查两端生产构建的 Rollup 输出。在 `generateBundle` 中逐个读取 `chunk.modules`，用 `renderedLength > 0` 筛选实际贡献代码的模块并核对包路径。六份产物均未发现上表五个包的模块路径。H5 包含 Vite 生成的预加载辅助代码，H5 和微信产物也各自包含 UniApp 平台运行时。这个检查能识别独立 npm 模块，无法识别第三方预先打包在其他文件中的所有代码。示例 HTTP API 独立使用 Node 内置模块。

## 下次升级时复核

先运行 `npm ci`、`npm ls --all`、`npm audit` 和 `npm audit --omit=dev`，用 `npm explain <包名>` 查看报告中的引入路径。优先检查 UniApp 稳定版对 Vite、Vue、服务端渲染器的配套要求。调整或移除覆盖后，在三个模板分别验证开发服务、H5 浏览器流程和微信构建。
