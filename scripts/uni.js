// Prepare the native UniApp metadata and conditional compilation before the CLI reads them.
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import config from '../src/pocket.config.js'
import { configuredServicePages, serviceRoot, syncServicePackage } from '../src/service-pages.js'

const servicePages = configuredServicePages(config)
for (const path of servicePages.values()) {
  const file = 'src/' + serviceRoot + '/' + path + '.vue'
  if (!existsSync(file)) throw new Error('找不到自定义服务页面：' + file)
}
const { name, subtitle } = config.brand
const title = [name, subtitle].filter(Boolean).join(' · ')
function syncMetadata(path, update) {
  const json = JSON.parse(readFileSync(path, 'utf8'))
  const before = JSON.stringify(json)
  update(json)
  if (before === JSON.stringify(json)) return
  const temp = path + '.' + process.pid + '.tmp'
  writeFileSync(temp, JSON.stringify(json, null, 2) + '\n')
  renameSync(temp, path)
}

syncMetadata('src/manifest.json', manifest => {
  manifest.name = name
  manifest.h5.title = title
})
syncMetadata('src/pages.json', pages => {
  syncServicePackage(pages, servicePages, config.modules)
  for (const page of pages.pages) {
    if (['pages/index/index', 'pages/account/detail'].includes(page.path)) page.style.navigationBarTitleText = name
  }
})
process.env.VITE_POCKET_TITLE = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
process.env.VITE_POCKET_ICON = (config.brand.logo || '/static/icons/sparkles-blue.svg')
  .replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
const hasServices = config.tabs.some(([key]) => key === 'services')
const excluded = Object.fromEntries(['orders', 'reviews', 'stats'].map(key => [
  'POCKET_NO_' + key.toUpperCase(), !hasServices || !config.modules[key]?.enabled,
]))
excluded.POCKET_NO_RECORDS = excluded.POCKET_NO_ORDERS && excluded.POCKET_NO_REVIEWS
process.env.UNI_CUSTOM_CONTEXT = JSON.stringify(excluded)
await import('@dcloudio/vite-plugin-uni/bin/uni.js')
