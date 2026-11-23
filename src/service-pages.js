// This subpackage belongs to the configured service pages. Other packages are left to the app.
export const serviceRoot = 'pocket-services'
const reserved = new Set(['home', 'services', 'messages', 'mine', 'profile', 'security', 'settings',
  'activity', 'notifications', 'privacy', 'help', 'demo', 'message', 'orders', 'order', 'reviews', 'review', 'stats',
  'login', 'register', 'recover'])

export function configuredServicePages(settings) {
  const pages = new Map()
  const paths = new Set()
  if (!settings.tabs.some(([key]) => key === 'services')) return pages
  for (const [key, module] of Object.entries(settings.modules)) {
    if (!module.enabled || module.page === undefined) continue
    if (!/^[a-z][a-z0-9_-]*$/i.test(key) || reserved.has(key) || key in Object.prototype) {
      throw new Error('自定义服务键无效或与内置视图重复：' + key)
    }
    if (typeof module.page !== 'string' || !/^[\w-]+(?:\/[\w-]+)*$/.test(module.page) || paths.has(module.page)) {
      throw new Error('自定义服务页面路径无效或重复：' + key)
    }
    paths.add(module.page)
    pages.set(key, module.page)
  }
  return pages
}

export function syncServicePackage(manifest, pages, modules) {
  const packages = (manifest.subPackages || []).filter(group => group.root !== serviceRoot)
  if (pages.size) packages.push({
    root: serviceRoot,
    pages: Array.from(pages, ([key, path]) => ({
      path, style: { navigationBarTitleText: modules[key].label, navigationStyle: 'default' },
    })),
  })
  if (packages.length) manifest.subPackages = packages
  else delete manifest.subPackages
}
