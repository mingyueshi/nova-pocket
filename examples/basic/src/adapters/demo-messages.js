import config from '../pocket.config.js'

export const pageSize = 16

// Stable IDs keep old demo sessions and shared links usable when the fixture grows.
const reports = Array.from({ length: 43 }, (_, index) => {
  const week = String(44 - index).padStart(2, '0')
  return {
    id: 'weekly-' + week, title: '第 ' + week + ' 周账户周报', date: '历史周报',
    body: '此周报已归档，可从消息列表重新查看。', read: true,
  }
})

export const notifications = [
  { id: 'welcome', title: '欢迎使用 ' + config.brand.name, date: '刚刚', body: '在底栏中查看消息、编辑昵称和管理账户。' },
  { id: 'profile', title: '个人资料提示', date: '昨天', body: '你可以在「我的」编辑昵称。', read: true },
  { id: 'appearance', title: '账户外观设置', date: '上周', body: '前往账户设置可以调整主题。', read: true },
  ...reports.slice(0, 36),
  { id: 'security', title: '账号安全检查', date: '第 09 周', body: '请核对本周的账户登录记录。这里展示的是示例通知。' },
  ...reports.slice(36),
  { id: 'guide', title: '账户中心使用指南', date: '更早', body: '通过底栏查看通知和管理资料。', read: true },
]
