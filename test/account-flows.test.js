import assert from 'node:assert/strict'
import test from 'node:test'
import { createAccountData } from '../src/account-data.js'
import { createDemoAdapters } from '../src/adapters/demo.js'
import { createHttpAdapters } from '../src/adapters/http.js'
import { accountTarget, authUrl, firstTab, isDetail, pageRecordId, targetUrl } from '../src/account-navigation.js'

test('demo sessions, logout and reads survive a fresh instance, and expired sessions require login', () => {
  let snapshot
  const storage = { load: () => snapshot, save: value => { snapshot = JSON.parse(JSON.stringify(value)) } }
  const first = createDemoAdapters(storage)
  first.auth.getSession()
  first.auth.updateProfile({ nickname: '测试昵称' })
  first.messages.markRead(['welcome'])
  const second = createDemoAdapters(storage)
  assert.equal(second.auth.getSession().nickname, '测试昵称')
  assert.equal(second.messages.listPage({ cursor: null, limit: 20 }).unreadCount, 1)
  second.auth.logout()
  const third = createDemoAdapters(storage)
  assert.equal(third.auth.getSession(), null)
  third.auth.login({ method: 'password', account: 'x@example.test', password: 'demo-password' })
  snapshot.expiresAt = Date.now() - 1
  assert.throws(() => third.messages.list(), { code: 'SESSION_EXPIRED' })
  assert.throws(() => createDemoAdapters(storage).auth.getSession(), { code: 'SESSION_EXPIRED' })
  assert.doesNotMatch(JSON.stringify(snapshot), /password|x@example|246810/)
})

test('a paged inbox deduplicates pages and retries exactly the failed cursor', async () => {
  const cursors = []
  let fail = true
  const { auth } = createDemoAdapters()
  const store = createAccountData(auth, {
    listPage({ cursor }) {
      cursors.push(cursor)
      if (cursor && fail) throw new Error('暂时离线')
      return cursor ? { items: [{ id: 'a', read: true }, { id: 'b', read: false }], nextCursor: null, unreadCount: 1 }
        : { items: [{ id: 'a', read: false }], nextCursor: 'next+1', unreadCount: 2 }
    },
  })
  await store.restoreSession()
  await store.loadMessages()
  assert.equal(store.inbox.unreadCount, 2)
  await Promise.all([store.loadMessages(true), store.loadMessages(true)])
  assert.equal(store.inbox.moreStatus, 'error')
  assert.deepEqual(store.inbox.items.map(m => m.id), ['a'])
  assert.equal(store.inbox.nextCursor, 'next+1')
  fail = false
  await store.loadMessages(true)
  assert.deepEqual(cursors, [null, 'next+1', 'next+1'])
  assert.deepEqual(store.inbox.items.map(m => m.id), ['a', 'b'])
  assert.equal(store.inbox.unreadCount, 1)
  assert.equal(store.inbox.nextCursor, null)
})

test('deep links outside the loaded page and bulk reads use mailbox-wide counts', async () => {
  const calls = []
  let fail = true
  const store = createAccountData({ getSession: () => ({ id: 'u' }) }, {
    listPage: () => ({ items: [{ id: 'a', read: false }], nextCursor: 'cursor', unreadCount: 5 }),
    get: id => ({ id, body: '正文', read: false }),
    markRead(ids) { calls.push(ids); return { unreadCount: 4 } },
    markAllRead() { if (fail) throw new Error('保存失败'); calls.push('all') },
  })
  await store.restoreSession()
  const detail = await store.getMessage('on-page-three')
  await Promise.all([store.markRead([detail.id]), store.markRead([detail.id])])
  assert.deepEqual(calls, [['on-page-three']])
  assert.equal(detail.read, true)
  assert.equal(store.inbox.unreadCount, 4)
  await assert.rejects(store.markAllRead(), /保存失败/)
  assert.equal(store.inbox.unreadCount, 4)
  fail = false
  await store.markAllRead()
  assert.equal(store.inbox.unreadCount, 0)
  assert.equal(store.inbox.items[0].read, true)
  assert.deepEqual(calls, [['on-page-three'], 'all'])
})

test('401 expires protected data once, while network failures, 403 and bad login are retryable', async () => {
  let failure
  const user = { id: 'u', nickname: '昵称' }
  const store = createAccountData({
    getSession() { if (failure) throw failure; return user },
    login() { throw Object.assign(new Error('账号有误'), { status: 401 }) },
    updateProfile() { throw Object.assign(new Error('已过期'), { statusCode: 401 }) },
  }, { list: () => [{ id: 'private' }] })
  await store.restoreSession()
  await store.loadMessages()
  await assert.rejects(store.authenticate('login', {}))
  assert.equal(store.session.user.id, 'u')
  failure = { status: 403 }
  await store.restoreSession()
  assert.equal(store.session.expired, false)
  assert.equal(store.session.status, 'error')
  failure = undefined
  await store.restoreSession()
  assert.equal(store.session.status, 'ready')
  await assert.rejects(store.updateProfile({ nickname: '新昵称' }))
  assert.equal(store.session.user, null)
  assert.equal(store.session.expired, true)
  assert.deepEqual(store.inbox.items, [])
  failure = { response: { status: 401 } }
  await store.restoreSession()
  assert.equal(store.session.status, 'ready')
  assert.equal(store.session.expired, true)
})

test('a stale detail 401 cannot sign out a different user', async () => {
  const started = Promise.withResolvers(), reply = Promise.withResolvers()
  const store = createAccountData({
    getSession: () => ({ id: 'one' }), login: () => ({ id: 'two' }),
  }, {
    listPage: () => ({ items: [], nextCursor: null, unreadCount: 0 }),
    get() { started.resolve(); return reply.promise },
  })
  await store.restoreSession()
  const oldDetail = store.getMessage('secret')
  await started.promise
  await store.authenticate('login', {})
  reply.reject(Object.assign(new Error('过期'), { statusCode: 401 }))
  await oldDetail
  assert.equal(store.session.user.id, 'two')
  assert.equal(store.session.expired, false)
})

test('a foreground session check cannot undo a login that started while restoration was pending', async () => {
  const oldSession = Promise.withResolvers()
  const login = Promise.withResolvers()
  let checks = 0
  const store = createAccountData({
    getSession() { checks++; return oldSession.promise },
    login: () => login.promise,
  }, {}, false)
  const restoring = store.restoreSession()
  const signingIn = store.authenticate('login', {})
  const foreground = store.restoreSession()
  login.resolve({ id: 'new-user' })
  await Promise.all([signingIn, foreground])
  oldSession.reject(Object.assign(new Error('旧会话已过期'), { status: 401 }))
  await restoring
  assert.equal(checks, 1)
  assert.equal(store.session.user.id, 'new-user')
  assert.equal(store.session.expired, false)
})

test('login return parameters preserve the record exactly and only address configured pages', () => {
  const id = '消息 +?/%&=%2F'
  const target = accountTarget(isDetail('message') ? 'message' : 'security', id, firstTab)
  const auth = new URL(authUrl('register', target), 'https://example.test')
  const after = accountTarget(auth.searchParams.get('returnView'), auth.searchParams.get('returnId'), auth.searchParams.get('returnTab'))
  assert.deepEqual(after, target)
  assert.equal(new URL(targetUrl(after), auth).searchParams.get('id'), id)
  assert.equal(pageRecordId(id, 'h5'), id)
  assert.equal(pageRecordId(encodeURIComponent(id), 'mp-weixin'), id)
  assert.equal(pageRecordId('%', 'mp-weixin'), '%')
  for (const view of ['https://example.test', '//external', 'toString', '/pages/auth/login']) {
    assert.equal(accountTarget(view), null)
  }
})

test('HTTP adapters keep legacy paths by default and encode paginated cursors and message IDs', async () => {
  const request = async (method, path, data) => [method, path, data]
  const legacy = createHttpAdapters(request).messages
  assert.equal(legacy.listPage, undefined)
  assert.deepEqual(await legacy.list(), ['GET', '/messages', undefined])
  const paged = createHttpAdapters(request, { paginatedMessages: true }).messages
  assert.deepEqual(await paged.listPage({ cursor: 'a/+', limit: 20 }), ['GET', '/messages?limit=20&cursor=a%2F%2B', undefined])
  assert.deepEqual(await paged.get('a/b'), ['GET', '/messages/a%2Fb', undefined])
  assert.deepEqual(await paged.markAllRead(), ['POST', '/messages/read-all', undefined])
})
