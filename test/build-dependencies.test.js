import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import { Buffer } from 'node:buffer'

// Resolve from each consumer so these checks cover the version UniApp actually loads.
const require = createRequire(import.meta.url)
const compiler = createRequire(require.resolve('@dcloudio/uni-cli-shared/package.json'))
const weixin = createRequire(require.resolve('@dcloudio/uni-mp-weixin/package.json'))

test('the module packer can write and reopen a ZIP with the selected adm-zip version', () => {
  const AdmZip = compiler('adm-zip')
  const archive = new AdmZip()
  archive.addFile('module/README.md', Buffer.from('示例模块'))
  assert.equal(new AdmZip(archive.toBuffer()).readAsText('module/README.md'), '示例模块')
})

test('the WeChat compiler can read a JPEG buffer through its own Jimp dependency', async () => {
  const Jimp = weixin('jimp')
  const encoded = await new Jimp(2, 3, 0x336699ff).getBufferAsync(Jimp.MIME_JPEG)
  const { bitmap } = await Jimp.read(encoded)
  assert.deepEqual([bitmap.width, bitmap.height, bitmap.data.length], [2, 3, 24])
})

test('the bundled i18n runtime can resolve a precompiled message with named values', () => {
  const { createCoreContext, translate } = compiler('@intlify/core-base')
  const ctx = createCoreContext({ locale: 'zh', messages: { zh: { greeting: ctx => '你好，' + ctx.named('name') } } })
  assert.equal(translate(ctx, 'greeting', { name: '林溪' }), '你好，林溪')
})
