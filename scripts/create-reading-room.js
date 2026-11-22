import { chmod, lstat, mkdir, mkdtemp, readdir, rename, rm, rmdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { writeReadingRoom } from '../examples/reading-room/project.js'

async function create(target) {
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
    await writeReadingRoom(project)
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

try {
  const args = process.argv.slice(2)
  if (args.length !== 1 || !args[0].trim()) throw new Error('用法：npm run create -- <目标目录>')
  const target = resolve(process.env.INIT_CWD || process.cwd(), args[0])
  await create(target)
  console.log('青禾书房已生成到 ' + target + '\n请在新项目中运行 npm ci，启动步骤见 README.md。')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
