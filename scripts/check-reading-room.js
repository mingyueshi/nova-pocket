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
  await screen.locator('[aria-label="邮箱"] input').fill('reader@example.test')
  await screen.locator('[aria-label="密码"] input').fill('ReadingDemo2026')
  await screen.locator('.fields .primary').click()
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
  await page.goto(origin + detail)
  await page.reload()
  await label('去登录').waitFor()
  assert.deepEqual(errors, [])
  console.log('H5 验收通过：换品牌、模块关闭、旧链接、登录回跳、分页、已读、会话恢复及退出。')
} catch (error) {
  if (page) console.error(page.url(), await page.locator('body').innerText())
  throw error
} finally {
  await browser?.close()
  await site?.close()
  await api[Symbol.asyncDispose]()
}
