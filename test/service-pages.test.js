import assert from 'node:assert/strict'
import test from 'node:test'
import { createNavigation } from '../src/account-navigation.js'
import { configuredServicePages, syncServicePackage } from '../src/service-pages.js'

function settings() {
  return {
    tabs: [['home'], ['services'], ['mine']], shortcuts: [],
    modules: { holds: { enabled: true, page: 'reservations/index', requiresLogin: true, label: '预约' } },
  }
}

test('configured pages map a stable service key to a local page, independent of the record ID and file name', () => {
  const config = settings()
  const nav = createNavigation(config, false)
  const id = '书架/%2F &+?'
  assert.equal(nav.detailUrl('holds', id), '/pages/account/detail?view=holds&id=' + encodeURIComponent(id))
  assert.equal(nav.serviceUrl('holds', id, 'mine'), '/pocket-services/reservations/index?id=' + encodeURIComponent(id) + '&tab=mine')
  assert.equal(nav.serviceUrl('holds', '', 'services'), '/pocket-services/reservations/index')
  assert.equal(nav.serviceViewForPath('pocket-services/reservations/index'), 'holds')
  assert.equal(nav.requiresLogin('holds'), true)
  config.modules.holds.page = 'new-location/list'
  const moved = createNavigation(config, false)
  assert.equal(moved.detailUrl('holds', id), nav.detailUrl('holds', id))
  assert.equal(moved.serviceUrl('holds', ''), '/pocket-services/new-location/list')
})

test('disabling an extension or the services tab removes its entry, return target and compiled subpackage', () => {
  for (const disable of [c => { c.modules.holds.enabled = false }, c => { c.tabs = [['home']] }]) {
    const config = settings()
    const other = { root: 'other', pages: ['keep'] }
    const manifest = { subPackages: [other] }
    syncServicePackage(manifest, configuredServicePages(config), config.modules)
    syncServicePackage(manifest, configuredServicePages(config), config.modules)
    assert.deepEqual(manifest.subPackages, [other, { root: 'pocket-services', pages: [
      { path: 'reservations/index', style: { navigationBarTitleText: '预约', navigationStyle: 'default' } },
    ] }])
    disable(config)
    const nav = createNavigation(config, false)
    assert.equal(nav.services.length, 0)
    assert.equal(nav.isDetail('holds'), false)
    assert.equal(nav.serviceUrl('holds', '123'), '')
    syncServicePackage(manifest, configuredServicePages(config), config.modules)
    assert.deepEqual(manifest.subPackages, [other])
  }
})

test('extension configuration rejects conflicting keys, ambiguous pages and external paths', () => {
  for (const key of ['profile', 'services', 'order', 'toString']) {
    const config = settings()
    config.modules = { [key]: config.modules.holds }
    assert.throws(() => configuredServicePages(config), /服务键/)
  }
  for (const page of ['../outside', '/pages/auth/login', 'https://example.test', 'index?view=order']) {
    const config = settings()
    config.modules.holds.page = page
    assert.throws(() => configuredServicePages(config), /路径/)
  }
  const config = settings()
  config.modules.other = { ...config.modules.holds }
  assert.throws(() => configuredServicePages(config), /重复/)
})

test('account menus, shortcuts and direct links expose only connected capabilities', () => {
  const config = { tabs: [['mine', '我的']], shortcuts: [['profile'], ['messages'], ['security'], ['help']],
    modules: {}, host: { accountTab: '/pages/club/mine' }, accountPages: { help: '/pages/club/help' } }
  const auth = { getSession: () => null }
  const minimal = createNavigation(config, false, { auth, messages: null })
  assert.deepEqual(minimal.shortcuts, [['help']])
  assert.deepEqual(Object.keys(minimal.viewNames).sort(), ['help', 'mine'])
  assert.equal(minimal.isDetail('message'), false)
  const connected = createNavigation(config, false, { auth: { ...auth, updateProfile() {}, logout() {} },
    messages: { list() {}, markRead() {} } })
  assert.deepEqual(connected.shortcuts, [['profile'], ['messages'], ['help']])
  assert.equal(connected.isDetail('message'), true)
  assert.equal(connected.isDetail('settings'), true)
  assert.equal(connected.isDetail('security'), false)
  const http = createNavigation({ ...config, host: undefined, tabs: [['services'], ['mine']],
    modules: { stats: { enabled: true } } }, false, { auth, messages: null })
  assert.equal(http.isDetail('stats'), false)
  assert.equal(http.isTab('services'), false)
})
