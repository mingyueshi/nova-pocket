// A missing page uses its legacy layout preset. An explicit [] hides every content block.
const blockTypes = new Set(['identity', 'status', 'shortcuts', 'management', 'more', 'demo', 'business', 'menu'])

export function configuredBlocks(blocks = {}) {
  if (!blocks || typeof blocks !== 'object' || Array.isArray(blocks)) throw new Error('blocks 应包含 home 或 mine 页面配置')
  const result = {}
  for (const [page, list] of Object.entries(blocks)) {
    if (!['home', 'mine'].includes(page) || !Array.isArray(list)) throw new Error('blocks.' + page + ' 应为首页或我的区块数组')
    const seen = new Set()
    result[page] = list.map((item, index) => {
      const block = typeof item === 'string' ? { type: item } : item
      const field = 'blocks.' + page + '[' + index + ']'
      if (!blockTypes.has(block?.type)) throw new Error(field + ' 区块类型无效')
      if (block.enabled !== undefined && typeof block.enabled !== 'boolean') throw new Error(field + '.enabled 应为布尔值')
      if (block.actions !== undefined && (block.type !== 'identity' || typeof block.actions !== 'boolean')) {
        throw new Error(field + '.actions 只适用于身份卡，值应为布尔值')
      }
      if (block.type === 'menu') {
        if (typeof block.title !== 'string' || !block.title.trim() || !Array.isArray(block.entries) ||
            !block.entries.every(key => typeof key === 'string' && key.trim()) || new Set(block.entries).size !== block.entries.length) {
          throw new Error(field + ' 菜单需要标题和不重复的入口键数组')
        }
      } else if (seen.has(block.type)) {
        throw new Error(field + ' 重复的区块：' + block.type)
      }
      seen.add(block.type)
      return { ...block, key: block.type === 'menu' ? 'menu-' + index : block.type }
    }).filter(block => block.enabled !== false)
  }
  return result
}

function preset(page, layout, embedded) {
  if (page === 'home') {
    if (layout === 'shortcuts') return ['shortcuts', 'identity', 'more']
    if (layout === 'minimal') return ['identity', 'management', 'more']
    return ['identity', 'status', 'shortcuts', 'more']
  }
  let first = ['identity']
  if (embedded && layout === 'shortcuts') first = ['shortcuts', 'identity']
  if (embedded && layout === 'overview') first.push('shortcuts')
  return [...first, 'management', ...(embedded ? ['business'] : []), 'more', 'demo']
}

export function resolveBlocks(configured, { page, layout, embedded, groups, entries, statusAvailable }) {
  if (page !== 'home' && page !== 'mine') return []
  const blocks = configured[page] ?? preset(page, layout, embedded).map(type => ({ type, key: type }))
  const result = []
  for (const block of blocks) {
    if (block.type === 'menu') {
      const rows = block.entries.map(key => entries.get(key)).filter(Boolean)
      if (rows.length) result.push({ ...block, rows })
    } else if (groups[block.type]) {
      const group = groups[block.type]
      if (group.rows.length) result.push({ ...block, ...group })
    } else if (block.type !== 'status' || statusAvailable) {
      result.push(block)
    }
  }
  return result
}

export function validateLayoutConfig(config) {
  if (!['overview', 'shortcuts', 'minimal'].includes(config.defaultLayout)) {
    throw new Error('pocket.config.js: defaultLayout 应为 overview、shortcuts 或 minimal')
  }
  configuredBlocks(config.blocks)
}
