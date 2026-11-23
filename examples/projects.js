import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writePocketModule } from '../scripts/pocket-module.js'

const examples = fileURLToPath(new URL('./', import.meta.url))
const root = fileURLToPath(new URL('../', import.meta.url))

export async function writeProject(output, template) {
  const example = join(examples, template)
  const readingRoom = template === 'reading-room'
  const embedded = template === 'embedded'
  await mkdir(output, { recursive: true })
  const shared = ['scripts/sync-icons.js', 'docs/mobile-acceptance.md', 'docs/dependency-security.md', 'eslint.config.js', '.gitignore', 'LICENSE']
  if (!embedded) shared.push('src', 'scripts/uni.js', 'scripts/theme-icons.js', 'index.html', 'vite.config.js')
  for (const path of shared) {
    await cp(join(root, path), join(output, path), { recursive: true })
  }
  const files = ['src', 'check-h5.js']
  if (template === 'basic') files.push('check-mobile.js')
  if (readingRoom) files.push('vite.config.js', 'server.js')
  if (embedded) {
    await writePocketModule(join(output, 'src/uni_modules/nova-pocket'))
    files.push('index.html', 'vite.config.js', 'check-module-upgrade.js')
  }
  for (const path of files) {
    await cp(join(example, path), join(output, path), { recursive: true })
  }
  await cp(join(example, 'standalone.md'), join(output, 'README.md'))

  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
  pkg.name = readingRoom ? 'qinghe-reading-room' : 'nova-pocket-' + template
  const { scripts } = pkg
  pkg.scripts = {
    'dev:h5': embedded ? 'uni' : scripts['dev:h5'],
    'build:h5': embedded ? 'uni build' : scripts['build:h5'],
    'build:mp-weixin': embedded ? 'uni build -p mp-weixin' : scripts['build:mp-weixin'],
    'check:h5': 'node check-h5.js',
    lint: 'eslint src scripts check-h5.js vite.config.js' + (template === 'basic' ? ' check-mobile.js' : '') + (readingRoom ? ' server.js' : ''),
  }
  if (embedded) {
    pkg.scripts['check:module-upgrade'] = 'node check-module-upgrade.js'
    pkg.scripts.lint += ' check-module-upgrade.js'
    pkg.imports = { '#pocket/types': { types: './src/uni_modules/nova-pocket/pocket-types.d.ts' } }
  }
  pkg.scripts['icons:check'] = scripts['icons:check'] + (embedded ? ' --module' : '')
  pkg.scripts['icons:sync'] = scripts['icons:sync'] + (embedded ? ' --module' : '')
  if (readingRoom) pkg.scripts.api = 'node server.js'
  lock.name = lock.packages[''].name = pkg.name
  await writeFile(join(output, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
  await writeFile(join(output, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n')
}
