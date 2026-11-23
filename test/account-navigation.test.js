import assert from 'node:assert/strict'
import test from 'node:test'
import config from '../src/pocket.config.js'
import hostedConfig from '../examples/embedded/src/pocket.config.js'
import * as standalone from '../src/account-navigation.js'

function routing(t) {
  const calls = []
  let pages = []
  globalThis.getCurrentPages = () => pages
  globalThis.uni = Object.fromEntries(['navigateTo', 'navigateBack', 'redirectTo', 'reLaunch', 'switchTab']
    .map(method => [method, options => calls.push([method, options])]))
  t.after(() => {
    delete globalThis.getCurrentPages
    delete globalThis.uni
    standalone.rootTab.value = standalone.firstTab
  })
  return {
    stack(...entries) { pages = entries.map(page => typeof page === 'string' ? { route: page } : page) },
    called(method, options) { assert.deepEqual(calls.splice(0), [[method, options]]) },
    unchanged() { assert.deepEqual(calls, []) },
  }
}

test('standalone login closes auth pages and preserves the intended record', t => {
  const api = routing(t)
  const target = standalone.accountTarget('message', 'record+1', 'messages')
  const detail = { route: 'pages/account/detail', options: { view: 'message', id: 'record+1', tab: 'messages' } }
  api.stack(detail, 'pages/auth/login', 'pages/auth/register')
  standalone.leaveAuthPages(target)
  api.called('navigateBack', { delta: 2 })

  api.stack('pages/index/index', 'pages/auth/login')
  standalone.leaveAuthPages(target)
  api.called('redirectTo', { url: standalone.targetUrl(target) })
  api.stack('pages/index/index', 'pages/auth/login', 'pages/auth/register')
  standalone.leaveAuthPages(target)
  api.called('reLaunch', { url: standalone.targetUrl(target) })
})

test('standalone tabs and record lists return through existing pages or provide a direct-entry fallback', t => {
  const api = routing(t)
  api.stack('pages/index/index')
  standalone.showAccountTab('messages')
  assert.equal(standalone.rootTab.value, 'messages')
  api.unchanged()
  api.stack('pages/index/index', 'pages/account/detail', 'pages/account/profile')
  standalone.showAccountTab('mine')
  api.called('navigateBack', { delta: 2 })
  assert.equal(standalone.rootTab.value, 'mine')

  const orders = standalone.accountTarget('orders', '', 'services')
  api.stack({ route: 'pages/account/detail', options: { view: 'orders' } }, 'pages/account/detail')
  standalone.returnToServiceList(orders)
  api.called('navigateBack', undefined)
  api.stack('pages/account/detail')
  standalone.returnToServiceList(orders)
  api.called('redirectTo', { url: standalone.targetUrl(orders) })
  standalone.backFromAccountView('order', 'services')
  api.called('redirectTo', { url: standalone.targetUrl(orders) })
  standalone.backFromAccountView('message', 'messages')
  api.called('redirectTo', { url: '/pages/index/index?tab=messages' })
})

test('the host returns by stack or native tab according to its route', async t => {
  const api = routing(t)
  // The runtime reads the project configuration on import, just as the generated host does.
  const original = { ...config }
  Object.assign(config, hostedConfig)
  t.after(() => {
    for (const key of Object.keys(hostedConfig)) if (!(key in original)) delete config[key]
    Object.assign(config, original)
  })
  const host = await import('../src/account-navigation.js?host')
  const { accountTab, loginPage } = hostedConfig.host
  const target = host.accountTarget('mine')

  api.stack(accountTab.slice(1), loginPage.slice(1))
  host.leaveAuthPages(target)
  api.called('navigateBack', { delta: 1 })
  api.stack('pages/trail/routes', loginPage.slice(1))
  host.leaveAuthPages(target)
  api.called('switchTab', { url: accountTab })
  host.showAccountTab('home')
  api.called('switchTab', { url: accountTab })

  const notice = host.accountTarget('message', 'river/notice', 'mine')
  host.leaveAuthPages(notice)
  api.called('redirectTo', { url: host.targetUrl(notice) })
  api.stack('pages/account/detail')
  host.backFromAccountView('message', 'mine')
  api.called('switchTab', { url: accountTab })
})
