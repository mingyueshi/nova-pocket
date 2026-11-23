import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

const run = promisify(execFile)

test('candidate archives come from the recorded commit and cannot replace a different existing bundle', async t => {
  const repo = await mkdtemp(join(tmpdir(), 'nova-candidate-test-'))
  t.after(() => rm(repo, { recursive: true, force: true }))
  for (const path of ['docs', 'examples', 'module', 'scripts', 'src', 'test/fixtures', 'LICENSE', 'index.html',
    '.gitignore', 'eslint.config.js', 'vite.config.js', 'package.json', 'package-lock.json']) {
    await cp(new URL('../' + path, import.meta.url), join(repo, path), { recursive: true })
  }
  const git = (...args) => run('git', args, { cwd: repo })
  await git('init', '--quiet')
  await git('add', '.')
  await git('-c', 'user.name=Candidate Test', '-c', 'user.email=test@example.test', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Baseline')
  const commit = (await git('rev-parse', 'HEAD')).stdout.trim()
  const guide = await readFile(join(repo, 'scripts/creator/README.md'), 'utf8')
  await writeFile(join(repo, 'scripts/creator/README.md'), 'local changes')
  await writeFile(join(repo, 'src/untracked.txt'), 'local file')
  const pack = () => run('npm', ['run', 'pack:candidate'], { cwd: repo, shell: process.platform === 'win32' })
  await pack()
  const dir = join(repo, 'dist/candidates', commit)
  const manifest = JSON.parse(await readFile(join(dir, 'candidate.json'), 'utf8'))
  assert.equal(manifest.commit, commit)
  for (const item of Object.values(manifest.packages)) {
    assert.ok(item.file.includes(commit))
    assert.equal(createHash('sha256').update(await readFile(join(dir, item.file))).digest('hex'), item.sha256)
  }
  const creator = join(dir, manifest.packages.creator.file)
  assert.equal((await run('tar', ['-xOf', creator, 'package/README.md'])).stdout, guide)
  assert.doesNotMatch((await run('tar', ['-tzf', creator])).stdout, /untracked\.txt/)
  await pack()
  const damaged = join(dir, manifest.packages.module.file)
  await writeFile(damaged, 'different bytes')
  await assert.rejects(pack(), /已有候选附件内容不同/)
  assert.equal(await readFile(damaged, 'utf8'), 'different bytes')
  assert.deepEqual(await readdir(join(repo, 'dist/candidates')), [commit])
})
