import assert from 'node:assert/strict'
import test from 'node:test'
import { configuredBlocks, resolveBlocks } from '../src/account-blocks.js'

const loans = ['loans', '我的借阅', 'layers']
const entries = new Map([['loans', loans]])
const groups = { shortcuts: { rows: [loans] }, management: { rows: [loans] }, more: { rows: [] }, demo: { rows: [] } }
function resolve(config, page, layout = 'overview', host = false) {
  return resolveBlocks(configuredBlocks(config), { page, layout, embedded: host, groups, entries, statusAvailable: true })
}

test('explicit page blocks keep their order, filter disabled entries and omit empty menus', () => {
  const config = { home: [
    { type: 'menu', title: '阅读', entries: ['orders', 'loans'] },
    { type: 'status', enabled: false }, 'business', { type: 'identity', actions: false },
    { type: 'menu', title: '已关闭', entries: ['orders'] },
  ], mine: [] }
  const blocks = resolve(config, 'home', 'minimal')
  assert.deepEqual(blocks.map(block => block.type), ['menu', 'business', 'identity'])
  assert.deepEqual(blocks[0].rows, [loans])
  assert.equal(blocks[2].actions, false)
  assert.deepEqual(resolve(config, 'mine'), [])
})

test('omitting a page preserves the layout presets and embedded business slot', () => {
  const types = (page, layout, host) => resolve(undefined, page, layout, host).map(block => block.type)
  assert.deepEqual(types('home', 'overview'), ['identity', 'status', 'shortcuts'])
  assert.deepEqual(types('home', 'shortcuts'), ['shortcuts', 'identity'])
  assert.deepEqual(types('home', 'minimal'), ['identity', 'management'])
  assert.deepEqual(types('mine', 'shortcuts', true), ['shortcuts', 'identity', 'management', 'business'])
  assert.deepEqual(resolve({ home: [] }, 'mine').map(block => block.type), ['identity', 'management'])
})

test('invalid block definitions identify the configuration field', () => {
  for (const list of [['typo'], ['business', 'business'], [{ type: 'menu', title: '服务', entries: ['a', 'a'] }],
    [{ type: 'identity', enabled: 'false' }], [{ type: 'more', actions: true }]]) {
    assert.throws(() => configuredBlocks({ mine: list }), /blocks\.mine\[/)
  }
  assert.throws(() => configuredBlocks({ home: null }), /blocks\.home/)
})
