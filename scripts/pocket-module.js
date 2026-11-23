import { cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

// Assemble both the downloadable module and the embedded template from the same sources.
export async function writePocketModule(output) {
  await mkdir(output, { recursive: true })
  for (const path of [
    'account-blocks.js', 'account-data.js', 'account-navigation.js', 'account.css',
    'form-viewport.js', 'icons.js', 'inbox.js', 'pages/account', 'pocket-types.d.ts',
    'service-pages.js', 'state.js', 'static/icons', 'theme-icons.js', 'themes.js',
    'validate-page-links.js', 'use-header-padding.js', 'use-leave-confirmation.js',
    ...['AccountIdentity', 'AccountScreen', 'MessagePanel', 'NovaIcon', 'NovaRow', 'StatePanel']
      .map(name => 'components/' + name + '.vue'),
  ]) {
    await cp(join(root, 'src', path), join(output, path), { recursive: true })
  }
  await cp(join(root, 'LICENSE'), join(output, 'LICENSE'))
  await cp(join(root, 'module'), output, { recursive: true })
}
