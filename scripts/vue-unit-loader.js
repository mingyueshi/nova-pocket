import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { compileScript, parse } from 'vue/compiler-sfc'

// Use the UniApp compiler's own condition handling in Node tests.
const fromTest = createRequire(import.meta.url)
const require = createRequire(fromTest.resolve('@dcloudio/vite-plugin-uni/package.json'))
const { initPreContext, preHtml, preJs } = require('@dcloudio/uni-cli-shared')
const sourceRoot = new URL('../src/', import.meta.url).href
const platformTags = new Set(['view', 'text', 'image', 'scroll-view', 'picker', 'switch'])
const isCustomElement = tag => platformTags.has(tag)
const demoFlags = Object.fromEntries(['STATS', 'ORDERS', 'REVIEWS', 'RECORDS'].map(key => ['NOVA_POCKET_DEMO_' + key, true]))

export function resolve(specifier, context, nextResolve) {
  if (specifier === '@dcloudio/uni-app' && context.parentURL?.startsWith(sourceRoot)) {
    const hooks = ['onShow', 'onHide', 'onUnload'].map(name =>
      'export const ' + name + ' = callback => { globalThis.pageHooks.' + name + ' = callback }')
    return { url: 'data:text/javascript,' + encodeURIComponent(hooks.join('\n')), shortCircuit: true }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith(sourceRoot)) return nextLoad(url, context)
  const file = new URL(url)
  const filename = fileURLToPath(file)
  const component = filename.endsWith('.vue')
  if (!component && !file.searchParams.has('platform') && !filename.endsWith('/use-header-padding.js')) {
    return nextLoad(url, context)
  }
  const content = await readFile(file, 'utf8')
  initPreContext(file.searchParams.get('platform') || 'h5', demoFlags)
  let source = preJs(content, filename)
  if (component) {
    const { descriptor, errors } = parse(preHtml(source, filename), { filename, templateParseOptions: { isCustomElement } })
    if (errors.length) throw new Error('Cannot compile ' + filename + ': ' + errors.join('\n'))
    source = compileScript(descriptor, {
      id: filename,
      inlineTemplate: true,
      templateOptions: { compilerOptions: { hoistStatic: false, isCustomElement } },
    }).content
  }
  return { source, format: 'module', shortCircuit: true }
}
