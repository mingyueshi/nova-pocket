import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import { createReadingRoomServer } from '../examples/reading-room/server.js'

async function startApi(t) {
  const server = createReadingRoomServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => server[Symbol.asyncDispose]())
  const api = 'http://127.0.0.1:' + server.address().port + '/api'
  return function call(method, path, data, token) {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = 'Bearer ' + token
    return globalThis.fetch(api + path, { method, headers, body: JSON.stringify(data) })
  }
}

const reader = { account: 'reader@example.test', method: 'password', password: 'ReadingDemo2026' }

test('the sample API serves a guest, independent sessions and one shared paginated reader inbox', async t => {
  const call = await startApi(t)
  assert.equal(await (await call('GET', '/session')).json(), null)
  assert.equal((await call('GET', '/messages')).status, 401)
  assert.equal((await call('POST', '/session', { ...reader, account: 'other@example.test' })).status, 400)

  const { token } = await (await call('POST', '/session', reader)).json()
  const { token: second } = await (await call('POST', '/session', reader)).json()
  assert.ok(token && second && token !== second)
  const firstPage = await (await call('GET', '/messages?limit=20', undefined, token)).json()
  assert.deepEqual(firstPage.items.map(item => item.id), ['welcome', 'hours'])
  assert.equal(firstPage.unreadCount, 2)
  assert.equal((await call('GET', '/messages?limit=20&cursor=bad', undefined, token)).status, 400)
  const next = await (await call('GET', '/messages?limit=20&cursor=' + firstPage.nextCursor, undefined, token)).json()
  assert.equal(next.nextCursor, null)
  const [last] = next.items
  assert.equal(last.id, '借阅/提醒')
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(await (await call('POST', '/messages/read', { ids: [last.id] }, token)).json(), { unreadCount: 1 })
  }
  assert.equal((await (await call('GET', '/messages/' + encodeURIComponent(last.id), undefined, second)).json()).read, true)
  assert.deepEqual(await (await call('POST', '/messages/read-all', undefined, token)).json(), { unreadCount: 0 })
  assert.equal((await call('PUT', '/profile', { nickname: '青禾读者' }, token)).status, 200)
  assert.equal((await call('DELETE', '/session', undefined, token)).status, 200)
  assert.equal((await call('GET', '/session', undefined, token)).status, 401)
  assert.equal((await (await call('GET', '/session', undefined, second)).json()).nickname, '青禾读者')
})

test('each reader sees their own loans, profile and inbox across independent sessions', async t => {
  const call = await startApi(t)
  const a = await (await call('POST', '/session', reader)).json()
  const b = await (await call('POST', '/session', { ...reader, account: 'lin@example.test' })).json()
  const get = (path, token) => call('GET', path, undefined, token)
  assert.notEqual(a.user.id, b.user.id)
  const detail = '/loans/' + encodeURIComponent('借阅/山川+02')
  for (const path of ['/loans', detail]) assert.equal((await get(path)).status, 401)
  assert.deepEqual((await (await get('/loans', a.token)).json()).map(x => x.title), ['山川笔记', '城市里的树'])
  assert.deepEqual((await (await get('/loans', b.token)).json()).map(x => x.title), ['河岸手记'])
  assert.equal((await (await get(detail, a.token)).json()).due, '2026-12-10')
  const foreign = await get(detail, b.token)
  const missing = await get('/loans/missing', b.token)
  assert.equal(foreign.status, 404)
  assert.equal(missing.status, 404)
  assert.deepEqual(await foreign.json(), await missing.json())
  assert.equal((await get('/loans/BR-2051', a.token)).status, 404)
  assert.equal((await (await get('/loans/BR-2051', b.token)).json()).title, '河岸手记')
  await call('PUT', '/profile', { nickname: '改名的青禾' }, a.token)
  await call('POST', '/messages/read-all', {}, a.token)
  assert.deepEqual(await (await get('/session', b.token)).json(), b.user)
  assert.equal((await (await get('/messages?limit=2', b.token)).json()).unreadCount, 1)
  assert.equal((await call('DELETE', '/session', undefined, a.token)).status, 200)
  assert.equal((await get(detail, a.token)).status, 401)
  assert.equal((await get('/loans', b.token)).status, 200)
})
