import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))
const args = process.argv.slice(2)
if (args.length !== 2) throw new Error('用法：npm run check:module-upgrade -- <旧模块包> <新模块包>')
const [older, newer] = args.map(path => resolve(path))
const work = await mkdtemp(join(tmpdir(), 'nova-pocket-upgrade-'))
const project = join(work, 'trail')
const moduleDir = 'src/uni_modules/nova-pocket'
const npm = (...args) => execFileSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: project, stdio: 'inherit' })
const read = path => readFile(join(project, path), 'utf8')
const json = async path => JSON.parse(await read(path))

async function hostFiles(dir = '') {
  const files = {}
  for (const item of await readdir(join(project, dir), { withFileTypes: true })) {
    const path = dir ? dir + '/' + item.name : item.name
    if (['dist', 'node_modules', moduleDir].includes(path)) continue
    if (item.isDirectory()) Object.assign(files, await hostFiles(path))
    else files[path] = createHash('sha256').update(await readFile(join(project, path))).digest('hex')
  }
  return files
}

async function installAndBuild(archive) {
  npm('exec', '--offline', '--yes', '--package=' + resolve(archive), '--', 'install-nova-pocket', '.')
  const metadata = await json(moduleDir + '/package.json')
  const packed = JSON.parse(execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }))
  assert.equal(metadata.name, 'nova-pocket-module')
  assert.deepEqual(metadata, packed)
  npm('run', 'build:h5')
  npm('run', 'build:mp-weixin')
  const output = 'dist/build/mp-weixin/'
  const app = await json(output + 'app.json')
  assert.deepEqual(app.tabBar.list.map(tab => tab.pagePath), ['pages/trail/routes', 'pages/trail/mine'])
  for (const page of ['detail', 'profile']) {
    const path = 'uni_modules/nova-pocket/pages/account/' + page
    assert.ok(app.pages.includes(path))
    assert.ok((await read(output + path + '.wxml')).includes('account-screen'))
  }
  assert.ok((await read(output + 'uni_modules/nova-pocket/static/pocket-accents/bell-23594c.svg')).includes('#23594C'))
  return metadata.version
}

try {
  // Exercise the downloaded installer in a disposable host with no preinstalled account module.
  const excluded = new Set(['.git', '.build', 'dist', 'node_modules', moduleDir])
  await cp(root, project, { recursive: true, filter: path => !excluded.has(relative(root, path).split('\\').join('/')) })
  await mkdir(join(project, 'src/uni_modules/trail-weather'))
  await writeFile(join(project, 'src/uni_modules/trail-weather/index.js'), 'export const forecast = "晴"\n')
  const configPath = 'src/pocket.config.js'
  await writeFile(join(project, configPath), (await read(configPath)).replace('山岚步道', '青岩徒步'))
  npm('ci', '--no-audit', '--no-fund')
  const original = await hostFiles()
  await installAndBuild(newer)
  assert.deepEqual(await hostFiles(), original, '首次安装或构建改动了宿主文件')
  await rm(join(project, moduleDir), { recursive: true })
  const from = await installAndBuild(older)
  assert.deepEqual(await hostFiles(), original, '安装或构建改动了宿主文件')
  const oldH5 = join(work, 'previous-h5')
  await rename(join(project, 'dist/build/h5'), oldH5)
  const to = await installAndBuild(newer)
  assert.notEqual(from, to, '请提供两个不同版本的模块包')
  assert.deepEqual(await hostFiles(), original, '升级或构建改动了宿主文件')
  execFileSync(process.execPath, ['check-h5.js', oldH5], { cwd: project, stdio: 'inherit' })
  console.log('模块 ' + from + ' → ' + to + ' 升级通过，宿主文件逐字节一致。')
} finally {
  await rm(work, { recursive: true, force: true })
}
