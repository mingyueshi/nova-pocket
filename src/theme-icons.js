import { readFileSync } from 'node:fs'
import config from './pocket.config.js'
import { staticRoot } from './pocket-paths.js'
import { iconNames, iconSource, iconTones } from './icons.js'
import { configuredThemes } from './themes.js'

// Emit local SVGs for both targets. The H5 dev server serves the same bytes before a build.
export function themeIcons() {
  const assets = new Map()
  for (const { iconAccent } of configuredThemes(config).values()) {
    for (const name of iconNames) {
      const path = iconSource(name, iconAccent)
      if (!path.startsWith(staticRoot + '/pocket-accents/') || assets.has(path)) continue
      const source = readFileSync(new URL('./static/icons/' + name + '-blue.svg', import.meta.url), 'utf8')
      assets.set(path, source.replaceAll('="' + iconTones.blue + '"', '="' + iconAccent + '"'))
    }
  }
  return {
    name: 'pocket-theme-icons',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const svg = assets.get(request.url.split('?')[0])
        if (!svg) return next()
        response.setHeader('Content-Type', 'image/svg+xml')
        response.end(svg)
      })
    },
    generateBundle() {
      for (const [path, source] of assets) this.emitFile({ type: 'asset', fileName: path.slice(1), source })
    },
  }
}
