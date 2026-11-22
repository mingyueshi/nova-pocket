export const messages = [
  { id: 'welcome', title: '欢迎使用 Nova Pocket', date: '刚刚', body: '这里演示通用账户通知、阅读状态和消息详情，不连接真实消息服务。' },
  { id: 'security', title: '账号安全检查', date: '今天', body: '实际产品可提醒用户查看设备、登录记录和安全设置。当前只是示例。' },
  { id: 'profile', title: '个人资料提示', date: '昨天', body: '用户可随时编辑昵称。原型只保存当前页面的模拟状态。' },
]

export function findMessage(id) {
  return messages.find(message => message.id === id)
}
