import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writePocketModule } from './pocket-module.js'

const destination = fileURLToPath(new URL('../dist/module/', import.meta.url))
const stage = await mkdtemp(join(tmpdir(), 'nova-pocket-module-'))
try {
  await writePocketModule(stage)
  await mkdir(destination, { recursive: true })
  execFileSync(process.execPath, [process.env.npm_execpath, 'pack', '--pack-destination', destination, '--silent'], {
    cwd: stage, stdio: 'inherit',
  })
  console.log('用户中心模块已打包到 ' + destination)
} finally {
  await rm(stage, { recursive: true, force: true })
}
