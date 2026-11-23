import { onLoad, onReady } from '@dcloudio/uni-app'
import { pageRecordId } from '../uni_modules/nova-pocket/index.js'

// Preserve bookmarks and previously shared cards from the original embedded template.
export function forwardAccountPage(page) {
  let params = []
  onLoad((query = {}) => {
    params = ['view', 'id', 'tab'].filter(key => typeof query[key] === 'string')
      .map(key => key + '=' + encodeURIComponent(pageRecordId(query[key])))
  })
  onReady(() => uni.redirectTo({
    url: '/uni_modules/nova-pocket/pages/account/' + page + (params.length ? '?' + params.join('&') : ''),
  }))
}
