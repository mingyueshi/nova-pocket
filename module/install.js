#!/usr/bin/env node
import { cp, lstat, mkdir, readFile, realpath, rename, rm, rmdir } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = fileURLToPath(new URL('./', import.meta.url))
const metadata = async dir => JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))

async function statIfPresent(path) {
  return lstat(path).catch(error => {
    if (error.code !== 'ENOENT') throw error
  })
}

async function install(project) {
  const src = join(await realpath(resolve(project)), 'src')
  if (!(await statIfPresent(src))?.isDirectory() || !(await statIfPresent(join(src, 'pages.json')))?.isFile()) {
    throw new Error('请指定含 src/pages.json 的 UniApp 项目')
  }
  if (!(await statIfPresent(join(source, 'components/AccountScreen.vue')))?.isFile()) {
    throw new Error('请使用 pack:module 生成的完整模块包')
  }
  const modules = join(src, 'uni_modules')
  await mkdir(modules, { recursive: true })
  if (!(await lstat(modules)).isDirectory()) throw new Error('uni_modules 需为宿主内的实际目录')
  const { id, name, version } = await metadata(source)
  const target = join(modules, id)
  if (await realpath(source) === target) throw new Error('请从新版本的压缩包运行安装命令')
  const lock = join(modules, '.nova-pocket-install')
  await mkdir(lock).catch(error => {
    if (error.code !== 'EEXIST') throw error
    throw new Error('安装目录已锁定。若上次安装被中断，请先核对 ' + lock + ' 中的 previous 备份')
  })
  const incoming = join(lock, 'incoming')
  const previous = join(lock, 'previous')
  try {
    const existing = await statIfPresent(target)
    if (existing) {
      const prior = existing.isDirectory() && await metadata(target)
      if (prior.id !== id || prior.name !== name) throw new Error('同名目录属于其他内容：' + target)
    }
    await cp(source, incoming, { recursive: true, filter: path => basename(path) !== 'node_modules' })
    if (existing) await rename(target, previous)
    try {
      await rename(incoming, target)
    } catch (error) {
      if (existing) await rename(previous, target)
      throw error
    }
    if (existing) await rm(previous, { recursive: true })
    console.log('已安装 ' + id + ' ' + version + ' → ' + target)
  } finally {
    await rm(incoming, { recursive: true, force: true })
    // Keep the previous version and its lock if restoring or cleaning the backup failed.
    if (!(await statIfPresent(previous))) await rmdir(lock)
  }
}

if (process.argv.length !== 3) {
  console.error('用法：install-nova-pocket <已有 UniApp 项目目录>')
  process.exitCode = 1
} else {
  await install(process.argv[2]).catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
