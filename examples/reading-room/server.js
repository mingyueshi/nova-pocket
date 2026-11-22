import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { createDemoAdapters } from '../../src/adapters/demo.js'

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

function createReader(id, nickname, loans, inbox) {
  const { auth } = createDemoAdapters()
  auth.updateProfile({ nickname })
  return { id, auth, loans, inbox, read: new Set(['hours']) }
}

export function createReadingRoomServer() {
  const readers = new Map([
    ['reader@example.test', createReader('demo', '青禾', [
      { id: '借阅/山川+02', title: '山川笔记', status: '借阅中', borrowed: '2026-11-10', due: '2026-12-10' },
      { id: 'BR-1038', title: '城市里的树', status: '已归还', borrowed: '2026-10-05', returned: '2026-10-26' },
    ], notices)],
    ['lin@example.test', createReader('reader-lin', '小林', [
      { id: 'BR-2051', title: '河岸手记', status: '借阅中', borrowed: '2026-11-15', due: '2026-12-15' },
    ], notices.slice(0, 2))],
  ])
  const sessions = new Map()

  function issue(reader, user) {
    for (const [token, session] of sessions) if (session.expires <= Date.now()) sessions.delete(token)
    const token = randomUUID()
    sessions.set(token, { reader, expires: Date.now() + 30 * 60 * 1000 })
    return { user: { ...user, id: reader.id }, token }
  }

  async function dispatch(req, url) {
    const path = url.pathname
    const method = req.method
    if (method === 'POST' && ['/api/session', '/api/accounts', '/api/verification-codes', '/api/password/reset'].includes(path)) {
      const form = await readBody(req)
      const reader = readers.get(form.account)
      if (!reader) throw problem(400, '本地示例使用 ' + [...readers.keys()].join(' 或 '))
      const { auth } = reader
      if (path === '/api/verification-codes') return auth.sendCode(form)
      if (path === '/api/password/reset') { auth.recover(form); return {} }
      const user = path === '/api/accounts' ? auth.register(form) : auth.login(form)
      return issue(reader, user)
    }

    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
    if (!token && method === 'GET' && path === '/api/session') return null
    const session = sessions.get(token)
    if (!session || session.expires <= Date.now()) throw problem(401, '书房会话已过期')
    const { id, auth, loans, inbox, read } = session.reader
    if (method === 'GET' && path === '/api/session') return { ...auth.getSession(), id }
    if (method === 'DELETE' && path === '/api/session') { sessions.delete(token); return {} }
    if (method === 'PUT' && path === '/api/profile') {
      const { nickname } = await readBody(req)
      if (typeof nickname !== 'string' || !nickname.trim() || Array.from(nickname.trim()).length > 20) {
        throw problem(400, '昵称需为 1–20 个字符')
      }
      return { ...auth.updateProfile({ nickname: nickname.trim() }), id }
    }
    if (method === 'GET' && path === '/api/loans') return loans
    if (method === 'GET' && path.startsWith('/api/loans/')) {
      const loanId = decodeURIComponent(path.slice('/api/loans/'.length))
      const loan = loans.find(item => item.id === loanId)
      if (!loan) throw problem(404, '借阅记录不可用')
      return loan
    }
    function message(row) { return { ...row, read: read.has(row.id) } }
    function count() { return { unreadCount: inbox.length - read.size } }
    if (method === 'GET' && path === '/api/messages') {
      if (!url.searchParams.has('limit')) return inbox.map(message)
      const limit = Number(url.searchParams.get('limit'))
      if (!Number.isSafeInteger(limit) || limit < 1) throw problem(400, '无效的分页数量')
      const cursor = url.searchParams.get('cursor')
      const start = cursor === null ? 0 : inbox.findIndex(item => item.id === cursor) + 1
      if (cursor !== null && !start) throw problem(400, '无效的消息游标')
      const items = inbox.slice(start, start + Math.min(limit, 2)).map(message)
      return { items, nextCursor: start + items.length < inbox.length ? items.at(-1).id : null, ...count() }
    }
    if (method === 'GET' && path.startsWith('/api/messages/')) {
      const id = decodeURIComponent(path.slice('/api/messages/'.length))
      const row = inbox.find(item => item.id === id)
      if (!row) throw problem(404, '未找到该通知')
      return message(row)
    }
    if (method === 'POST' && path === '/api/messages/read') {
      const { ids } = await readBody(req)
      if (!Array.isArray(ids)) throw problem(400, '请提供消息 ID 数组')
      for (const item of inbox) if (ids.includes(item.id)) read.add(item.id)
      return count()
    }
    if (method === 'POST' && path === '/api/messages/read-all') {
      for (const item of inbox) read.add(item.id)
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
