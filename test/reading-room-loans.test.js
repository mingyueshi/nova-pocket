import assert from 'node:assert/strict'
import test from 'node:test'
import { effectScope, nextTick, ref } from 'vue'
import { createAccountData } from '../src/account-data.js'
import { createRequest } from '../examples/reading-room/src/adapters/request.js'
import { useLoans } from '../examples/reading-room/src/pocket-services/loans/use-loans.js'

function setup(t) {
  const account = createAccountData({ login: user => user, logout() {} }, {}, false)
  const target = ref({ id: '' })
  const visible = ref(true)
  const requests = []
  const scope = effectScope()
  t.after(() => scope.stop())
  const { result, retry } = scope.run(() => useLoans(account, (method, path) => new Promise((resolve, reject) => {
    requests.push({ method, path, resolve, reject })
  }), target, visible))
  return { account, target, visible, requests, result, retry }
}

test('switching readers on a mounted page discards late loan data and expired-session responses', async t => {
  const { account, requests, result, target } = setup(t)
  assert.equal(requests.length, 0)
  await account.authenticate('login', { id: 'a' })
  const listA = requests.at(-1)
  target.value = { id: '借阅/山川+02' }
  await nextTick()
  const detailA = requests.at(-1)
  assert.equal(detailA.path, '/loans/' + encodeURIComponent(target.value.id))
  await account.logout()
  assert.deepEqual(result.value, { status: 'idle' })
  await account.authenticate('login', { id: 'b' })
  requests.at(-1).reject(Object.assign(new Error(), { statusCode: 404 }))
  await nextTick()
  detailA.resolve({ id: target.value.id, title: '只属于甲' })
  listA.reject(Object.assign(new Error(), { statusCode: 401 }))
  await nextTick()
  assert.deepEqual(result.value, { status: 'unavailable' })
  assert.equal(account.session.user.id, 'b')
  target.value = { id: '' }
  await nextTick()
  requests.at(-1).resolve([{ id: 'b-loan' }])
  await nextTick()
  assert.deepEqual(result.value.items, [{ id: 'b-loan' }])
})

test('a late 401 for an old loan request preserves the new reader token on the device', async t => {
  const storage = new Map()
  const calls = []
  const previous = globalThis.uni
  globalThis.uni = {
    getStorageSync: key => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: key => storage.delete(key),
    request: options => calls.push(options),
  }
  t.after(() => {
    if (previous === undefined) delete globalThis.uni
    else globalThis.uni = previous
  })
  const request = createRequest('/api')
  async function signIn(id) {
    const pending = request('POST', '/session', { account: id })
    calls.at(-1).success({ statusCode: 200, data: { token: id, user: { id } } })
    await pending
  }
  await signIn('reader-a')
  const old = request('GET', '/loans')
  const sent = calls.at(-1)
  assert.equal(sent.header.Authorization, 'Bearer reader-a')
  await signIn('reader-b')
  sent.success({ statusCode: 401, data: { message: '书房会话已过期' } })
  await assert.rejects(old, { statusCode: 401 })
  const current = request('GET', '/loans')
  assert.equal(calls.at(-1).header.Authorization, 'Bearer reader-b')
  calls.at(-1).success({ statusCode: 200, data: [] })
  await current
})

test('loan requests handle empty lists, retry, invalid responses and current-session expiry', async t => {
  const { account, requests, result, retry, target, visible } = setup(t)
  await account.authenticate('login', { id: 'a' })
  assert.equal(result.value.status, 'loading')
  requests.at(-1).reject(new Error('暂时离线'))
  await nextTick()
  assert.deepEqual(result.value, { status: 'error', error: '暂时离线' })
  retry()
  await nextTick()
  assert.equal(requests.at(-1).path, '/loans')
  requests.at(-1).resolve([])
  await nextTick()
  assert.deepEqual(result.value, { status: 'ready', items: [] })
  target.value = { id: 'a-loan' }
  await nextTick()
  requests.at(-1).resolve({ id: 'wrong' })
  await nextTick()
  assert.equal(result.value.status, 'error')
  retry()
  await nextTick()
  requests.at(-1).reject(Object.assign(new Error(), { statusCode: 401 }))
  await nextTick()
  await nextTick()
  assert.equal(account.session.expired, true)
  assert.equal(account.session.user, null)
  assert.deepEqual(result.value, { status: 'idle' })
  visible.value = false
  const count = requests.length
  await account.authenticate('login', { id: 'b' })
  assert.equal(requests.length, count)
})
