import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const example = fileURLToPath(new URL('./', import.meta.url))
const root = fileURLToPath(new URL('../../', import.meta.url))

export async function writeReadingRoom(output) {
  await mkdir(output, { recursive: true })
  for (const path of ['src', 'scripts/uni.js', 'scripts/sync-icons.js', 'index.html', 'eslint.config.js', '.gitignore', 'LICENSE']) {
    await cp(join(root, path), join(output, path), { recursive: true })
  }
  for (const path of ['src', 'vite.config.js', 'server.js', 'check-h5.js']) {
    await cp(join(example, path), join(output, path), { recursive: true })
  }
  await cp(join(example, 'standalone.md'), join(output, 'README.md'))

  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
  pkg.name = 'qinghe-reading-room'
  const { scripts } = pkg
  pkg.scripts = {
    'dev:h5': scripts['dev:h5'],
    'build:h5': scripts['build:h5'],
    'build:mp-weixin': scripts['build:mp-weixin'],
    api: 'node server.js',
    'check:h5': 'node check-h5.js',
    lint: 'eslint src scripts server.js check-h5.js vite.config.js',
    'icons:check': scripts['icons:check'],
    'icons:sync': scripts['icons:sync'],
  }
  lock.name = lock.packages[''].name = pkg.name
  await writeFile(join(output, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
  await writeFile(join(output, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n')
}
