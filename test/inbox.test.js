import assert from 'node:assert/strict'
import test from 'node:test'
import { createDemoAdapters } from '../src/adapters/demo.js'
import { notifications } from '../src/adapters/demo-messages.js'
import { createInbox } from '../src/inbox.js'

const row = (id, read = false) => ({ id, title: id, read })
const page = (items, unreadCount) => ({ items, unreadCount, nextCursor: null })

test('demo storage discards invalid and obsolete IDs on restore and write', () => {
  let snapshot
  const storage = { load: () => snapshot, save: data => { snapshot = globalThis.structuredClone(data) } }
  const initiallyRead = notifications.filter(item => item.read).map(item => item.id)
  const unread = notifications.find(item => !item.read).id
  createDemoAdapters(storage).auth.getSession()
  snapshot.read.push('obsolete', 17, unread, unread)
  const demo = createDemoAdapters(storage)
  demo.auth.getSession()
  assert.deepEqual(snapshot.read, [...initiallyRead, unread])

  demo.messages.markRead(['not-a-message', 18, unread])
  assert.deepEqual(snapshot.read, [...initiallyRead, unread])
  demo.messages.markAllRead()
  assert.deepEqual(snapshot.read, notifications.map(item => item.id))
})

test('reopening a detail shares one reactive record and a pending read can update every holder', async () => {
  const write = Promise.withResolvers()
  const started = Promise.withResolvers()
  let gets = 0
  const store = createInbox({
    listPage: () => page([row('a'), row('b')], 2),
    get: id => { gets++; return { ...row(id), body: 'message body' } },
    markRead: ids => { started.resolve(ids); return write.promise },
  }, assert.fail)
  store.reset(true)
  await store.loadMessages()

  const [original, duplicate] = await Promise.all([store.getMessage('a'), store.getMessage('a')])
  assert.strictEqual(original, duplicate)
  const pending = store.markRead(['a'])
  const reopen = store.getMessage('a')
  assert.deepEqual(await started.promise, ['a'])
  write.resolve({ unreadCount: 1 })
  await pending

  assert.strictEqual(await reopen, original)
  assert.equal(gets, 1)
  assert.equal(original.read, true)
  assert.equal(store.inbox.items[0].read, true)
  assert.equal(store.inbox.unreadCount, 1)
})

test('refresh fetches new detail content while stale detail and list responses cannot undo saved reads', async () => {
  let list = page([row('a')], 1)
  let body = 'old body'
  const store = createInbox({
    listPage: () => list,
    get: id => ({ ...row(id), body }),
    markRead: () => ({ unreadCount: 0 }),
    markAllRead: () => ({ unreadCount: 0 }),
  }, assert.fail)
  store.reset(true)
  await store.loadMessages()
  const original = await store.getMessage('a')
  await store.markRead(['a'])
  assert.equal(store.inbox.unreadCount, 0)

  list = page([row('a'), row('b')], 2)
  body = 'new body'
  await store.loadMessages()
  assert.deepEqual(store.inbox.items.map(item => item.read), [true, false])
  assert.equal(store.inbox.unreadCount, 1)
  assert.strictEqual(await store.getMessage('a'), original)
  assert.deepEqual({ body: original.body, read: original.read }, { body: 'new body', read: true })
  assert.equal(store.inbox.unreadCount, 1)

  const second = await store.getMessage('b')
  await store.markAllRead()
  assert.equal(second.read, true)
  list = page([row('a'), row('b'), row('c')], 3)
  await store.loadMessages()
  assert.deepEqual(store.inbox.items.map(item => item.read), [true, true, false])
  assert.equal(store.inbox.unreadCount, 1)

  store.reset(true)
  await store.loadMessages()
  assert.equal((await store.getMessage('a')).read, false)
  assert.equal(store.inbox.unreadCount, 3)
})

test('a removed detail and a transient failure after refresh can be revalidated', async () => {
  let get = id => ({ ...row(id), body: 'message body' })
  const store = createInbox({ listPage: () => page([row('a')], 1), get: id => get(id) }, () => {})
  store.reset(true)
  await store.loadMessages()
  const original = await store.getMessage('a')
  await store.loadMessages()
  get = () => { throw new Error('temporary failure') }
  await assert.rejects(store.getMessage('a'), /temporary failure/)
  get = () => null
  assert.equal(await store.getMessage('a'), null)
  get = id => ({ ...row(id), body: 'restored body' })
  const restored = await store.getMessage('a')
  assert.notStrictEqual(restored, original)
  assert.equal(restored.body, 'restored body')
})
