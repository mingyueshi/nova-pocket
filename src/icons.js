export const iconNames = [
  'bell', 'chart-no-axes-combined', 'chevron-left', 'chevron-right', 'circle-alert',
  'circle-help', 'clock-3', 'eye', 'eye-off', 'key-round', 'layers', 'layout-grid',
  'log-in', 'log-out', 'message-square-text', 'monitor', 'package-check', 'settings',
  'shield-check', 'sparkles', 'user-round',
]

export const iconTones = { blue: '#1D4ED8', light: '#C9D5F2', muted: '#5A667C', white: '#FFFFFF' }

export function iconSource(name, tone) {
  const icon = iconNames.includes(name) ? name : 'circle-help'
  const color = Object.prototype.hasOwnProperty.call(iconTones, tone) ? tone : 'muted'
  return '/static/icons/' + icon + '-' + color + '.svg'
}
