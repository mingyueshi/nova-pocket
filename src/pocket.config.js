export default {
  brand: {
    name: 'Nova Pocket',
    logo: '', // /static/brand.png，留空使用内置图标
    subtitle: '移动端账户中心',
  },
  defaultTheme: 'blue',
  defaultLayout: 'overview',
  demoSettings: true,
  // 顺序决定底栏顺序，第一项是默认页。删除条目即可关闭该入口。
  tabs: [
    ['home', '概览', 'layout-grid'],
    ['services', '服务', 'layers'],
    ['messages', '消息', 'bell'],
    ['mine', '我的', 'user-round'],
  ],
  shortcuts: [
    ['profile', '个人资料', 'user-round', '管理昵称和展示信息'],
    ['security', '账户安全', 'shield-check', '查看设备与验证方式'],
    ['messages', '消息中心', 'bell', '查看通知与安全提醒'],
    ['settings', '账户设置', 'settings', '管理通知、外观和隐私'],
  ],
  modules: {
    orders: { enabled: true, label: '我的订单', icon: 'package-check', description: '查看不同类型的订单、当前状态和详情' },
    stats: { enabled: true, label: '使用统计', icon: 'chart-no-axes-combined', description: '切换统计区间与指标，查看单日数据' },
    reviews: { enabled: true, label: '我的评价', icon: 'message-square-text', description: '查看评价记录，体验评分与评论流程' },
  },
}
