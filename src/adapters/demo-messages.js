import config from '../pocket.config.js'

export const pageSize = 3
export const notifications = [
  { id: 'welcome', title: '欢迎使用 ' + config.brand.name, date: '刚刚', body: '这里演示通用账户通知、阅读状态和消息详情，不连接真实消息服务。' },
  { id: 'security', title: '账号安全检查', date: '今天', body: '实际产品可提醒用户查看设备、登录记录和安全设置。当前只是示例。' },
  { id: 'profile', read: true, title: '个人资料提示', date: '昨天', body: '用户可随时编辑昵称。可在账户中心管理展示昵称。' },
  { id: 'appearance', read: true, title: '账户外观设置', date: '上周', body: '前往账户设置可以调整主题。' },
  { id: 'guide', read: true, title: '账户中心使用指南', date: '上周', body: '通过底栏可以浏览服务、查看通知和管理资料。' },
]
