import { readFile, writeFile, readdir } from 'node:fs/promises'
import { iconNames, iconTones } from '../src/icons.js'

const upstream = new URL('../node_modules/lucide-static/', import.meta.url)
const output = new URL('../src/static/icons/', import.meta.url)
const checkOnly = process.argv.includes('--check')
const assets = new Map([['LICENSE.txt', await readFile(new URL('LICENSE', upstream), 'utf8')]])

for (const name of iconNames) {
  const svg = await readFile(new URL('icons/' + name + '.svg', upstream), 'utf8')
  if (!svg.includes('stroke="currentColor"')) throw new Error('Missing stroke in Lucide icon: ' + name)
  for (const [tone, color] of Object.entries(iconTones)) {
    assets.set(name + '-' + tone + '.svg', svg.replaceAll('="currentColor"', '="' + color + '"'))
  }
}

const mismatches = []
for (const [file, expected] of assets) {
  const path = new URL(file, output)
  if (checkOnly) {
    const actual = await readFile(path, 'utf8').catch(error => {
      if (error.code !== 'ENOENT') throw error
    })
    if (actual !== expected) mismatches.push(file)
  } else {
    await writeFile(path, expected)
  }
}

for (const file of await readdir(output)) {
  if (file.endsWith('.svg') && !assets.has(file)) mismatches.push(file + ' (unused)')
}

if (mismatches.length) {
  console.error('Icon assets do not match the manifest:', mismatches.join(', '))
  process.exitCode = 1
}
