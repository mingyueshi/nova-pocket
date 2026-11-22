import assert from 'node:assert/strict'
import { once } from 'node:events'
import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { preview } from 'vite'
import { createReadingRoomServer } from '../examples/reading-room/server.js'

const root = fileURLToPath(new URL('../.build/reading-room/', import.meta.url))
await access(root + 'dist/build/h5/index.html')
const api = createReadingRoomServer()
let site, browser, page
try {
  api.listen(0, '127.0.0.1')
  await once(api, 'listening')
  site = await preview({
    configFile: false, root, build: { outDir: 'dist/build/h5' },
    preview: { host: '127.0.0.1', port: 0, proxy: { '/api': 'http://127.0.0.1:' + api.address().port } },
  })
  const origin = 'http://127.0.0.1:' + site.httpServer.address().port
  browser = await chromium.launch()
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const screen = page.locator('uni-page').last()
  const label = value => screen.getByText(value, { exact: true })
  const tab = name => screen.getByRole('navigation').getByRole('button', { name, exact: true })
  async function login(form, email = 'reader@example.test') {
    await form.locator('[aria-label="邮箱"] input').fill(email)
    await form.locator('[aria-label="密码"] input').fill('ReadingDemo2026')
    await form.locator('.fields .primary').click()
  }

  await page.goto(origin)
  await label('青禾书房').waitFor()
  assert.deepEqual(await screen.getByRole('navigation').getByRole('button').allTextContents(), ['首页', '书房通知', '服务', '我的'])
  await tab('服务').click()
  await screen.getByRole('button', { name: /使用统计/ }).waitFor()
  assert.equal(await screen.getByRole('button', { name: /我的订单|我的评价/ }).count(), 0)
  for (const view of ['order', 'review']) {
    await page.goto(origin + '/#/pages/account/detail?view=' + view + '&id=NP-1042')
    await label('页面不可用').waitFor()
    await label('返回账户中心').click()
    await label('青禾书房').waitFor()
  }

  const detail = '/#/pages/account/detail?view=message&id=' + encodeURIComponent('借阅/提醒')
  await page.goto(origin + detail)
  await label('去登录').click()
  await page.reload()
  await login(screen)
  await label('借阅到期提醒').waitFor()
  await tab('书房通知，1 条未读通知').click()
  await label('加载更多').click()
  await screen.getByRole('button', { name: /借阅到期提醒.*已读/ }).waitFor()
  await label('全部标为已读').click()
  await label('所有通知已读').waitFor()

  await page.goto(origin + detail)
  await page.reload()
  await label('借阅到期提醒').waitFor()
  await tab('书房通知').click()
  await label('所有通知已读').waitFor()
  await page.goto(origin + '/#/pages/account/detail?view=settings')
  await screen.getByRole('button', { name: '退出登录' }).click()
  await page.getByText('退出', { exact: true }).last().click()
  await label('你好，访客').waitFor()
  await page.goto(origin + detail)
  await page.reload()
  await label('去登录').waitFor()

  await tab('服务').click()
  await screen.getByRole('button', { name: /我的借阅/ }).click()
  await label('登录后可查看这项服务').waitFor()
  await label('去登录').click()
  await login(screen)
  await screen.getByRole('button', { name: /城市里的树/ }).click()
  await label('归还日期　2026-10-26').waitFor()
  await label('返回列表').click()
  await screen.getByRole('button', { name: /山川笔记/ }).click()
  await label('应还日期　2026-12-10').waitFor()
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin })
  await label('复制详情链接').click()
  const expected = origin + '/#/pages/account/detail?view=loans&id=' + encodeURIComponent('借阅/山川+02')
  await page.waitForFunction(async url => (await window.navigator.clipboard.readText()) === url, expected)
  const link = await page.evaluate(() => window.navigator.clipboard.readText())

  // Open the actual copied link in a separate browser session, with no reader credentials.
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.setDefaultTimeout(10000)
  page.on('pageerror', error => errors.push(error.message))
  const recipient = page.locator('uni-page').last()
  await page.goto(link)
  await recipient.getByText('登录后可查看这项服务').waitFor()
  assert.equal(await recipient.getByText('山川笔记').count(), 0)
  await recipient.getByText('去登录').click()
  await page.reload()
  await login(recipient)
  await recipient.getByText('山川笔记', { exact: true }).waitFor()
  await recipient.getByText('应还日期　2026-12-10').waitFor()
  await recipient.getByText('返回列表', { exact: true }).click()
  await recipient.getByRole('button', { name: /城市里的树/ }).waitFor()
  await recipient.getByText('返回服务页').click()
  await recipient.getByRole('button', { name: /我的借阅/ }).waitFor()
  await page.goto(origin + '/#/pages/account/detail?view=loans&id=missing')
  await recipient.getByText('借阅记录不可用').waitFor()

  // Hold a real successful response for the first reader until the second reader signs in.
  const held = Promise.withResolvers()
  await page.route('**/api/loans/*', route => held.resolve(route), { times: 1 })
  await page.goto(link)
  await recipient.getByText('正在加载借阅记录…').waitFor()
  const oldRequest = await held.promise
  const oldResponse = await oldRequest.fetch()
  assert.equal(oldResponse.status(), 200)
  assert.equal((await oldResponse.json()).title, '山川笔记')

  await recipient.getByText('返回列表', { exact: true }).click()
  await recipient.getByText('返回服务页', { exact: true }).click()
  await recipient.getByRole('navigation').getByRole('button', { name: '我的', exact: true }).click()
  await recipient.getByRole('button', { name: '账户设置', exact: true }).click()
  await recipient.getByRole('button', { name: '退出登录' }).click()
  await page.getByText('退出', { exact: true }).last().click()
  await recipient.getByText('你好，访客').waitFor()
  await page.goto(link)
  await recipient.getByText('去登录').click()
  const foreignResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/api/loans/' + encodeURIComponent('借阅/山川+02'))
  await login(recipient, 'lin@example.test')
  assert.equal((await foreignResponse).status(), 404)
  await recipient.getByText('借阅记录不可用').waitFor()
  await oldRequest.fulfill({ response: oldResponse })
  await oldResponse.dispose()
  assert.equal(await recipient.getByText('山川笔记').count(), 0)
  assert.equal(await recipient.getByText('复制详情链接').count(), 0)
  await recipient.getByText('返回列表', { exact: true }).click()
  const ownBook = recipient.getByRole('button', { name: /河岸手记/ })
  await ownBook.waitFor()
  assert.equal(await recipient.getByRole('button', { name: /山川笔记|城市里的树/ }).count(), 0)
  await page.route('**/api/loans/BR-2051', route => route.abort(), { times: 1 })
  await ownBook.click()
  await recipient.getByText('借阅加载失败').waitFor()
  await recipient.getByText('重试', { exact: true }).click()
  await recipient.getByText('应还日期　2026-12-15').waitFor()

  // Expire the detail request, then sign in as its owner from the retained target.
  await page.route('**/api/loans/BR-2051', route => route.fulfill({ status: 401, json: { message: '书房会话已过期' } }), { times: 1 })
  await page.reload()
  await recipient.getByText('重新登录').click()
  await login(recipient, 'lin@example.test')
  await recipient.getByText('河岸手记', { exact: true }).waitFor()
  await page.route('**/api/loans', route => route.fulfill({ json: [] }), { times: 1 })
  await recipient.getByText('返回列表', { exact: true }).click()
  await recipient.getByText('暂无借阅记录').waitFor()

  // A literal percent escape in a public ID must survive a cold start unchanged.
  const escapedId = '书架/%2F &+?'
  const escapedPath = '/api/loans/' + encodeURIComponent(escapedId)
  await page.goto('about:blank')
  const [coldDetail] = await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname.startsWith('/api/loans/')),
    page.goto(origin + '/#/pages/account/detail?view=loans&id=' + encodeURIComponent(escapedId)),
  ])
  assert.equal(new URL(coldDetail.url()).pathname, escapedPath)
  await recipient.getByText('借阅记录不可用').waitFor()
  assert.deepEqual(errors, [])
  console.log('H5 验收通过：品牌、模块、消息、双读者借阅分享、换号隔离、空列表、失败重试和过期登录回跳。')
} catch (error) {
  if (page) console.error(page.url(), await page.locator('body').innerText())
  throw error
} finally {
  await browser?.close()
  await site?.close()
  await api[Symbol.asyncDispose]()
}
