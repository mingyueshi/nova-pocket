export function validatePageLinks(config, pages, detailPath) {
  const mainPages = new Set(pages.pages.map(page => '/' + page.path))
  const pagePaths = new Set(mainPages)
  for (const group of pages.subPackages || pages.subpackages || []) {
    for (const page of group.pages) pagePaths.add('/' + group.root + '/' + page.path)
  }
  const tabPaths = new Set((pages.tabBar?.list || []).map(tab => '/' + tab.pagePath))
  for (const [key, path] of Object.entries(config.accountPages || {})) {
    if (!['security', 'activity', 'notifications', 'privacy', 'help'].includes(key) ||
        !pagePaths.has(path) || tabPaths.has(path) || path === detailPath) {
      throw new Error('accountPages.' + key + ' 需指向已注册的宿主普通页面：' + path)
    }
  }
  if (!config.host) return
  const { accountTab, loginPage } = config.host
  if (!mainPages.has(accountTab) || !tabPaths.has(accountTab)) {
    throw new Error(`pocket.config.js 的 host.accountTab = ${JSON.stringify(accountTab)}。请填写「我的」原生底栏路径，以 / 开头，并在 pages.json 的 pages 和 tabBar.list 中注册该页。`)
  }
  if (!pagePaths.has(loginPage)) {
    throw new Error(`pocket.config.js 的 host.loginPage = ${JSON.stringify(loginPage)}。请填写已在 pages.json 注册的普通登录页路径，以 / 开头，分包页面需包含分包根路径。`)
  }
  if (tabPaths.has(loginPage)) {
    throw new Error(`pocket.config.js 的 host.loginPage = ${JSON.stringify(loginPage)} 指向 pages.json 的 tabBar.list 底栏页。请改填能接收登录回跳参数的普通登录页路径。`)
  }
  if (!Array.isArray(config.tabs) || config.tabs.length !== 1 || !Array.isArray(config.tabs[0]) || config.tabs[0][0] !== 'mine') {
    throw new Error(`pocket.config.js 的 tabs = ${JSON.stringify(config.tabs)}。嵌入模式只需一个 mine 入口，例如 [["mine","我的","user-round"]]。宿主底栏在 pages.json 的 tabBar.list 中配置。`)
  }
}
