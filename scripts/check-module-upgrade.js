import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeProject } from '../examples/projects.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const { name, version } = JSON.parse(await readFile(join(root, 'module/package.json'), 'utf8'))
const baselines = JSON.parse(await readFile(join(root, 'test/fixtures/upgrade-baselines.json'), 'utf8'))
const [older = join(root, 'test/fixtures', baselines[0].file),
  newer = join(root, 'dist/module', name + '-' + version + '.tgz')] = process.argv.slice(2)
const project = await mkdtemp(join(tmpdir(), 'nova-pocket-upgrade-example-'))
try {
  await writeProject(project, 'embedded')
  execFileSync(process.execPath, ['check-module-upgrade.js', resolve(older), resolve(newer)], { cwd: project, stdio: 'inherit' })
} finally {
  await rm(project, { recursive: true, force: true })
}
