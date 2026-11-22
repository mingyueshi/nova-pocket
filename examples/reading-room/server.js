import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { createDemoAdapters } from '../../src/adapters/demo.js'

const reader = 'reader@example.test'
const notices = [
  { id: 'welcome', title: '读者卡已开通', date: '今天', body: '欢迎来到青禾书房。' },
  { id: 'hours', title: '周末开放时间', date: '昨天', body: '周末开馆时间为上午九点至下午五点。' },
  { id: '借阅/提醒', title: '借阅到期提醒', date: '上周', body: '你借阅的《山川笔记》即将到期。' },
]
function problem(status, message) {
  return Object.assign(new Error(message), { status })
}

async function readBody(req) {
  req.setEncoding('utf8')
  let text = ''
  for await (const chunk of req) {
    text += chunk
    if (text.length > 8192) throw problem(413, '请求内容过长')
  }
  try {
    const body = JSON.parse(text)
    if (body && typeof body === 'object' && !Array.isArray(body)) return body
  } catch { /* An invalid body has the same response as the wrong JSON type. */ }
  throw problem(400, '请提交 JSON 对象')
}

// Loopback fixture: one fictional reader, with separate tokens for each login.
export function createReadingRoomServer() {
  const { auth } = createDemoAdapters()
  const sessions = new Map()
  const read = new Set(['hours'])

  function issue(user) {
    for (const [token, expires] of sessions) if (expires <= Date.now()) sessions.delete(token)
    const token = randomUUID()
    sessions.set(token, Date.now() + 30 * 60 * 1000)
    return { user, token }
  }

  function message(row) { return { ...row, read: read.has(row.id) } }
  function count() { return { unreadCount: notices.length - read.size } }

  async function dispatch(req, url) {
    const path = url.pathname
    const method = req.method
    if (method === 'POST' && ['/api/session', '/api/accounts', '/api/verification-codes', '/api/password/reset'].includes(path)) {
      const form = await readBody(req)
      if (form.account !== reader) throw problem(400, '本地示例使用 ' + reader)
      if (path === '/api/verification-codes') return auth.sendCode(form)
      if (path === '/api/password/reset') { auth.recover(form); return {} }
      const user = path === '/api/accounts' ? auth.register(form) : auth.login(form)
      return issue(user)
    }

    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
    if (!token && method === 'GET' && path === '/api/session') return null
    if (!token || !(sessions.get(token) > Date.now())) throw problem(401, '书房会话已过期')
    if (method === 'GET' && path === '/api/session') return auth.getSession()
    if (method === 'DELETE' && path === '/api/session') { sessions.delete(token); return {} }
    if (method === 'PUT' && path === '/api/profile') {
      const { nickname } = await readBody(req)
      if (typeof nickname !== 'string' || !nickname.trim() || Array.from(nickname.trim()).length > 20) {
        throw problem(400, '昵称需为 1–20 个字符')
      }
      return auth.updateProfile({ nickname: nickname.trim() })
    }
    if (method === 'GET' && path === '/api/messages') {
      if (!url.searchParams.has('limit')) return notices.map(message)
      const limit = Number(url.searchParams.get('limit'))
      if (!Number.isSafeInteger(limit) || limit < 1) throw problem(400, '无效的分页数量')
      const cursor = url.searchParams.get('cursor')
      const start = cursor === null ? 0 : notices.findIndex(item => item.id === cursor) + 1
      if (cursor !== null && !start) throw problem(400, '无效的消息游标')
      const items = notices.slice(start, start + Math.min(limit, 2)).map(message)
      return { items, nextCursor: start + items.length < notices.length ? items.at(-1).id : null, ...count() }
    }
    if (method === 'GET' && path.startsWith('/api/messages/')) {
      const id = decodeURIComponent(path.slice('/api/messages/'.length))
      const row = notices.find(item => item.id === id)
      if (!row) throw problem(404, '未找到该通知')
      return message(row)
    }
    if (method === 'POST' && path === '/api/messages/read') {
      const { ids } = await readBody(req)
      if (!Array.isArray(ids)) throw problem(400, '请提供消息 ID 数组')
      for (const item of notices) if (ids.includes(item.id)) read.add(item.id)
      return count()
    }
    if (method === 'POST' && path === '/api/messages/read-all') {
      for (const item of notices) read.add(item.id)
      return count()
    }
    throw problem(404, '没有这个接口')
  }

  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    try {
      const origin = req.headers.origin
      if (origin) {
        if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) throw problem(403, '请通过本机地址打开示例')
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Vary', 'Origin')
      }
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.writeHead(204).end()
        return
      }
      const data = await dispatch(req, new URL(req.url, 'http://127.0.0.1'))
      res.end(JSON.stringify(data))
    } catch (error) {
      res.writeHead(error.status || 400).end(JSON.stringify({ message: error.message }))
    }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createReadingRoomServer().listen(4318, '127.0.0.1', () => console.log('青禾书房 API  http://127.0.0.1:4318/api'))
}
