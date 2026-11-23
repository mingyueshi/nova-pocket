import { themeIcons } from './scripts/theme-icons.js'
import { defineConfig } from 'vite'
import uniPlugin from '@dcloudio/vite-plugin-uni'
const uni = typeof uniPlugin === 'function' ? uniPlugin : uniPlugin.default
export default defineConfig({
  plugins: [uni(), themeIcons()],
  server: { host: '127.0.0.1', cors: false, fs: { strict: true } },
})
