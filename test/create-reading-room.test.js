import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const cli = fileURLToPath(new URL('../scripts/create-reading-room.js', import.meta.url))
const create = (...args) => run(process.execPath, [cli, ...args])

async function tempDirectory(t) {
  const dir = await mkdtemp(join(tmpdir(), 'reading-room-test-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return dir
}

test('an empty destination receives a standalone project with the locked dependencies and both licenses', async t => {
  const dir = await tempDirectory(t)
  const target = join(dir, '读者 空间')
  await mkdir(target)
  await create(target)
  const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  const lock = JSON.parse(await readFile(join(target, 'package-lock.json'), 'utf8'))
  const original = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'))
  original.name = original.packages[''].name = pkg.name
  assert.deepEqual(lock, original)
  assert.deepEqual(pkg.dependencies, lock.packages[''].dependencies)
  assert.deepEqual(pkg.devDependencies, lock.packages[''].devDependencies)
  for (const file of ['LICENSE', 'src/static/icons/LICENSE.txt']) {
    assert.deepEqual(await readFile(join(target, file)), await readFile(new URL('../' + file, import.meta.url)))
  }
  for (const file of ['README.md', 'server.js', 'check-h5.js', 'src/pocket-services/loans/index.vue']) {
    assert.ok((await lstat(join(target, file))).isFile())
  }
  assert.deepEqual(await readdir(dir), ['读者 空间'])
})

test('existing files, hidden contents and directory links are preserved', async t => {
  const dir = await tempDirectory(t)
  const occupied = join(dir, 'occupied')
  const empty = join(dir, 'empty')
  const link = join(dir, 'link')
  await mkdir(occupied)
  await mkdir(empty)
  const file = join(occupied, '.keep')
  await writeFile(file, '保留')
  await symlink(empty, link, 'junction')
  for (const target of [file, occupied, link]) await assert.rejects(create(target), /新目录或空目录/)
  assert.equal(await readFile(file, 'utf8'), '保留')
  assert.deepEqual(await readdir(occupied), ['.keep'])
  assert.ok((await lstat(link)).isSymbolicLink())
  assert.deepEqual(await readdir(empty), [])
})

test('basic includes the local account adapter, its own README and no reading-room service', async t => {
  const dir = await tempDirectory(t)
  const target = join(dir, 'basic')
  await create('--template', 'basic', target)
  const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  const lock = JSON.parse(await readFile(join(target, 'package-lock.json'), 'utf8'))
  assert.equal(pkg.name, 'nova-pocket-basic')
  assert.equal(lock.packages[''].name, pkg.name)
  assert.equal(pkg.scripts.api, undefined)
  assert.match(await readFile(join(target, 'README.md'), 'utf8'), /demo@example\.test/)
  assert.deepEqual(await readFile(join(target, 'src/adapters/index.js')), await readFile(new URL('../src/adapters/index.js', import.meta.url)))
  for (const path of ['server.js', 'src/pocket-services/loans', 'src/adapters/request.js']) {
    await assert.rejects(lstat(join(target, path)), { code: 'ENOENT' })
  }
  await writeFile(join(target, 'README.md'), '自己的账户中心')
  await assert.rejects(create(target, '--template', 'reading-room'), /新目录或空目录/)
  assert.equal(await readFile(join(target, 'README.md'), 'utf8'), '自己的账户中心')
})

test('basic keeps legacy demo reads and shares while adding three pages of history', async t => {
  const project = join(await tempDirectory(t), 'basic')
  await create('--template', 'basic', project)
  const { createDemoAdapters } = await import(pathToFileURL(join(project, 'src/adapters/demo.js')))
  let snapshot = { version: 1, user: { id: 'demo', nickname: '江舟', mode: 'member' }, guest: false,
    expiresAt: Date.now() + 60000, read: ['welcome', 'profile', 'appearance', 'guide'] }
  const storage = { load: () => snapshot, save: value => { snapshot = value } }
  const { auth, messages } = createDemoAdapters(storage)
  assert.equal(auth.getSession().nickname, '江舟')
  const ids = []
  let cursor = null
  for (let page = 0; page < 3; page++) {
    const batch = messages.listPage({ cursor, limit: 20 })
    assert.equal(batch.items.length, 16)
    assert.equal(batch.unreadCount, 1)
    ids.push(...batch.items.map(item => item.id))
    cursor = batch.nextCursor
  }
  assert.equal(cursor, null)
  assert.equal(new Set(ids).size, 48)
  assert.equal(ids[39], 'security')
  assert.equal(messages.get('welcome').read, true)
  assert.equal(messages.get('security').read, false)
  messages.markRead(['security'])
  assert.equal(createDemoAdapters(storage).messages.listPage({ cursor: null, limit: 20 }).unreadCount, 0)
})

test('unsupported and conflicting template options fail before creating directories', async t => {
  const dir = await tempDirectory(t)
  const target = join(dir, 'new-parent', 'project')
  for (const args of [['--template', 'typo'], ['--template=../basic'], ['--template=basic', '--template=reading-room']]) {
    await assert.rejects(create(target, ...args), /basic\|reading-room/)
  }
  assert.deepEqual(await readdir(dir), [])
})

test('two concurrent creators cannot overwrite a project or leave staging files', async t => {
  const dir = await tempDirectory(t)
  const target = join(dir, 'new')
  const attempts = await Promise.allSettled([create(target), create(target)])
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1)
  await writeFile(join(target, 'README.md'), '下游修改')
  await assert.rejects(create(target), /新目录或空目录/)
  assert.equal(await readFile(join(target, 'README.md'), 'utf8'), '下游修改')
  assert.deepEqual(await readdir(dir), ['new'])
})
