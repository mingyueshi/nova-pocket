export default {
  brand: { name: '青禾书房', subtitle: '读者中心', logo: '' },
  defaultTheme: 'teal',
  defaultLayout: 'shortcuts',
  demoSettings: false,
  tabs: [
    ['home', '首页', 'layout-grid'],
    ['messages', '书房通知', 'bell'],
    ['services', '服务', 'layers'],
    ['mine', '我的', 'user-round'],
  ],
  shortcuts: [
    ['messages', '书房通知', 'bell', '查看借阅与活动提醒'],
    ['profile', '读者资料', 'user-round', '编辑展示昵称'],
  ],
  modules: {
    loans: { enabled: true, label: '我的借阅', icon: 'layers', description: '查看在借与已归还的图书', requiresLogin: true, page: 'loans/index' },
    orders: { enabled: false },
    reviews: { enabled: false },
    stats: { enabled: true, label: '使用统计', icon: 'chart-no-axes-combined', description: '查看使用趋势' },
  },
}
