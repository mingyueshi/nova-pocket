import { cp, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const example = new URL('./', import.meta.url)
const root = new URL('../../', example)
const output = new URL('.build/reading-room/', root)
await mkdir(new URL('scripts/', output), { recursive: true })
for (const path of ['src', 'scripts/uni.js', 'index.html', 'package.json', 'LICENSE']) {
  await cp(new URL(path, root), new URL(path, output), { recursive: true })
}
await cp(new URL('vite.config.js', example), new URL('vite.config.js', output))
await cp(new URL('src/', example), new URL('src/', output), { recursive: true })
console.log('示例项目已生成到 ' + fileURLToPath(output))
