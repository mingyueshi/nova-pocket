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

export async function checkMessageReturn(page, back) {
  const screen = page.locator('uni-page').last()
  const nav = name => screen.getByRole('navigation').getByRole('button', { name, exact: true })
  const rows = screen.locator('.message-rows').getByRole('button')
  const more = screen.getByRole('button', { name: '加载更多', exact: true })
  await tap(page, nav('消息，2 条未读通知'))
  for (const total of [16, 32, 48]) {
    if (total > 16) await tap(page, more)
    await rows.nth(total - 1).waitFor()
    assert.equal(await rows.count(), total)
  }
  assert.equal(await more.count(), 0)
  const row = rows.filter({ hasText: '账号安全检查' })
  await row.getByText('未读', { exact: true }).waitFor()
  await row.evaluate(el => el.scrollIntoView({ block: 'center' }))
  const position = () => row.evaluate(el => {
    const list = el.closest('.uni-scroll-view')
    return { scroll: list.scrollTop, height: list.clientHeight, y: el.getBoundingClientRect().top }
  })
  const before = await position()
  assert.ok(before.scroll >= 2 * before.height, '目标行应在至少两个可视区域之后')
  await tap(page, row)
  await page.waitForURL(/view=message&id=security/)
  await screen.getByText('账号安全检查', { exact: true }).waitFor()
  await nav('消息，1 条未读通知').waitFor()
  if (back === 'browser') await page.goBack()
  else await tap(page, screen.locator('[aria-label="返回上一页"]'))
  await row.getByText('已读', { exact: true }).waitFor()
  const after = await position() // Read before performing any scroll or tap on the list.
  assert.ok(Math.abs(after.scroll - before.scroll) <= 2, '返回后列表滚动位置变化超过 2px')
  assert.ok(Math.abs(after.y - before.y) <= 2, '返回后原行在屏幕上的位置变化超过 2px')
  assert.equal(await rows.count(), 48, '返回后应保留三页消息')
  await rows.last().getByText('账户中心使用指南', { exact: true }).waitFor()
  await nav('消息，1 条未读通知').waitFor()
  console.log(page.viewportSize().width + 'px 消息返回通过 (' + back + ')：scrollTop ' +
    before.scroll + ' → ' + after.scroll + '，行顶 ' + before.y + ' → ' + after.y + '，可视区高 ' + before.height)
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
    const draft = nickname.slice(0, -1)
    await input.fill(draft)
    await input.evaluate(el => el.scrollIntoView({ block: 'center' }))
    const fieldOffset = () => input.evaluate(el => el.closest('.uni-scroll-view').scrollTop)
    const draftOffset = await fieldOffset()
    assert.ok(draftOffset > 0, '键盘占位时表单应处在非零滚动位置')
    await page.goBack()
    const dialog = page.locator('uni-modal')
    await dialog.getByText('放弃未保存的资料？', { exact: true }).waitFor()
    await tap(page, dialog.getByText('取消', { exact: true }))
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(await input.inputValue(), draft, '取消离开应保留未保存的昵称')
    assert.ok(Math.abs(await fieldOffset() - draftOffset) <= 2, '取消离开应保留资料表单位置')
    await reduceViewport(input)
    await input.evaluate(el => el.setSelectionRange(el.value.length, el.value.length))
    const ime = await page.context().newCDPSession(page)
    try {
      await ime.send('Input.imeSetComposition', { text: 'zhou', selectionStart: 4, selectionEnd: 4 })
      assert.equal(await input.inputValue(), draft + 'zhou', '应能在原草稿末尾继续组合输入')
      await ime.send('Input.insertText', { text: '舟' })
      assert.equal(await input.inputValue(), nickname, '确认候选字应替换拼音并保留整段昵称')
    } finally {
      await ime.detach()
    }
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

    await checkMessageReturn(page, 'page')

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
    console.log('320px 触屏验收通过。24px 最小字号，20 字符昵称，缩短视口后保存和登录，取消返回保留草稿并继续组合输入，消息详情返回保留已读、分页和滚动位置。')
  } finally {
    await browser.close()
  }
}
