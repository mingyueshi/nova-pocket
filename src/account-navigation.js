import { ref } from 'vue'

export const tabs = [
  ['home', '概览', 'layout-grid'],
  ['services', '服务', 'layers'],
  ['messages', '消息', 'bell'],
  ['mine', '我的', 'user-round'],
]

export const viewNames = {
  home: '概览',
  services: '服务',
  messages: '消息',
  mine: '我的',
  orders: '我的订单',
  order: '订单详情',
  stats: '使用统计',
  reviews: '我的评价',
  review: '评价详情',
  profile: '个人资料',
  security: '账户安全',
  settings: '账户设置',
  activity: '最近活动',
  privacy: '隐私说明',
  help: '帮助与反馈',
  demo: '演示设置',
  message: '消息详情',
}

const indexPath = 'pages/index/index'
const profilePath = '/pages/account/profile'
export const detailPath = '/pages/account/detail'
export const rootTab = ref('home')

const defaultTabs = {
  orders: 'services', order: 'services', stats: 'services', reviews: 'services', review: 'services',
  message: 'messages', demo: 'mine',
}

const parents = { order: 'orders', review: 'reviews', privacy: 'settings' }

export function isTab(tab) {
  return tabs.some(([key]) => key === tab)
}

export function isDetail(view) {
  return Object.prototype.hasOwnProperty.call(viewNames, view) && !isTab(view) && view !== 'profile'
}

export function detailTab(view, tab) {
  return isTab(tab) ? tab : (defaultTabs[view] || 'home')
}

export function detailUrl(view, id, tab) {
  const query = ['view=' + encodeURIComponent(view)]
  if (id) query.push('id=' + encodeURIComponent(id))
  if (isTab(tab) && tab !== detailTab(view)) query.push('tab=' + tab)
  return detailPath + '?' + query.join('&')
}

function indexUrl(tab) {
  return '/' + indexPath + (tab === 'home' ? '' : '?tab=' + tab)
}

export function openAccountView(view, id, tab) {
  const url = view === 'profile' ? profilePath + '?tab=' + tab : detailUrl(view, id, tab)
  return uni.navigateTo({ url })
}

export function showAccountTab(tab) {
  const pages = getCurrentPages()
  const index = pages.map(page => page.route).lastIndexOf(indexPath)
  if (index === -1) return uni.redirectTo({ url: indexUrl(tab) })
  rootTab.value = tab
  if (index < pages.length - 1) return uni.navigateBack({ delta: pages.length - index - 1 })
}

export function backFromAccountView(view, tab) {
  if (getCurrentPages().length > 1) return uni.navigateBack()
  if (Object.prototype.hasOwnProperty.call(parents, view)) {
    return uni.redirectTo({ url: detailUrl(parents[view], null, tab) })
  }
  return showAccountTab(tab)
}
