import { ref } from 'vue'
import config from './pocket.config.js'
import { auth, messages, demoSettingsEnabled } from './adapters/index.js'
import { configuredServicePages, serviceRoot } from './service-pages.js'

const tabKeys = ['home', 'services', 'messages', 'mine']
const moduleOwners = { order: 'orders', review: 'reviews' }
const parents = { ...moduleOwners, privacy: 'settings' }
const indexPath = 'pages/index/index'
const profilePath = '/pages/account/profile'
export const detailPath = '/pages/account/detail'

const optionalPages = { security: '账户安全', activity: '最近活动', notifications: '通知偏好', privacy: '隐私说明', help: '帮助与反馈' }
export const host = config.host

export function createNavigation(settings, showDemo, adapters = { auth, messages }) {
  const demoServices = Boolean(adapters.auth.demo && adapters.messages?.demo)
  const inbox = adapters.messages
  const hasInbox = Boolean(inbox?.markRead && (inbox.listPage ? inbox.get && inbox.markAllRead : inbox.list))
  const linkedPages = settings.accountPages || {}
  const hasProfile = typeof adapters.auth.updateProfile === 'function'
  const servicePages = configuredServicePages(settings)
  const serviceTab = settings.tabs.some(([key]) => key === 'services')
  const services = Object.entries(settings.modules)
    .filter(([key, module]) => serviceTab && module.enabled && (servicePages.has(key) || (demoServices && ['orders', 'reviews', 'stats'].includes(key))))
    .map(([key, module]) => [key, module.label, module.icon, module.description])
  const tabs = settings.tabs.filter(([key]) => tabKeys.includes(key) && (key !== 'messages' || hasInbox) && (key !== 'services' || services.length))
  if (!tabs.length) throw new Error('pocket.config.js 至少需要一个可用的底栏入口')
  const firstTab = tabs[0][0]
  const isTab = tab => tabs.some(([key]) => key === tab)
  const serviceKeys = new Set(services.map(([key]) => key))
  const viewNames = {
    ...Object.fromEntries(tabs.map(([key, label]) => [key, label])),
    ...Object.fromEntries(services.map(([key, label]) => [key, label])),
    ...(hasProfile && { profile: '个人资料' }),
    ...Object.fromEntries(Object.entries(optionalPages).filter(([key]) => linkedPages[key] || (showDemo && key !== 'notifications'))),
    ...((!settings.host || adapters.auth.logout || linkedPages.notifications || linkedPages.privacy) && { settings: '账户设置' }),
  }
  if (serviceKeys.has('orders')) viewNames.order = '订单详情'
  if (serviceKeys.has('reviews')) viewNames.review = '评价详情'
  if (settings.host && hasInbox) viewNames.messages = '消息中心'
  if (isTab('messages') || (settings.host && hasInbox)) viewNames.message = '消息详情'
  if (showDemo) viewNames.demo = '演示设置'

  function isDetail(view) {
    return typeof view === 'string' && Object.prototype.hasOwnProperty.call(viewNames, view) && !isTab(view) && view !== 'profile'
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

  function serviceUrl(view, id, tab) {
    if (!servicePages.has(view)) return ''
    const query = []
    if (id) query.push('id=' + encodeURIComponent(id))
    if (isTab(tab) && tab !== 'services') query.push('tab=' + encodeURIComponent(tab))
    return '/' + serviceRoot + '/' + servicePages.get(view) + (query.length ? '?' + query.join('&') : '')
  }

  function serviceViewForPath(path) {
    for (const [key, file] of servicePages) if (path === serviceRoot + '/' + file) return key
  }

  const shortcuts = settings.shortcuts.filter(([key]) => isTab(key) || isDetail(key) || (key === 'profile' && hasProfile))
  return { tabs, services, firstTab, viewNames, shortcuts, isTab, isDetail, requiresLogin, detailTab, detailUrl, serviceUrl, serviceViewForPath }
}

export const { tabs, services, firstTab, viewNames, shortcuts, isTab, isDetail, requiresLogin, detailTab, detailUrl, serviceUrl, serviceViewForPath } =
  createNavigation(config, demoSettingsEnabled)
export const rootTab = ref(firstTab)

function indexUrl(tab) {
  return '/' + indexPath + (tab === firstTab ? '' : '?tab=' + tab)
}

// Only reconstruct registered account screens. No arbitrary URL is accepted from an auth query.
export function accountTarget(view, id, tab) {
  if (typeof view !== 'string' || !Object.prototype.hasOwnProperty.call(viewNames, view)) return null
  return { view, id: typeof id === 'string' ? id : '', tab: isTab(view) ? view : detailTab(view, tab) }
}

export function decodePageOption(value) {
  if (typeof value !== 'string') return ''
  try { return decodeURIComponent(value) }
  catch { return value }
}

export function pageRecordId(value, platform = process.env.UNI_PLATFORM) {
  // H5's onLoad already decodes page options. WeChat passes them through.
  if (platform === 'mp-weixin') return decodePageOption(value)
  return typeof value === 'string' ? value : ''
}

export function targetUrl(target) {
  if (isTab(target.view)) return host?.accountTab || indexUrl(target.view)
  if (Object.prototype.hasOwnProperty.call(config.accountPages || {}, target.view)) return config.accountPages[target.view]
  if (target.view === 'profile') return profilePath + '?tab=' + target.tab
  return serviceUrl(target.view, target.id, target.tab) || detailUrl(target.view, target.id, target.tab)
}

export function authUrl(kind, target) {
  const path = host?.loginPage || '/pages/auth/' + kind
  if (!target) return path
  const query = ['returnView=' + encodeURIComponent(target.view), 'returnTab=' + encodeURIComponent(target.tab)]
  if (target.id) query.push('returnId=' + encodeURIComponent(target.id))
  return path + '?' + query.join('&')
}

function previousAccountTarget(page) {
  const query = page.options || page.$page?.options || {}
  if (host && '/' + page.route === host.accountTab) return accountTarget(firstTab)
  const linked = Object.entries(config.accountPages || {}).find(([, path]) => path === '/' + page.route)
  if (linked) return accountTarget(linked[0])
  if (page.route === indexPath) return accountTarget(rootTab.value)
  if ('/' + page.route === profilePath) return accountTarget('profile', '', query.tab)
  if ('/' + page.route === detailPath) return accountTarget(query.view, pageRecordId(query.id), query.tab)
  return accountTarget(serviceViewForPath(page.route), pageRecordId(query.id), query.tab)
}

export function leaveAuthPages(target = null) {
  const pages = getCurrentPages()
  let previous = pages.length - 2
  while (!host && previous >= 0 && pages[previous].route?.startsWith('pages/auth/')) previous--
  if (previous >= 0) {
    const origin = previousAccountTarget(pages[previous])
    if (!target || (origin && targetUrl(origin) === targetUrl(target))) {
      return uni.navigateBack({ delta: pages.length - previous - 1 })
    }
    if (host && isTab(target.view)) return returnToAccountHome()
    if (pages.length - previous === 2) return uni.redirectTo({ url: targetUrl(target) })
  }
  if (host && (!target || isTab(target.view))) return returnToAccountHome()
  return uni.reLaunch({ url: target ? targetUrl(target) : indexUrl(firstTab) })
}

export function returnToServiceList(target) {
  const pages = getCurrentPages()
  const previous = pages[pages.length - 2]
  const list = accountTarget(target.view, '', target.tab)
  const origin = previous && previousAccountTarget(previous)
  if (origin && targetUrl(origin) === targetUrl(list)) return uni.navigateBack()
  return uni.redirectTo({ url: targetUrl(list) })
}

export function returnToAccountHome() {
  if (host) return uni.switchTab({ url: host.accountTab })
  return uni.reLaunch({ url: indexUrl(firstTab) })
}

export function openAccountView(view, id, tab) {
  const target = accountTarget(view, id, tab)
  if (!target || isTab(view)) return showAccountTab(firstTab)
  return uni.navigateTo({ url: targetUrl(target) })
}

export function showAccountTab(tab) {
  if (host) return returnToAccountHome()
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
