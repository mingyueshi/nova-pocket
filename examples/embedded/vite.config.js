import { defineConfig } from 'vite'
import uniPlugin from '@dcloudio/vite-plugin-uni'
import { pocketPlugin } from './src/uni_modules/nova-pocket/vite.js'
import pages from './src/pages.json'

const uni = typeof uniPlugin === 'function' ? uniPlugin : uniPlugin.default
export default defineConfig({
  plugins: [uni(), pocketPlugin(pages)],
  server: { host: '127.0.0.1', cors: false, fs: { strict: true } },
})
