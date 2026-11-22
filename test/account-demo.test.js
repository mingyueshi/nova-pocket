import assert from 'node:assert/strict'
import test from 'node:test'
import { createNavigation } from '../src/account-navigation.js'
import { iconSource } from '../src/icons.js'
import { orderDate, summarizeValues, trendLabels } from '../src/service-stats.js'

test('detail links encode record identifiers and use the default or originating tab', () => {
  const { detailTab, detailUrl, isDetail } = createNavigation({
    tabs: [['home'], ['services'], ['messages'], ['mine']], shortcuts: [],
    modules: { orders: { enabled: true }, reviews: { enabled: true } },
  }, true)
  assert.equal(detailUrl('order', 'NP-1042', 'services'), '/pages/account/detail?view=order&id=NP-1042')
  assert.equal(detailUrl('review', 'a&b', 'mine'), '/pages/account/detail?view=review&id=a%26b&tab=mine')
  assert.equal(detailTab('message', 'unknown'), 'messages')
  assert.equal(isDetail('order'), true)
  assert.equal(isDetail('profile'), false)
  assert.equal(isDetail('toString'), false)
})

test('a zero peak keeps its date and a safe scale, and an empty series has no peak', () => {
  assert.deepEqual(summarizeValues([0, 0, 0]), { total: 0, maximum: 0, scale: 1, peak: 0 })
  assert.deepEqual(summarizeValues([]), { total: 0, maximum: 0, scale: 1, peak: -1 })
  assert.deepEqual(summarizeValues([1, 5, 3]), { total: 9, maximum: 5, scale: 5, peak: 1 })
})

test('example dates roll across the calendar year', () => {
  const today = new Date(2026, 0, 2, 12)
  const { week, month } = trendLabels(today)
  assert.equal(week[0], '12/27')
  assert.equal(week[6], '01/02')
  assert.equal(month[0], '12/04–12/09')
  assert.equal(month[4], '12/28–01/02')
  assert.equal(orderDate(2, today), '12 月 31 日')
})

test('icons use an existing fallback for unknown names and tones', () => {
  assert.equal(iconSource('bell', 'light'), '/static/icons/bell-light.svg')
  assert.equal(iconSource('missing', 'toString'), '/static/icons/circle-help-muted.svg')
})

test('disabled modules, demo and message links follow the configured navigation', () => {
  const settings = {
    tabs: [['services', '业务'], ['mine', '账户']], shortcuts: [['messages'], ['profile'], ['review']],
    modules: { orders: { enabled: false }, reviews: { enabled: true, requiresLogin: true } },
  }
  const reviews = createNavigation(settings, false)
  assert.equal(reviews.firstTab, 'services')
  assert.equal(reviews.isDetail('order'), false)
  assert.equal(reviews.isDetail('review'), true)
  assert.equal(reviews.requiresLogin('review'), true)
  assert.deepEqual(reviews.shortcuts, [['profile'], ['review']])
  assert.equal(reviews.isDetail('demo'), false)
  assert.equal(reviews.isDetail('message'), false)

  settings.modules.reviews.enabled = false
  const minimal = createNavigation(settings, false)
  assert.deepEqual(minimal.tabs, [['mine', '账户']])
  assert.equal(minimal.detailTab('review', 'services'), 'mine')
  assert.equal(minimal.isDetail('review'), false)
})
