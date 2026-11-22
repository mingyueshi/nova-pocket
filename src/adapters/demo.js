import config from '../pocket.config.js'

const demoUser = () => ({ id: 'demo', nickname: '演示用户', mode: 'member' })
const notifications = [
  { id: 'welcome', title: '欢迎使用 ' + config.brand.name, date: '刚刚', body: '这里演示通用账户通知、阅读状态和消息详情，不连接真实消息服务。' },
  { id: 'security', title: '账号安全检查', date: '今天', body: '实际产品可提醒用户查看设备、登录记录和安全设置。当前只是示例。' },
  { id: 'profile', title: '个人资料提示', date: '昨天', body: '用户可随时编辑昵称。原型只保存当前页面的模拟状态。' },
]

export function createDemoAdapters() {
  let user = demoUser()
  let guest = false
  const read = new Set(['profile'])
  const codes = new Map()

  function checkAccount(account) {
    if (!/^[^\s@]+@example\.test$/i.test(account)) throw new Error('请使用虚构邮箱，例如 demo@example.test。')
  }
  function checkCode(account, purpose, code) {
    if (!codes.has(purpose + ':' + account) || code !== '246810') throw new Error('请先生成演示验证码，再输入 246810。')
    codes.delete(purpose + ':' + account)
  }
  return {
    auth: {
      demo: true,
      getSession: () => guest ? null : { ...user },
      sendCode({ account, purpose }) {
        checkAccount(account)
        codes.set(purpose + ':' + account, true)
        return { hint: '演示验证码：246810（未发送邮件）' }
      },
      login({ account, method, code, password }) {
        checkAccount(account)
        if (method === 'code') checkCode(account, 'login', code)
        else if (!password || password.length < 8) throw new Error('演示密码至少需要 8 个字符。')
        guest = false
        return { ...user }
      },
      register({ account, code, password, nickname }) {
        checkAccount(account)
        if (password.length < 8) throw new Error('演示密码至少需要 8 个字符。')
        checkCode(account, 'register', code)
        user = { ...demoUser(), nickname }
        guest = false
        return { ...user }
      },
      recover({ account, code, password }) {
        checkAccount(account)
        if (password.length < 8) throw new Error('演示密码至少需要 8 个字符。')
        checkCode(account, 'recover', code)
      },
      updateProfile({ nickname }) {
        user = { ...user, nickname, mode: 'member' }
        return { ...user }
      },
      logout() { guest = true; codes.clear() },
      setMode(mode) {
        guest = mode === 'guest'
        if (!guest) user.mode = mode
        return guest ? null : { ...user }
      },
      reset() { user = demoUser(); guest = false; codes.clear(); return { ...user } },
    },
    messages: {
      demo: true,
      list: () => notifications.map(item => ({ ...item, read: read.has(item.id) })),
      markRead(ids) { for (const id of ids) read.add(id) },
      reset() { read.clear(); read.add('profile') },
    },
  }
}
