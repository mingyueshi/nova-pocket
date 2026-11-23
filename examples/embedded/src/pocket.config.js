/** @satisfies {import('#pocket/types').PocketConfig} */
const config = {
  brand: { name: '山岚步道', subtitle: '步行俱乐部', logo: '/static/trail-mark.svg' },
  defaultTheme: 'trail',
  themes: {
    trail: { label: '山岚绿', base: 'teal', brand: '#23594C', hero: '#23594C', canvas: '#F3F6F2', soft: '#E3EEE7' },
  },
  defaultLayout: 'shortcuts',
  host: { accountTab: '/pages/trail/mine', loginPage: '/pages/trail/login' },
  accountPages: { notifications: '/pages/trail/preferences' },
  tabs: [['mine', '我的', 'user-round']],
  blocks: {
    mine: ['identity', 'business', 'shortcuts', { type: 'menu', title: '账户管理', entries: ['settings'] }],
  },
  shortcuts: [['messages', '行程通知', 'bell', '查看路线安排和集合提醒']],
  modules: {},
}

export default config
