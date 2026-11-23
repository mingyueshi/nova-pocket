export function validatePageLinks(config, pages, detailPath) {
  const pagePaths = new Set(pages.pages.map(page => '/' + page.path))
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
  if (config.host && (!tabPaths.has(config.host.accountTab) || !pagePaths.has(config.host.loginPage) ||
      tabPaths.has(config.host.loginPage) || config.tabs.length !== 1 || config.tabs[0][0] !== 'mine')) {
    throw new Error('宿主需注册 accountTab 原生底栏与 loginPage 普通页面，账户入口须为 mine')
  }
}
