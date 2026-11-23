import assert from 'node:assert/strict'
import test from 'node:test'
import { installFormViewport } from '../src/form-viewport.js'

test('resize installation is idempotent, and disposal stops queued and future callbacks', () => {
  const viewport = new globalThis.EventTarget()
  viewport.height = 800
  viewport.scale = 1
  const frames = []
  const scrolled = []
  const field = {
    matches: () => true,
    getBoundingClientRect: () => ({ top: 650, bottom: 700 }),
    scrollIntoView: options => scrolled.push(options),
  }
  const browser = {
    visualViewport: viewport,
    document: { activeElement: field },
    requestAnimationFrame: callback => frames.push(callback),
  }
  const resize = height => {
    viewport.height = height
    viewport.dispatchEvent(new globalThis.Event('resize'))
  }

  const dispose = installFormViewport(browser)
  assert.strictEqual(installFormViewport(browser), dispose)
  resize(500)
  assert.equal(frames.length, 1)
  frames.shift()()
  assert.deepEqual(scrolled, [{ block: 'center', inline: 'nearest' }])
  resize(450)
  assert.equal(frames.length, 1)
  dispose()
  frames.shift()()
  resize(400)
  assert.equal(frames.length, 0)
  assert.equal(scrolled.length, 1)

  const nextDispose = installFormViewport(browser)
  assert.notStrictEqual(nextDispose, dispose)
  dispose()
  resize(350)
  assert.equal(frames.length, 1)
  nextDispose()
})
