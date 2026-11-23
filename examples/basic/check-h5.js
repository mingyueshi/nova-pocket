import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { preview } from 'vite'
import { checkMessageReturn, checkMobile } from './check-mobile.js'
import config from './src/pocket.config.js'

const root = fileURLToPath(new URL('./', import.meta.url))
const site = await preview({
  root, configFile: false, build: { outDir: 'dist/build/h5' }, preview: { host: '127.0.0.1', port: 0 },
})
let browser, page
try {
  browser = await chromium.launch()
  page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const screen = page.locator('uni-page').last()
  const label = value => screen.getByText(value, { exact: true })
  const button = name => screen.getByRole('button', { name, exact: true })
  const tab = name => screen.getByRole('navigation').getByRole('button', { name, exact: true })

  const origin = 'http://127.0.0.1:' + site.httpServer.address().port
  await page.goto(origin)
  await label(config.brand.name).waitFor()
  await tab('消息，2 条未读通知').waitFor()
  assert.equal(await screen.getByRole('navigation').getByRole('button').count(), 3)
  await label('演示用户').waitFor()
  assert.doesNotMatch(await screen.innerText(), /快捷入口|个人资料|编辑资料|账户设置|账户管理/)
  assert.equal(await label('消息').count(), 1)
  await tab('我的').click()
  await label('编辑资料').waitFor()
  assert.equal(await label('编辑资料').count(), 1)
  assert.equal(await label('个人资料').count(), 0)
  assert.equal(await label('账户设置').count(), 1)
  await button('账户设置').click()
  await button('退出登录').click()
  await page.getByText('退出', { exact: true }).last().click()
  await label('你好，访客').waitFor()
  await label('登录').click()
  await label('填入演示资料').click()
  await screen.locator('.fields .primary').click()
  await label('演示用户').waitFor()

  await label('编辑资料').click()
  await screen.locator('[aria-label="展示昵称"] input').fill('晓山')
  await label('保存资料').click()
  await label('晓山').waitFor()
  await page.reload()
  await label('晓山').waitFor()

  await tab('消息，2 条未读通知').click()
  const welcome = '欢迎使用 ' + config.brand.name
  const notification = screen.getByRole('button').filter({ hasText: welcome })
  await notification.getByText('未读', { exact: true }).click()
  await page.waitForURL(/view=message/)
  await label(welcome).waitFor()
  await tab('消息，1 条未读通知').click()
  await notification.getByText('已读', { exact: true }).waitFor()
  await page.reload()
  await tab('消息，1 条未读通知').click()
  await notification.getByText('已读', { exact: true }).waitFor()
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  phone.setDefaultTimeout(8000)
  phone.on('pageerror', error => errors.push(error.message))
  await phone.goto(origin)
  await checkMessageReturn(phone, 'browser')
  await phone.close()
  assert.deepEqual(errors, [])
  await checkMobile(origin)
  console.log('H5 验收通过：品牌、本地登录、昵称保存和消息已读。')
} catch (error) {
  if (page) console.error(page.url(), await page.locator('body').innerText())
  throw error
} finally {
  await browser?.close()
  await site.close()
}
