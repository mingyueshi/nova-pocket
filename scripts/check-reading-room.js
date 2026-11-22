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
  async function login(form) {
    await form.locator('[aria-label="邮箱"] input').fill('reader@example.test')
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
  await recipient.getByText('返回列表').click()
  await recipient.getByRole('button', { name: /城市里的树/ }).waitFor()
  await recipient.getByText('返回服务页').click()
  await recipient.getByRole('button', { name: /我的借阅/ }).waitFor()
  await page.goto(origin + '/#/pages/account/detail?view=loans&id=missing')
  await recipient.getByText('借阅记录不存在').waitFor()
  assert.deepEqual(errors, [])
  console.log('H5 验收通过：品牌、服务入口、借阅分享与登录回跳、模块关闭、消息分页和会话恢复。')
} catch (error) {
  if (page) console.error(page.url(), await page.locator('body').innerText())
  throw error
} finally {
  await browser?.close()
  await site?.close()
  await api[Symbol.asyncDispose]()
}
