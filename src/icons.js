export const iconNames = [
  'bell', 'chart-no-axes-combined', 'chevron-left', 'chevron-right', 'circle-alert',
  'circle-help', 'clock-3', 'eye', 'eye-off', 'key-round', 'layers', 'layout-grid',
  'log-in', 'log-out', 'message-square-text', 'monitor', 'package-check', 'settings',
  'shield-check', 'sparkles', 'user-round',
]

export const iconTones = { blue: '#1D4ED8', light: '#C9D5F2', muted: '#5A667C', white: '#FFFFFF' }

const tonesByColor = new Map(Object.entries(iconTones).map(([tone, color]) => [color.toLowerCase(), tone]))

export function iconSource(name, tone) {
  const icon = iconNames.includes(name) ? name : 'circle-help'
  if (typeof tone === 'string' && /^#[0-9a-f]{6}$/i.test(tone)) {
    const hex = tone.toLowerCase()
    tone = tonesByColor.get(hex)
    if (!tone) return '/static/pocket-accents/' + icon + '-' + hex.slice(1) + '.svg'
  }
  const color = Object.prototype.hasOwnProperty.call(iconTones, tone) ? tone : 'muted'
  return '/static/icons/' + icon + '-' + color + '.svg'
}
