import { chmod, lstat, mkdir, mkdtemp, readdir, rename, rm, rmdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

async function create(target, writeProject) {
  const existing = await lstat(target).catch(error => {
    if (error.code !== 'ENOENT') throw error
  })
  if (existing && (!existing.isDirectory() || (await readdir(target)).length)) {
    throw new Error('目标已存在，请指定新目录或空目录：' + target)
  }
  const parent = dirname(target)
  await mkdir(parent, { recursive: true })
  const stage = await mkdtemp(join(parent, '.reading-room-'))
  const project = join(stage, 'project')
  try {
    await writeProject(project)
    if (existing) {
      await chmod(project, existing.mode & 0o777)
      // Windows requires an absent destination. rmdir only accepts an empty directory.
      if (process.platform === 'win32') await rmdir(target)
    }
    // A competing creator or newly added file makes the final rename fail.
    await rename(project, target)
  } finally {
    await rm(stage, { recursive: true, force: true })
  }
}

export async function runCreator(writeProject, base = process.cwd()) {
  const usage = '用法：create-nova-pocket <目标目录>（新目录或空目录）'
  try {
    const args = process.argv.slice(2)
    if (args.length === 1 && args[0] === '--help') return console.log(usage)
    if (args.length !== 1 || !args[0].trim() || args[0].startsWith('--')) throw new Error(usage)
    const target = resolve(base, args[0])
    await create(target, writeProject)
    console.log('青禾书房已生成到 ' + target + '\n请在新项目中运行 npm ci，启动步骤见 README.md。')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
