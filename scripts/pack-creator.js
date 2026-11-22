import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeReadingRoom } from '../examples/reading-room/project.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const { version, license, engines } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const destination = join(root, 'dist/creator')
const stage = await mkdtemp(join(tmpdir(), 'nova-pocket-pack-'))
try {
  const template = join(stage, 'template')
  await writeReadingRoom(template)
  // Preserve project metadata that npm can omit or interpret when building a package.
  await rename(join(template, '.gitignore'), join(template, 'gitignore.template'))
  await rename(join(template, 'package-lock.json'), join(template, 'package-lock.json.template'))
  for (const file of ['cli.js', 'run.js', 'README.md']) {
    await cp(join(root, 'scripts/creator', file), join(stage, file))
  }
  await cp(join(root, 'LICENSE'), join(stage, 'LICENSE'))
  const manifest = {
    name: 'create-nova-pocket', version, private: true, type: 'module', license, engines,
    bin: { 'create-nova-pocket': 'cli.js' },
  }
  await writeFile(join(stage, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
  await mkdir(destination, { recursive: true })
  execFileSync(process.execPath, [process.env.npm_execpath, 'pack', '--pack-destination', destination, '--silent'], {
    cwd: stage, stdio: 'inherit',
  })
  console.log('创建器已打包到 ' + destination)
} finally {
  await rm(stage, { recursive: true, force: true })
}
