import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const commit = execFileSync('git', ['rev-parse', '--verify', 'HEAD^{commit}'], { cwd: root, encoding: 'utf8' }).trim()
const parent = join(root, 'dist/candidates')
await mkdir(parent, { recursive: true })
const destination = join(parent, commit)
const stage = await mkdtemp(join(parent, '.pack-'))
const source = await mkdtemp(join(tmpdir(), 'nova-pocket-source-'))
const digest = async file => createHash('sha256').update(await readFile(file)).digest('hex')

async function pack(kind, metadataPath, changelog) {
  execFileSync(process.execPath, [process.env.npm_execpath, 'run', 'pack:' + kind], { cwd: source, stdio: 'inherit' })
  const metadata = JSON.parse(await readFile(join(source, metadataPath), 'utf8'))
  const name = kind === 'creator' ? 'create-nova-pocket' : metadata.name
  const { version } = metadata
  const archive = join(source, 'dist', kind, name + '-' + version + '.tgz')
  const packed = JSON.parse(execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }))
  assert.equal(packed.name, name)
  assert.equal(packed.version, version)
  const notes = await readFile(join(source, changelog), 'utf8')
  const section = notes.split(/^## /m).find(text => text.startsWith(version + '\n'))
  if (!section?.slice(version.length).trim()) throw new Error('缺少 ' + name + ' ' + version + ' 的版本说明')
  const file = name + '-' + version + '-g' + commit + '.tgz'
  await copyFile(archive, join(stage, file))
  return { name, version, file, sha256: await digest(archive), changes: section.slice(version.length).trim() }
}

try {
  // Pack a committed tree. Local edits, untracked icons and old dist files cannot enter the candidate.
  const snapshot = join(stage, 'source.tar')
  execFileSync('git', ['archive', '--format=tar', '--output=' + snapshot, commit], { cwd: root })
  execFileSync('tar', ['-xf', snapshot, '-C', source])
  await rm(snapshot)
  const creator = await pack('creator', 'package.json', 'scripts/creator/changelog.md')
  const module = await pack('module', 'module/package.json', 'module/changelog.md')
  const fixtures = join(source, 'test/fixtures')
  const baselines = JSON.parse(await readFile(join(fixtures, 'upgrade-baselines.json'), 'utf8'))
  const upgradeBaselines = []
  await mkdir(join(stage, 'baseline'))
  for (const { file, sha256 } of baselines) {
    const target = 'baseline/' + file
    await copyFile(join(fixtures, file), join(stage, target))
    assert.equal(await digest(join(stage, target)), sha256, '旧模块包校验失败：' + file)
    upgradeBaselines.push({ file: target, sha256 })
  }
  const upgradeBaseline = upgradeBaselines[0]
  const manifest = { commit, packages: { creator, module }, upgradeBaseline, upgradeBaselines }
  await writeFile(join(stage, 'candidate.json'), JSON.stringify(manifest, null, 2) + '\n')
  const guide = await readFile(join(source, 'docs/candidate-usage.md'), 'utf8')
  await writeFile(join(stage, 'README.md'), guide.replaceAll('{{creator}}', creator.file)
    .replaceAll('{{module}}', module.file).replaceAll('{{baseline}}', upgradeBaseline.file).replaceAll('{{commit}}', commit)
    .replaceAll('{{creatorSha256}}', creator.sha256).replaceAll('{{moduleSha256}}', module.sha256))

  const files = [creator.file, module.file, ...upgradeBaselines.map(item => item.file), 'candidate.json', 'README.md']
  const sums = []
  for (const file of files) sums.push(await digest(join(stage, file)) + '  ' + file)
  await writeFile(join(stage, 'SHA256SUMS'), sums.join('\n') + '\n')
  try {
    await rename(stage, destination)
  } catch (error) {
    if (!['ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error
    // Reuse an identical candidate, including on concurrent builds. Preserve differing evidence.
    assert.deepEqual((await readdir(destination, { recursive: true })).sort(), (await readdir(stage, { recursive: true })).sort())
    for (const file of [...files, 'SHA256SUMS']) {
      assert.equal(await digest(join(destination, file)), await digest(join(stage, file)), '已有候选附件内容不同：' + file)
    }
  }
  console.log('候选附件：' + destination)
} finally {
  await rm(source, { recursive: true, force: true })
  await rm(stage, { recursive: true, force: true })
}
