import config from './pocket.config.js'
import { validateLayoutConfig } from './account-blocks.js'
import { themeIcons } from './theme-icons.js'
import { accountPageRoot } from './pocket-paths.js'
import { validatePageLinks } from './validate-page-links.js'

export function pocketPlugin(pages) {
  if (!config.host) throw new Error('模块需配置 host.accountTab 和 host.loginPage')
  const detailPath = accountPageRoot + '/detail'
  validatePageLinks(config, pages, detailPath)
  if (!pages.pages.some(page => '/' + page.path === detailPath)) throw new Error('请在 pages.json 注册 ' + detailPath)
  validateLayoutConfig(config)
  return themeIcons()
}
