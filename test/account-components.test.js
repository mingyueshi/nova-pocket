import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import { setImmediate as flush } from 'node:timers/promises'
import { createRenderer, h, nextTick, reactive } from 'vue'
import config from '../src/pocket.config.js'
import { account } from '../src/state.js'

register('../scripts/vue-unit-loader.js', import.meta.url)
const { default: MessagePanel } = await import('../src/components/MessagePanel.vue')
const { default: AccountScreen } = await import('../src/components/AccountScreen.vue')

function element(type, text = '') {
  return { type, text, props: {}, parent: null, children: [] }
}

function detach(node) {
  if (!node.parent) return
  node.parent.children.splice(node.parent.children.indexOf(node), 1)
  node.parent = null
}

const renderer = createRenderer({
  createElement: type => element(type),
  createText: text => element('#text', text),
  createComment: () => element('#comment'),
  setText: (node, text) => { node.text = text },
  setElementText: (node, text) => { node.children = []; node.text = text },
  parentNode: node => node.parent,
  nextSibling: node => node.parent?.children[node.parent.children.indexOf(node) + 1],
  patchProp: (node, key, _, value) => { node.props[key] = value },
  remove: detach,
  insert(node, parent, before) {
    detach(node)
    const index = before ? parent.children.indexOf(before) : parent.children.length
    parent.children.splice(index, 0, node)
    node.parent = parent
  },
})

function text(node) {
  return node.text + node.children.map(text).join('')
}

function find(node, predicate) {
  if (predicate(node)) return node
  for (const child of node.children) {
    const match = find(child, predicate)
    if (match) return match
  }
}

function mount(t, Component, props) {
  const root = element('root')
  const app = renderer.createApp({ render: () => h(Component, { ...props }) })
  app.mount(root)
  t.after(() => app.unmount())
  return root
}

function session(t, user) {
  const previous = { ...account.session }
  Object.assign(account.session, { user, status: 'ready', expired: false })
  t.after(() => Object.assign(account.session, previous))
}

function tap(root, label) {
  const button = find(root, node => node.type === 'button' && text(node) === label)
  assert.ok(button?.props.onTap, 'Expected an action for ' + label)
  button.props.onTap()
}

test('message detail ignores a response from the previously opened record', async t => {
  session(t, { id: 'reader' })
  const first = Promise.withResolvers(), second = Promise.withResolvers()
  const writes = []
  t.mock.method(account, 'getMessage', id => id === 'first' ? first.promise : second.promise)
  t.mock.method(account, 'markRead', async ids => { writes.push(ids) })
  const props = reactive({ detail: true, active: true, recordId: 'first' })
  const root = mount(t, MessagePanel, props)
  assert.match(text(root), /正在加载消息/)

  props.recordId = 'second'
  await nextTick()
  second.resolve({ id: 'second', title: '新通知', body: '新通知正文', read: false })
  await flush()
  first.resolve({ id: 'first', title: '上条通知', body: '上条正文', read: false })
  await flush()
  assert.match(text(root), /新通知正文/)
  assert.doesNotMatch(text(root), /上条正文/)
  assert.deepEqual(writes, [['second']])
})

test('message detail renders missing and error states and retries read writes', async t => {
  session(t, { id: 'reader' })
  let available = false
  let attempts = 0
  t.mock.method(account, 'getMessage', async id => {
    if (id === 'missing') throw Object.assign(new Error('not found'), { statusCode: 404 })
    if (!available) throw new Error('读取失败')
    return { id, title: '通知标题', body: '通知正文', read: false }
  })
  t.mock.method(account, 'markRead', async () => {
    if (++attempts === 1) throw new Error('保存失败')
  })

  const props = reactive({ detail: true, active: true, recordId: 'missing' })
  const root = mount(t, MessagePanel, props)
  await flush()
  assert.match(text(root), /消息不存在/)
  props.recordId = 'present'
  await flush()
  assert.match(text(root), /暂时无法加载消息.*读取失败/)
  available = true
  tap(root, '重试')
  await flush()
  assert.match(text(root), /通知正文.*保存失败/)
  tap(root, '重试标记已读')
  await flush()
  assert.equal(attempts, 2)
  assert.doesNotMatch(text(root), /保存失败|重试标记已读/)
})

test('account entry adapts the rendered identity and actions to the session', async t => {
  session(t, null)
  const root = mount(t, AccountScreen, { route: 'home', tab: 'home' })
  assert.match(text(root), /你好，访客.*登录.*注册/)
  assert.doesNotMatch(text(root), /编辑资料|完善资料/)

  account.session.user = { id: 'reader', nickname: '舟', mode: 'incomplete' }
  await nextTick()
  assert.match(text(root), /舟.*完善资料.*个人资料待完善/)
  account.session.user.mode = 'member'
  await nextTick()
  assert.match(text(root), /舟.*编辑资料.*账户状态正常/)
  assert.doesNotMatch(text(root), /你好，访客|去登录/)
})


test('a gated order module renders login rather than demo orders for a guest', async t => {
  session(t, null)
  const orders = config.modules.orders
  orders.requiresLogin = true
  t.after(() => { delete orders.requiresLogin })
  const root = mount(t, AccountScreen, { route: 'orders', tab: 'services' })
  assert.match(text(root), /登录后可查看这项服务.*去登录/)
  assert.doesNotMatch(text(root), /旅行收纳套装/)

  account.session.user = { id: 'reader', mode: 'member' }
  await nextTick()
  assert.match(text(root), /旅行收纳套装/)
  assert.doesNotMatch(text(root), /登录后可查看这项服务/)
})
