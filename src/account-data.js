import { reactive } from 'vue'

// Each store owns its requests. Responses from a previous session cannot populate a new inbox.
export function createAccountData(auth, messages, withMessages = true) {
  const session = reactive({ user: null, status: 'idle', error: '' })
  const inbox = reactive({ items: [], status: 'idle', error: '' })
  let generation = 0
  let authRequest = 0
  const confirmedRead = new Set()
  let listRequest

  function setSession(user) {
    generation++
    confirmedRead.clear()
    listRequest = undefined
    Object.assign(inbox, { items: [], status: 'idle', error: '' })
    Object.assign(session, { user: user || null, status: 'ready', error: '' })
    if (user && withMessages) loadMessages()
  }

  async function restoreSession() {
    const request = ++authRequest
    Object.assign(session, { status: 'loading', error: '' })
    try {
      const user = await auth.getSession()
      if (request === authRequest) setSession(user)
    } catch (error) {
      if (request === authRequest) Object.assign(session, { status: 'error', error: error.message || '账户加载失败' })
    }
  }

  async function authenticate(kind, form) {
    const request = ++authRequest
    const user = await auth[kind](form)
    if (request === authRequest) setSession(user)
  }

  async function logout() {
    const request = ++authRequest
    await auth.logout()
    if (request === authRequest) setSession(null)
  }

  async function updateProfile(profile) {
    const active = generation
    const user = await auth.updateProfile(profile)
    if (active === generation) session.user = user
  }

  function loadMessages() {
    if (!session.user || !withMessages) return
    if (listRequest) return listRequest
    const active = generation
    Object.assign(inbox, { status: 'loading', error: '' })
    listRequest = Promise.resolve().then(() => messages.list()).then(items => {
      if (active !== generation) return
      if (!Array.isArray(items)) throw new Error('消息列表格式错误')
      Object.assign(inbox, { items: items.map(item => ({ ...item, read: item.read || confirmedRead.has(item.id) })), status: 'ready' })
    }).catch(error => {
      if (active === generation) Object.assign(inbox, { status: 'error', error: error.message || '消息加载失败' })
    }).finally(() => {
      if (active === generation) listRequest = undefined
    })
    return listRequest
  }

  async function markRead(ids) {
    const active = generation
    const requested = new Set(ids)
    const pending = inbox.items.filter(item => !item.read && requested.has(item.id)).map(item => item.id)
    if (!pending.length) return
    await messages.markRead(pending)
    if (active !== generation) return
    for (const id of pending) confirmedRead.add(id)
    for (const item of inbox.items) {
      if (confirmedRead.has(item.id)) item.read = true
    }
  }

  function useDemoSession(user) {
    ++authRequest
    setSession(user)
  }

  return { session, inbox, restoreSession, authenticate, logout, updateProfile, loadMessages, markRead, useDemoSession }
}
