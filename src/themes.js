const presets = {
  blue: { label: '经典蓝', brand: '#1d4ed8', iconAccent: '#1d4ed8' },
  teal: { label: '松绿', brand: '#106552', iconAccent: '#106552' },
  dark: { label: '深色', brand: '#aec4ff', iconAccent: '#c9d5f2' },
}

const variables = {
  brand: '--brand', brandOn: '--brand-on', soft: '--soft', canvas: '--canvas',
  hero: '--hero', heroStart: '--hero-start',
}
const options = new Set(['base', 'label', 'heroStyle', 'iconAccent', ...Object.keys(variables)])
const hex = /^#[0-9a-f]{6}$/i

function invalid(field, reason) {
  throw new Error('pocket.config.js: ' + field + ' ' + reason)
}

export function configuredThemes(config) {
  const themes = new Map(Object.entries(presets).map(([base, preset]) => [base, { ...preset, base, style: {} }]))
  const custom = config.themes === undefined ? {} : config.themes
  if (!custom || typeof custom !== 'object' || Array.isArray(custom)) invalid('themes', '应为主题对象')
  for (const [key, item] of Object.entries(custom)) {
    const path = 'themes.' + key
    if (!/^[a-z][a-z0-9-]*$/.test(key) || themes.has(key)) invalid(path, '需要独立的小写主题名')
    if (!item || typeof item !== 'object' || Array.isArray(item)) invalid(path, '应为主题对象')
    if (typeof item.base !== 'string' || !Object.prototype.hasOwnProperty.call(presets, item.base)) invalid(path + '.base', '应为 blue、teal 或 dark')
    if (typeof item.label !== 'string' || !item.label.trim()) invalid(path + '.label', '需要主题显示名称')
    const style = {}
    for (const [name, value] of Object.entries(item)) {
      if (!options.has(name)) invalid(path + '.' + name, '不是已支持的主题字段')
      if (name === 'iconAccent' || Object.prototype.hasOwnProperty.call(variables, name)) {
        if (typeof value !== 'string' || !hex.test(value)) invalid(path + '.' + name, '应为 #RRGGBB 颜色')
        if (name !== 'iconAccent') style[variables[name]] = value
      }
    }
    if (item.heroStyle !== undefined && !['solid', 'gradient'].includes(item.heroStyle)) {
      invalid(path + '.heroStyle', '应为 solid 或 gradient')
    }
    const base = presets[item.base]
    themes.set(key, {
      base: item.base, label: item.label, brand: item.brand ?? base.brand, style,
      iconAccent: item.iconAccent ?? item.brand ?? base.iconAccent, heroStyle: item.heroStyle,
    })
  }
  if (!themes.has(config.defaultTheme)) invalid('defaultTheme', '找不到主题 ' + String(config.defaultTheme) + '，可用值为 ' + [...themes.keys()].join('、'))
  return themes
}
