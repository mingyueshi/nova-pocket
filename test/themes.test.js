import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { writeProject } from '../examples/projects.js'
import { iconSource } from '../src/icons.js'
import { configuredThemes } from '../src/themes.js'

const theme = { base: 'teal', label: '茶色' }

test('theme colors inherit independently and each accent resolves to a local icon', () => {
  const themes = configuredThemes({ defaultTheme: 'tea', themes: {
    tea: { ...theme, brand: '#804322', heroStyle: 'solid' }, leaf: theme,
  } })
  assert.equal(themes.get('tea').base, 'teal')
  assert.deepEqual(themes.get('tea').style, { '--brand': '#804322' })
  assert.equal(themes.get('tea').iconAccent, '#804322')
  assert.equal(themes.get('leaf').iconAccent, themes.get('teal').iconAccent)
  assert.equal(iconSource('bell', '#804322'), '/static/pocket-accents/bell-804322.svg')
  assert.equal(iconSource('bell', themes.get('dark').iconAccent), '/static/icons/bell-light.svg')
  assert.equal(iconSource('unknown', '#ABCDEF'), '/static/pocket-accents/circle-help-abcdef.svg')
})

test('invalid themes identify the field before rendering', () => {
  for (const [key, item, field] of [
    ['teal', theme, 'themes.teal'], ['tea', { ...theme, base: 'drak' }, 'themes.tea.base'],
    ['tea', { ...theme, label: '' }, 'themes.tea.label'], ['tea', { ...theme, iconAccent: 'red' }, 'themes.tea.iconAccent'],
    ['tea', { ...theme, heroStyle: 'plain' }, 'themes.tea.heroStyle'], ['tea', { ...theme, brnad: '#804322' }, 'themes.tea.brnad'],
  ]) {
    assert.throws(() => configuredThemes({ defaultTheme: 'teal', themes: { [key]: item } }),
      error => error.message.includes('pocket.config.js: ' + field + ' '))
  }
})

test('both template build commands fail on a misspelled defaultTheme before invoking UniApp', async t => {
  const project = mkdtempSync(join(tmpdir(), 'pocket-invalid-theme-'))
  t.after(() => rmSync(project, { recursive: true, force: true }))
  await writeProject(project, 'basic')
  writeFileSync(join(project, 'src/pocket.config.js'), "export default { defaultTheme: 'bleu' }\n")
  for (const args of [['build'], ['build', '-p', 'mp-weixin']]) {
    assert.throws(() => execFileSync(process.execPath, ['scripts/uni.js', ...args], { cwd: project, stdio: 'pipe' }),
      error => error.status !== 0 && error.stderr.toString().includes('pocket.config.js: defaultTheme 找不到主题 bleu'))
  }
})
