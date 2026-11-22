import { reactive } from 'vue'
import { createInbox } from './inbox.js'

export function isSessionExpired(error) {
  return error?.code === 'SESSION_EXPIRED' || (error?.statusCode ?? error?.status ?? error?.response?.status) === 401
}

export function createAccountData(auth, messages, withMessages = true) {
  const session = reactive({ user: null, status: 'idle', error: '', expired: false, version: 0 })
  const mailbox = createInbox(messages, error => {
    if (isSessionExpired(error)) setSession(null, true)
  })
  let authRequest = 0
  let restoring
  let changing

  function setSession(user, expired = false) {
    ++authRequest
    restoring = undefined
    session.version++
    Object.assign(session, { user: user || null, status: 'ready', error: '', expired })
    mailbox.reset(Boolean(user && withMessages))
    if (user && withMessages) mailbox.loadMessages()
  }

  function restoreSession() {
    if (changing) return changing.catch(() => {})
    if (restoring) return restoring
    const request = ++authRequest
    if (!session.user || session.status === 'error') session.status = 'loading'
    session.error = ''
    restoring = Promise.resolve().then(() => auth.getSession()).then(user => {
      if (request !== authRequest) return
      if (user && session.user && user.id === session.user.id) {
        Object.assign(session, { user, status: 'ready', expired: false })
        mailbox.loadMessages()
      } else {
        setSession(user, !user && (session.expired || Boolean(session.user)))
      }
    }).catch(error => {
      if (request !== authRequest) return
      if (isSessionExpired(error)) setSession(null, true)
      else Object.assign(session, { status: 'error', error: error.message || '账户加载失败' })
    }).finally(() => {
      if (request === authRequest) restoring = undefined
    })
    return restoring
  }

  function changeSession(work) {
    if (changing) return Promise.reject(new Error('账户状态正在更新，请稍后重试'))
    ++authRequest
    restoring = undefined
    if (session.status === 'loading') session.status = 'ready'
    changing = Promise.resolve().then(work).finally(() => { changing = undefined })
    return changing
  }

  function authenticate(kind, form) {
    // An invalid password is a form failure. A protected request's 401 may expire the old
    // account while login is pending, but must not discard the new successful login.
    return changeSession(async () => {
      const user = await auth[kind](form)
      if (!user || user.id == null) throw new Error('登录接口没有返回用户')
      setSession(user)
    })
  }

  function logout() {
    return changeSession(async () => {
      try {
        await auth.logout()
      } catch (error) {
        if (!isSessionExpired(error)) throw error
      }
      setSession(null)
    })
  }

  async function updateProfile(profile) {
    const version = session.version
    try {
      const user = await auth.updateProfile(profile)
      if (version !== session.version) throw new Error('账户状态已变更')
      session.user = user
    } catch (error) {
      handleSessionError(error, version)
      throw error
    }
  }

  function handleSessionError(error, version) {
    if (version !== session.version || !isSessionExpired(error)) return false
    setSession(null, true)
    return true
  }

  const { inbox, loadMessages, getMessage, markRead, markAllRead } = mailbox
  return { session, inbox, restoreSession, authenticate, logout, updateProfile, handleSessionError, loadMessages,
    getMessage, markRead, markAllRead, useDemoSession: setSession }
}
