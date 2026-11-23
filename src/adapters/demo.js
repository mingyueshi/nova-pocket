import { notifications, pageSize } from './demo-messages.js'

const demoUser = () => ({ id: 'demo', nickname: '演示用户', mode: 'member' })
const initiallyRead = notifications.filter(item => item.read).map(item => item.id)
const sessionDuration = 7 * 24 * 60 * 60 * 1000

export function createDemoAdapters(storage) {
  let user = demoUser()
  let guest = false
  let read = new Set(initiallyRead)
  let expiresAt = Date.now() + sessionDuration
  const codes = new Map()

  function persist() {
    storage?.save({ version: 1, user: { ...user }, guest, expiresAt, read: [...read] })
  }
  function restore() {
    const saved = storage?.load()
    if (saved?.version === 1 && saved.user?.id === 'demo' && typeof saved.user.nickname === 'string' &&
        ['member', 'incomplete'].includes(saved.user.mode) && typeof saved.guest === 'boolean' &&
        Number.isFinite(saved.expiresAt) && Array.isArray(saved.read)) {
      user = { ...saved.user }
      guest = saved.guest
      expiresAt = saved.expiresAt
      read = new Set([...initiallyRead, ...saved.read])
    }
    if (!guest && Date.now() >= expiresAt) {
      const error = new Error('登录已过期，请重新登录')
      error.code = 'SESSION_EXPIRED'
      throw error
    }
  }
  function signIn() {
    guest = false
    expiresAt = Date.now() + sessionDuration
    persist()
    return { ...user }
  }
  function checkSession() {
    restore()
    if (guest) {
      const error = new Error('请先登录')
      error.code = 'SESSION_EXPIRED'
      throw error
    }
  }
  function list() {
    checkSession()
    return notifications.map(item => ({ ...item, read: read.has(item.id) }))
  }
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
      getSession() { restore(); persist(); return guest ? null : { ...user } },
      sendCode({ account, purpose }) {
        checkAccount(account)
        codes.set(purpose + ':' + account, true)
        return { hint: '演示验证码：246810（未发送邮件）' }
      },
      login({ account, method, code, password }) {
        checkAccount(account)
        if (method === 'code') checkCode(account, 'login', code)
        else if (!password || password.length < 8) throw new Error('演示密码至少需要 8 个字符。')
        return signIn()
      },
      register({ account, code, password, nickname }) {
        checkAccount(account)
        if (password.length < 8) throw new Error('演示密码至少需要 8 个字符。')
        checkCode(account, 'register', code)
        user = { ...demoUser(), nickname }
        return signIn()
      },
      recover({ account, code, password }) {
        checkAccount(account)
        if (password.length < 8) throw new Error('演示密码至少需要 8 个字符。')
        checkCode(account, 'recover', code)
      },
      updateProfile({ nickname }) {
        checkSession()
        user = { ...user, nickname, mode: 'member' }
        persist()
        return { ...user }
      },
      logout() { guest = true; codes.clear(); persist() },
      setMode(mode) {
        guest = mode === 'guest'
        if (!guest) { user.mode = mode; return signIn() }
        persist()
        return null
      },
      reset() { user = demoUser(); codes.clear(); return signIn() },
    },
    messages: {
      demo: true,
      list,
      listPage({ cursor, limit }) {
        const all = list()
        const start = cursor ? all.findIndex(item => item.id === cursor) + 1 : 0
        const items = all.slice(start, start + Math.min(pageSize, limit))
        const nextCursor = start + items.length < all.length ? items[items.length - 1].id : null
        return { items, nextCursor, unreadCount: all.filter(item => !item.read).length }
      },
      get: id => list().find(item => item.id === id) || null,
      markRead(ids) { checkSession(); for (const id of ids) read.add(id); persist() },
      markAllRead() { checkSession(); read = new Set(notifications.map(item => item.id)); persist() },
      reset() { read = new Set(initiallyRead); persist() },
    },
  }
}
