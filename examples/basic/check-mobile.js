import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const viewport = { width: 320, height: 568 }
const keyboardViewport = { width: 320, height: 308 }
const nickname = '青禾' + 'W'.repeat(17) + '舟'

// Scroll like a reader, then tap through the touchscreen at a point verified to be unobstructed.
async function tap(page, control) {
  await control.scrollIntoViewIfNeeded()
  await control.tap({ trial: true })
  const point = await control.evaluate(el => {
    const rect = el.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const visible = window.visualViewport
    if (x < visible.offsetLeft || x >= visible.offsetLeft + visible.width ||
        y < visible.offsetTop || y >= visible.offsetTop + visible.height ||
        !el.contains(window.document.elementFromPoint(x, y))) return null
    return { x, y }
  })
  assert.ok(point, '主操作中心被遮挡或位于可视区域外：' + await control.textContent())
  await page.touchscreen.tap(point.x, point.y)
}

export async function checkMobile(origin) {
  const browser = await chromium.launch({ args: ['--blink-settings=minimumFontSize=24'] })
  try {
    const page = await browser.newPage({ viewport, locale: 'zh-CN', isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
    page.setDefaultTimeout(8000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const screen = page.locator('uni-page').last()
    const button = name => screen.getByRole('button', { name, exact: true })
    const nav = name => screen.getByRole('navigation').getByRole('button', { name, exact: true })
    const text = label => screen.getByText(label, { exact: true })
    const input = screen.locator('[aria-label="展示昵称"] input')

    async function reduceViewport(field) {
      await tap(page, field)
      await page.setViewportSize(keyboardViewport)
      assert.ok(await field.evaluate(el => el === window.document.activeElement), '缩小视口时输入框应保持焦点')
      await page.waitForFunction(height => {
        const viewport = window.visualViewport
        const active = window.document.activeElement
        if (!active?.matches('input')) return false
        const field = active.getBoundingClientRect()
        return viewport.height === height && field.top >= viewport.offsetTop &&
          field.bottom <= viewport.offsetTop + height
      }, keyboardViewport.height, { timeout: 2500 })
    }

    await page.goto(origin)
    await nav('消息，2 条未读通知').waitFor()
    assert.equal(await page.evaluate(() => window.visualViewport.width), viewport.width)
    assert.ok(await nav('我的').evaluate(el => parseFloat(window.getComputedStyle(el).fontSize) >= 24))
    assert.ok(await screen.locator('.unread-badge').evaluate(el => {
      const range = window.document.createRange()
      range.selectNodeContents(el)
      const digits = range.getBoundingClientRect()
      const badge = el.getBoundingClientRect()
      const tab = el.closest('[role="button"]').getBoundingClientRect()
      return digits.top >= badge.top && digits.bottom <= badge.bottom + 1 &&
        badge.top >= tab.top && badge.bottom <= tab.bottom
    }), '放大字号后，未读角标和数字应完整可见')
    await tap(page, nav('我的'))
    await tap(page, button('编辑资料'))
    await reduceViewport(input)
    await input.fill(nickname)
    await input.evaluate(el => el.scrollIntoView({ block: 'center' }))
    const fieldOffset = () => input.evaluate(el => el.closest('.uni-scroll-view').scrollTop)
    const draftOffset = await fieldOffset()
    assert.ok(draftOffset > 0, '键盘占位时表单应处在非零滚动位置')
    await page.goBack()
    const dialog = page.locator('uni-modal')
    await dialog.getByText('放弃未保存的资料？', { exact: true }).waitFor()
    await tap(page, dialog.getByText('取消', { exact: true }))
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(await input.inputValue(), nickname, '取消离开应保留未保存的昵称')
    assert.ok(Math.abs(await fieldOffset() - draftOffset) <= 2, '取消离开应保留资料表单位置')
    await reduceViewport(input)
    await tap(page, button('保存资料'))
    await text(nickname).waitFor()
    await screen.getByRole('heading', { name: '我的' }).waitFor()
    await page.setViewportSize(viewport)
    // The 20-character name contains a long unbroken Latin run. Every wrapped line must fit.
    assert.ok(await text(nickname).evaluate(el => {
      const range = window.document.createRange()
      range.selectNodeContents(el)
      const card = el.closest('.hero').getBoundingClientRect()
      const lines = [...range.getClientRects()]
      return lines.length > 1 && lines.every(line => line.left >= card.left && line.right <= card.right + 1 &&
        line.top >= card.top && line.bottom <= card.bottom + 1)
    }), '身份卡应能完整显示换行后的昵称')
    assert.equal(await page.evaluate(() => window.document.documentElement.scrollWidth), viewport.width)
    await page.reload()
    await text(nickname).waitFor()

    await tap(page, nav('消息，2 条未读通知'))
    await tap(page, button('加载更多'))
    const row = screen.getByRole('button').filter({ hasText: '账号安全检查' })
    const last = text('账户中心使用指南')
    await last.waitFor()
    await row.evaluate(el => el.scrollIntoView({ block: 'center' }))
    const offset = () => row.evaluate(el => el.closest('.uni-scroll-view').scrollTop)
    const before = await offset()
    assert.ok(before > 20, '消息列表必须已经滚动，才能验证返回位置')
    const rowY = (await row.boundingBox()).y
    await tap(page, row)
    await page.waitForURL(/view=message/)
    await nav('消息，1 条未读通知').waitFor()
    await tap(page, screen.locator('[aria-label="返回上一页"]'))
    await row.getByText('已读', { exact: true }).waitFor()
    await last.waitFor()
    assert.ok(Math.abs(await offset() - before) <= 2, '从详情返回后应保留列表滚动位置')
    assert.ok(Math.abs((await row.boundingBox()).y - rowY) <= 2, '返回后应看到同一行')
    await nav('消息，1 条未读通知').waitFor()

    await tap(page, nav('我的'))
    await tap(page, button('账户设置'))
    await tap(page, button('退出登录'))
    await tap(page, dialog.getByText('退出', { exact: true }))
    await tap(page, button('登录'))
    await screen.locator('[aria-label="邮箱"] input').fill('demo@example.test')
    const password = screen.locator('[aria-label="密码"] input')
    await reduceViewport(password)
    await password.fill('NovaDemo2026')
    await tap(page, screen.locator('.fields .primary'))
    await text(nickname).waitFor()
    await page.setViewportSize(viewport)
    await button('编辑资料').waitFor()
    assert.deepEqual(errors, [])
    console.log('320px 触屏验收通过。24px 最小字号，20 字符昵称，缩短视口后保存和登录，取消返回保留草稿，消息详情返回保留已读、分页和滚动位置。')
  } finally {
    await browser.close()
  }
}
