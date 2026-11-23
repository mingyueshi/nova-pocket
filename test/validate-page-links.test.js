import assert from 'node:assert/strict'
import test from 'node:test'
import { validatePageLinks } from '../src/validate-page-links.js'

const config = {
  host: { accountTab: '/pages/mine/index', loginPage: '/members/login' },
  tabs: [['mine', '我的', 'user-round']],
}
const pages = {
  pages: [{ path: 'pages/home/index' }, { path: 'pages/mine/index' }, { path: 'pages/login' }],
  tabBar: { list: [{ pagePath: 'pages/home/index' }, { pagePath: 'pages/mine/index' }] },
  subPackages: [{ root: 'members', pages: [{ path: 'login' }] }],
}
const detail = '/uni_modules/nova-pocket/pages/account/detail'
function checkHost(overrides) {
  validatePageLinks({ ...config, host: { ...config.host, ...overrides } }, pages, detail)
}

test('host login accepts a registered ordinary page in the main package or a subpackage', () => {
  checkHost({ loginPage: '/pages/login' })
  checkHost({ loginPage: '/members/login' })
  validatePageLinks({ tabs: [['home'], ['mine']] }, pages, detail)
})

test('a login link to a native tab names the conflicting field, path and fix', () => {
  assert.throws(() => checkHost({ loginPage: '/pages/home/index' }),
    /host\.loginPage = "\/pages\/home\/index".*tabBar\.list.*普通登录页/)
  assert.throws(() => checkHost({ loginPage: '/pages/typo' }),
    /host\.loginPage = "\/pages\/typo".*pages\.json.*普通登录页/)
})

test('the account tab must be registered in both main pages and the native tab bar', () => {
  assert.throws(() => checkHost({ accountTab: '/pages/login' }),
    /host\.accountTab = "\/pages\/login".*pages 和 tabBar\.list/)
  // The tab bar still contains the path after moving this page into a subpackage.
  const moved = {
    ...pages,
    pages: pages.pages.filter(page => page.path !== 'pages/mine/index'),
    subPackages: [...pages.subPackages, { root: 'pages/mine', pages: [{ path: 'index' }] }],
  }
  assert.throws(() => validatePageLinks(config, moved, detail), /host\.accountTab = "\/pages\/mine\/index"/)
})

test('missing or invalid module tabs point to the mine entry in pocket.config.js', () => {
  for (const tabs of [undefined, [], [null], ['mine'], [['home']], [['mine'], ['home']]]) {
    assert.throws(() => validatePageLinks({ ...config, tabs }, pages, detail), error =>
      error.message.includes('pocket.config.js 的 tabs = ' + JSON.stringify(tabs)) &&
      error.message.includes('[["mine","我的","user-round"]]'))
  }
})
