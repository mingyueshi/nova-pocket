import { computed, reactive } from 'vue'

import { configuredThemes } from './themes.js'
import config from './pocket.config.js'
import { auth, messages, demoSettingsEnabled } from './adapters/index.js'
import { createAccountData } from './account-data.js'
import { authUrl, viewNames } from './account-navigation.js'

export const account = createAccountData(auth, messages, Boolean(viewNames.message))

export const layouts = [['overview', '状态概览'], ['shortcuts', '快捷工作台'], ['minimal', '极简列表']]
export const modes = [['member', '已登录'], ['guest', '访客'], ['incomplete', '资料待完善']]
const registry = configuredThemes(config)
export const themes = Array.from(registry, ([key, theme]) => [key, theme.label])
export const scenarios = [['normal', '正常'], ['empty', '空列表'], ['error', '加载失败']]

function defaults() {
  return {
    layout: config.defaultLayout, theme: config.defaultTheme, scenario: 'normal',
    messageFilter: 'all',
  }
}

export const state = reactive({
  ...defaults(),
  get mode() { return account.session.user ? (account.session.user.mode || 'member') : 'guest' },
  get nickname() { return account.session.user?.nickname || '' },
})
export const activeTheme = computed(() => registry.get(state.theme))
export const themeColor = computed(() => activeTheme.value.brand)
export const mutedTone = computed(() => activeTheme.value.base === 'dark' ? 'light' : 'muted')

export function reset() {
  if (!demoSettingsEnabled) return
  Object.assign(state, defaults())
  messages.reset()
  account.useDemoSession(auth.reset())
}

export function authRoute(key, replace = false, target = null) {
  const url = authUrl(key, target)
  return replace ? uni.redirectTo({ url }) : uni.navigateTo({ url })
}

export function hint(title) {
  uni.showToast({ title, icon: 'none', duration: 1900 })
}

export function confirm(title, content, confirmText = '确认') {
  return new Promise(resolve => {
    uni.showModal({
      title,
      content,
      confirmText,
      success: result => resolve(!!result.confirm),
      fail: () => resolve(false),
    })
  })
}
