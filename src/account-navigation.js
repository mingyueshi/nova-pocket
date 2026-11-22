import { ref } from 'vue'
import config from './pocket.config.js'
import { demoSettingsEnabled } from './adapters/index.js'

const tabKeys = ['home', 'services', 'messages', 'mine']
const moduleOwners = { order: 'orders', review: 'reviews' }
const parents = { ...moduleOwners, privacy: 'settings' }
const indexPath = 'pages/index/index'
const profilePath = '/pages/account/profile'
export const detailPath = '/pages/account/detail'

export function createNavigation(settings, showDemo) {
  const serviceTab = settings.tabs.some(([key]) => key === 'services')
  const services = Object.entries(settings.modules)
    .filter(([, module]) => serviceTab && module.enabled)
    .map(([key, module]) => [key, module.label, module.icon, module.description])
  const tabs = settings.tabs.filter(([key]) => tabKeys.includes(key) && (key !== 'services' || services.length))
  if (!tabs.length) throw new Error('pocket.config.js 至少需要一个可用的底栏入口')
  const firstTab = tabs[0][0]
  const isTab = tab => tabs.some(([key]) => key === tab)
  const serviceKeys = new Set(services.map(([key]) => key))
  const viewNames = {
    ...Object.fromEntries(tabs.map(([key, label]) => [key, label])),
    ...Object.fromEntries(services.map(([key, label]) => [key, label])),
    profile: '个人资料', security: '账户安全', settings: '账户设置',
    activity: '最近活动', privacy: '隐私说明', help: '帮助与反馈',
  }
  if (serviceKeys.has('orders')) viewNames.order = '订单详情'
  if (serviceKeys.has('reviews')) viewNames.review = '评价详情'
  if (isTab('messages')) viewNames.message = '消息详情'
  if (showDemo) viewNames.demo = '演示设置'

  function isDetail(view) {
    return Object.prototype.hasOwnProperty.call(viewNames, view) && !isTab(view) && view !== 'profile'
  }

  function requiresLogin(view) {
    return Boolean(settings.modules[moduleOwners[view] || view]?.requiresLogin)
  }

  function detailTab(view, tab) {
    if (isTab(tab)) return tab
    if (view === 'message' && isTab('messages')) return 'messages'
    if (view === 'demo' && isTab('mine')) return 'mine'
    if (serviceKeys.has(moduleOwners[view] || view)) return 'services'
    return firstTab
  }

  function detailUrl(view, id, tab) {
    const query = ['view=' + encodeURIComponent(view)]
    if (id) query.push('id=' + encodeURIComponent(id))
    if (isTab(tab) && tab !== detailTab(view)) query.push('tab=' + encodeURIComponent(tab))
    return detailPath + '?' + query.join('&')
  }

  const shortcuts = settings.shortcuts.filter(([key]) => isTab(key) || isDetail(key) || key === 'profile')
  return { tabs, services, firstTab, viewNames, shortcuts, isTab, isDetail, requiresLogin, detailTab, detailUrl }
}

export const { tabs, services, firstTab, viewNames, shortcuts, isTab, isDetail, requiresLogin, detailTab, detailUrl } =
  createNavigation(config, demoSettingsEnabled)
export const rootTab = ref(firstTab)

function indexUrl(tab) {
  return '/' + indexPath + (tab === firstTab ? '' : '?tab=' + tab)
}

export function returnToAccountHome() {
  return uni.reLaunch({ url: indexUrl(firstTab) })
}

export function openAccountView(view, id, tab) {
  if (view !== 'profile' && !isDetail(view)) return showAccountTab(firstTab)
  const url = view === 'profile' ? profilePath + '?tab=' + detailTab(view, tab) : detailUrl(view, id, tab)
  return uni.navigateTo({ url })
}

export function showAccountTab(tab) {
  if (!isTab(tab)) tab = firstTab
  const pages = getCurrentPages()
  const index = pages.map(page => page.route).lastIndexOf(indexPath)
  if (index === -1) return uni.redirectTo({ url: indexUrl(tab) })
  rootTab.value = tab
  if (index < pages.length - 1) return uni.navigateBack({ delta: pages.length - index - 1 })
}

export function backFromAccountView(view, tab) {
  if (getCurrentPages().length > 1) return uni.navigateBack()
  if (Object.prototype.hasOwnProperty.call(parents, view) && isDetail(parents[view])) {
    return uni.redirectTo({ url: detailUrl(parents[view], null, tab) })
  }
  return showAccountTab(tab)
}
