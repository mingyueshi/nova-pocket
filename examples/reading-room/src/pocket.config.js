/** @satisfies {import('#pocket/types').PocketConfig} */
const config = {
  brand: { name: '青禾书房', subtitle: '读者中心', logo: '' },
  defaultTheme: 'tea',
  themes: {
    tea: {
      label: '书房茶褐', base: 'teal', brand: '#804322', iconAccent: '#98652D',
      soft: '#F6EBDD', canvas: '#FAF7F1', hero: '#503A2C', heroStyle: 'solid',
    },
  },
  defaultLayout: 'shortcuts',
  demoSettings: false,
  tabs: [
    ['home', '首页', 'layout-grid'],
    ['messages', '书房通知', 'bell'],
    ['services', '服务', 'layers'],
    ['mine', '我的', 'user-round'],
  ],
  blocks: {
    home: [{ type: 'menu', title: '借阅服务', entries: ['loans'] }, 'identity', 'shortcuts'],
    mine: ['identity', { type: 'menu', title: '账户管理', entries: ['settings'] }],
  },
  shortcuts: [
    ['messages', '书房通知', 'bell', '查看借阅与活动提醒'],
    ['profile', '读者资料', 'user-round', '编辑展示昵称'],
  ],
  modules: {
    loans: { enabled: true, label: '我的借阅', icon: 'layers', description: '查看在借与已归还的图书', requiresLogin: true, page: 'loans/index' },
    orders: { enabled: false },
    reviews: { enabled: false },
    stats: { enabled: false },
  },
}

export default config
