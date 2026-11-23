import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import { setImmediate as flush } from 'node:timers/promises'
import { effectScope, ref } from 'vue'

register('../scripts/vue-unit-loader.js', import.meta.url)
const h5 = await import('../src/use-leave-confirmation.js?platform=h5')
const weixin = await import('../src/use-leave-confirmation.js?platform=mp-weixin')

function form(t, runtime, globals) {
  const hooks = {}, dialogs = [], hints = []
  const mocks = {
    pageHooks: hooks,
    uni: { showModal: options => dialogs.push(options), showToast: ({ title }) => hints.push(title) },
    ...globals,
  }
  const originals = Object.entries(mocks).map(([key, value]) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, value })
    return [key, descriptor]
  })
  const dirty = ref(false)
  const scope = effectScope()
  const leave = scope.run(() => runtime.useLeaveConfirmation(() => dirty.value, '放弃草稿？', '取消后继续编辑。'))
  t.after(() => {
    hooks.onUnload()
    scope.stop()
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  return { hooks, dialogs, dirty, leave, hints }
}

function browserHistory() {
  const browser = new globalThis.EventTarget()
  const steps = []
  browser.history = { state: { position: 7 }, go: delta => steps.push(delta) }
  function pop(position) {
    browser.history.state = { position }
    browser.dispatchEvent(Object.assign(new globalThis.Event('popstate'), { state: browser.history.state }))
  }
  function unloading() {
    const event = new globalThis.Event('beforeunload', { cancelable: true })
    Object.defineProperty(event, 'returnValue', { writable: true })
    browser.dispatchEvent(event)
    return event.defaultPrevented
  }
  return { browser, pop, steps, unloading }
}

test('H5 restores a multi-entry traversal and keeps a single confirmation while the user retries Back', async t => {
  const { browser, pop, steps } = browserHistory()
  const { hooks, dialogs, dirty } = form(t, h5, { window: browser })
  h5.installHistoryGuard()
  const routed = []
  browser.addEventListener('popstate', event => routed.push(event.state.position))
  hooks.onShow()
  dirty.value = true

  pop(4)
  pop(7)
  pop(6)
  pop(7)
  assert.deepEqual(steps, [3, 1])
  assert.deepEqual(routed, [])
  assert.equal(dialogs.length, 1)
  dialogs[0].success({ confirm: false })
  await flush()
  assert.equal(browser.history.state.position, 7)
  assert.equal(dirty.value, true)

  pop(4)
  pop(7)
  dialogs[1].success({ confirm: true })
  await flush()
  assert.deepEqual(steps, [3, 1, 3, -3])
  pop(4)
  assert.deepEqual(routed, [4])
})

test('H5 waits for restoration before replaying a confirmed navigation and cleans native unload prompts', async t => {
  const { browser, pop, steps, unloading } = browserHistory()
  const { hooks, dialogs, dirty, leave } = form(t, h5, { window: browser })
  h5.installHistoryGuard()
  hooks.onShow()
  assert.equal(unloading(), false)
  dirty.value = true
  assert.equal(unloading(), true)

  let left = false
  const pending = leave(() => { left = true })
  pop(5)
  dialogs[0].success({ confirm: true })
  await pending
  assert.equal(left, false)
  assert.deepEqual(steps, [2])
  pop(7)
  await flush()
  assert.equal(left, true)
  assert.equal(unloading(), false)
  hooks.onHide()
  assert.equal(unloading(), false)
  hooks.onShow()
  assert.equal(unloading(), true)
  hooks.onUnload()
  assert.equal(unloading(), false)
})

test('H5 re-arms the unload prompt if the confirmed app navigation fails', async t => {
  const { browser, unloading } = browserHistory()
  const { hooks, dialogs, dirty, leave, hints } = form(t, h5, { window: browser })
  hooks.onShow()
  dirty.value = true
  const pending = leave(() => { throw new Error('navigation failed') })
  dialogs[0].success({ confirm: true })
  await pending
  assert.equal(unloading(), true)
  assert.deepEqual(hints, ['暂时无法返回，请重试'])
})

function weixinPrompt() {
  const calls = []
  const wx = {
    enableAlertBeforeUnload: options => calls.push(['enable', options]),
    disableAlertBeforeUnload: options => calls.push(['disable', options]),
  }
  return { wx, calls }
}

test('WeChat waits for native prompt disable to complete before navigating', async t => {
  const { wx, calls } = weixinPrompt()
  const { hooks, dialogs, dirty, leave } = form(t, weixin, { wx, getCurrentPages: () => [{}, {}] })
  hooks.onShow()
  dirty.value = true
  await flush()
  assert.deepEqual(calls.map(([op]) => op), ['enable'])
  assert.equal(calls[0][1].message, '放弃草稿？')

  const pending = leave(() => calls.push(['navigate']))
  dialogs[0].success({ confirm: true })
  await flush()
  assert.deepEqual(calls.map(([op]) => op), ['enable'])
  calls[0][1].complete()
  await flush()
  assert.deepEqual(calls.map(([op]) => op), ['enable', 'disable'])
  calls[1][1].complete()
  await pending
  assert.deepEqual(calls.map(([op]) => op), ['enable', 'disable', 'navigate'])
})

test('WeChat keeps the prompt armed on cancel, disables it on hide, and skips it on the root page', async t => {
  const { wx, calls } = weixinPrompt()
  let depth = 1
  const { hooks, dialogs, dirty, leave } = form(t, weixin, { wx, getCurrentPages: () => Array(depth) })
  hooks.onShow()
  dirty.value = true
  await flush()
  assert.deepEqual(calls, [])
  depth = 2
  hooks.onShow()
  await flush()
  const pending = leave(() => assert.fail('cancelled leave navigated'))
  dialogs[0].success({ confirm: false })
  await pending
  assert.deepEqual(calls.map(([op]) => op), ['enable'])
  calls[0][1].complete()
  hooks.onHide()
  await flush()
  assert.deepEqual(calls.map(([op]) => op), ['enable', 'disable'])
  calls[1][1].complete()
})
