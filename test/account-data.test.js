import test from 'node:test'
import assert from 'node:assert/strict'
import { createAccountData } from '../src/account-data.js'
import { createDemoAdapters } from '../src/adapters/demo.js'
import { createHttpAdapters } from '../src/adapters/http.js'

test('demo codes belong to the account and flow that requested them', async () => {
  const { auth } = createDemoAdapters()
  const form = { account: 'one@example.test', method: 'code', code: '246810' }
  auth.sendCode({ ...form, purpose: 'login' })
  assert.throws(() => auth.login({ ...form, account: 'other@example.test' }))
  assert.throws(() => auth.recover({ ...form, password: 'test-password' }))
  assert.equal(auth.login(form).id, 'demo')
  assert.throws(() => auth.login(form))
})

test('an application can replace both adapters, persist read state and update the profile', async () => {
  const calls = []
  const user = { id: '1', nickname: '初始' }
  const adapters = createHttpAdapters(async (method, path, data) => {
    calls.push([method, path, data])
    if (path === '/session' && method === 'GET') return null
    if (path === '/session' && method === 'POST') return user
    if (path === '/profile') return { ...user, ...data }
    if (path === '/messages') return [{ id: 'id/1', read: false }]
  })
  const store = createAccountData(adapters.auth, adapters.messages)
  await store.restoreSession()
  assert.equal(store.session.user, null)
  assert.equal(store.inbox.status, 'idle')
  await store.authenticate('login', { account: 'member@my.org', password: 'p', method: 'password' })
  await store.loadMessages()
  await store.markRead(['id/1'])
  assert.ok(store.inbox.items[0].read)
  await store.updateProfile({ nickname: '更新' })
  assert.equal(store.session.user.nickname, '更新')
  await store.logout()
  assert.equal(store.session.user, null)
  assert.deepEqual(store.inbox.items, [])
  assert.ok(calls.some(([method, path, data]) => method === 'POST' && path === '/messages/read' && data.ids[0] === 'id/1'))
  assert.ok(calls.some(([method, path]) => method === 'PUT' && path === '/profile'))
})

test('late list and read responses cannot affect the next account', async () => {
  const oldList = Promise.withResolvers()
  const oldRead = Promise.withResolvers()
  let list = () => [{ id: 'same-id', read: false }]
  const store = createAccountData({
    getSession: () => ({ id: 'first' }), logout() {}, login: () => ({ id: 'second' }),
  }, { list: () => list(), markRead: () => oldRead.promise })
  await store.restoreSession()
  await store.loadMessages()
  const mark = store.markRead(['same-id'])
  list = () => oldList.promise
  const previous = store.loadMessages()
  await store.logout()
  list = () => [{ id: 'same-id', read: false }]
  await store.authenticate('login', {})
  await store.loadMessages()
  oldList.resolve([{ id: 'private', read: true }])
  oldRead.resolve()
  await Promise.all([previous, mark])
  assert.deepEqual(store.inbox.items, [{ id: 'same-id', read: false }])
})

test('a failed list or read can be retried without losing unread state', async () => {
  let offline = true
  const { auth, messages } = createDemoAdapters()
  const store = createAccountData(auth, {
    list() {
      if (offline) throw new Error('网络错误')
      return messages.list()
    },
    markRead(ids) {
      if (offline) throw new Error('网络错误')
      return messages.markRead(ids)
    },
  })
  await store.restoreSession()
  await store.loadMessages()
  assert.equal(store.inbox.status, 'error')
  offline = false
  await store.loadMessages()
  offline = true
  await assert.rejects(store.markRead(['welcome']), /网络错误/)
  assert.equal(store.inbox.items[0].read, false)
  offline = false
  await store.markRead(['welcome'])
  assert.equal(store.inbox.items[0].read, true)
})
