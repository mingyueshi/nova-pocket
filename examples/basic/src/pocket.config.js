/** @satisfies {import('#pocket/types').PocketConfig} */
const config = {
  brand: { name: 'Nova Pocket', subtitle: '账户中心', logo: '' },
  defaultTheme: 'blue',
  defaultLayout: 'overview',
  demoSettings: false,
  tabs: [
    ['home', '概览', 'layout-grid'],
    ['messages', '消息', 'bell'],
    ['mine', '我的', 'user-round'],
  ],
  blocks: {
    home: [{ type: 'identity', actions: false }],
    mine: ['identity', { type: 'menu', title: '账户管理', entries: ['settings'] }],
  },
  shortcuts: [],
  modules: {},
}

export default config
