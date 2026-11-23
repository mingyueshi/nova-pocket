import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'
import { writePocketModule } from '../scripts/pocket-module.js'

const run = promisify(execFile)
test('module installation preserves foreign directories and replaces only the managed copy', async t => {
  const work = await mkdtemp(join(tmpdir(), 'pocket-install-test-'))
  t.after(() => rm(work, { recursive: true, force: true }))
  const source = join(work, 'package')
  const host = join(work, '宿主')
  const modules = join(host, 'src/uni_modules')
  const target = join(modules, 'nova-pocket')
  await writePocketModule(source)
  await mkdir(target, { recursive: true })
  await writeFile(join(host, 'src/pages.json'), '{}')
  await writeFile(join(target, 'package.json'), '{"id":"other","name":"other"}')
  const install = () => run(process.execPath, [join(source, 'install.js'), host])

  await assert.rejects(install, /同名目录/)
  assert.equal(await readFile(join(target, 'package.json'), 'utf8'), '{"id":"other","name":"other"}')
  assert.deepEqual(await readdir(modules), ['nova-pocket'])
  await rm(target, { recursive: true })

  await symlink(source, target, 'junction')
  await assert.rejects(install, /同名目录/)
  assert.ok((await lstat(target)).isSymbolicLink())
  await rm(target)

  await install()
  await writeFile(join(target, 'retired-component.vue'), '')
  await mkdir(join(modules, '.nova-pocket-install'))
  await assert.rejects(install, /锁定/)
  assert.ok((await lstat(join(target, 'retired-component.vue'))).isFile())
  await rm(join(modules, '.nova-pocket-install'), { recursive: true })
  await install()
  await assert.rejects(lstat(join(target, 'retired-component.vue')), { code: 'ENOENT' })
  assert.deepEqual(await readFile(join(target, 'pages/account/detail.vue')), await readFile(join(source, 'pages/account/detail.vue')))
  assert.equal(await readFile(join(host, 'src/pages.json'), 'utf8'), '{}')
  assert.deepEqual(await readdir(modules), ['nova-pocket'])
})
