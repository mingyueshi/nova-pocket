import { reactive } from 'vue'

const empty = () => ({
  items: [], unreadCount: 0, nextCursor: null, status: 'idle', error: '',
  moreStatus: 'idle', moreError: '',
})

export function createInbox(messages, onError) {
  const inbox = reactive(empty())
  let current

  function reset(enabled) {
    current = enabled ? { queue: Promise.resolve(), details: new Map(), cursors: new Set() } : null
    Object.assign(inbox, empty())
  }

  // Order reads and writes within one account. A new session gets its own queue immediately.
  function enqueue(ctx, job) {
    const task = ctx.queue.then(async () => {
      if (ctx !== current) return
      try {
        return await job()
      } catch (error) {
        if (ctx === current) {
          onError(error)
          throw error
        }
      }
    })
    ctx.queue = task.catch(() => {})
    return task
  }

  function loadMessages(more = false) {
    const ctx = current
    if (!ctx) return
    if (ctx.loading) {
      if (!more && ctx.loadingMore) return ctx.loading.then(() => ctx === current && loadMessages())
      return ctx.loading
    }
    const cursor = more ? inbox.nextCursor : null
    if (more && cursor === null) return
    ctx.loadingMore = more
    if (more) Object.assign(inbox, { moreStatus: 'loading', moreError: '' })
    else Object.assign(inbox, { status: 'loading', error: '' })
    ctx.loading = enqueue(ctx, async () => {
      const page = messages.listPage
        ? await messages.listPage({ cursor, limit: 20 })
        : { items: await messages.list(), nextCursor: null }
      if (ctx !== current) return
      if (!Array.isArray(page?.items)) throw new Error('消息列表格式错误')
      const { items, nextCursor = null } = page
      if (nextCursor !== null && (typeof nextCursor !== 'string' || !nextCursor || (more && ctx.cursors.has(nextCursor)))) {
        throw new Error('消息分页游标无效')
      }
      const unreadCount = messages.listPage ? page.unreadCount : items.filter(item => !item.read).length
      if (!Number.isSafeInteger(unreadCount) || unreadCount < 0) throw new Error('未读数量无效')
      const merged = new Map(more ? inbox.items.map(item => [item.id, item]) : [])
      for (const item of items) {
        if (!item || typeof item.id !== 'string' || !item.id) throw new Error('消息缺少有效 ID')
        merged.set(item.id, { ...item })
      }
      for (const item of items) {
        const detail = ctx.details.get(item.id)
        if (detail) Object.assign(detail, item)
      }
      if (!more) ctx.cursors.clear()
      if (nextCursor !== null) ctx.cursors.add(nextCursor)
      Object.assign(inbox, { items: [...merged.values()], unreadCount, nextCursor, status: 'ready', moreStatus: 'idle', moreError: '' })
    }).catch(error => {
      if (ctx !== current) return
      if (more) Object.assign(inbox, { moreStatus: 'error', moreError: error.message || '加载下一页失败' })
      else Object.assign(inbox, { status: 'error', error: error.message || '消息加载失败' })
    }).finally(() => { ctx.loading = null })
    return ctx.loading
  }

  async function getMessage(id) {
    const ctx = current
    if (!ctx || !id) return null
    if (!messages.listPage) {
      if (inbox.status !== 'ready') await loadMessages()
      if (ctx !== current) return null
      if (inbox.status === 'error') throw new Error(inbox.error)
      return inbox.items.find(item => item.id === id) || null
    }
    return enqueue(ctx, async () => {
      const item = await messages.get(id)
      if (ctx !== current || !item) return null
      if (item.id !== id) throw new Error('消息详情 ID 不匹配')
      const listed = inbox.items.find(row => row.id === id)
      if (listed && Boolean(listed.read) !== Boolean(item.read)) {
        inbox.unreadCount = Math.max(0, inbox.unreadCount + (item.read ? -1 : 1))
        listed.read = item.read
      }
      const detail = reactive({ ...item })
      ctx.details.set(id, detail)
      return detail
    })
  }

  function saveRead(ids) {
    const ctx = current
    if (!ctx) return
    return enqueue(ctx, async () => {
      const all = ids === null
      const known = new Map(ctx.details)
      for (const item of inbox.items) known.set(item.id, item)
      const targets = all ? [...known.keys()] : [...new Set(ids)]
      const pending = targets.filter(id => known.has(id) && !known.get(id).read)
      const bulk = all && messages.listPage
      if (!bulk && !pending.length) return
      const result = bulk ? await messages.markAllRead() : await messages.markRead(pending)
      if (ctx !== current) return
      const changed = new Set(pending)
      for (const item of [...inbox.items, ...ctx.details.values()]) {
        if (all || changed.has(item.id)) item.read = true
      }
      inbox.unreadCount = Number.isSafeInteger(result?.unreadCount) && result.unreadCount >= 0
        ? result.unreadCount : all ? 0 : Math.max(0, inbox.unreadCount - pending.length)
    })
  }

  return { inbox, reset, loadMessages, getMessage, markRead: ids => saveRead(ids), markAllRead: () => saveRead(null) }
}
