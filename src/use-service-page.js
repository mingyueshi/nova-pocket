import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
// #ifdef H5
import { getCurrentInstance, watch } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import { decodePageOption } from './account-navigation.js'
// #endif
import { accountTarget, detailUrl, openAccountView, pageRecordId, serviceViewForPath, viewNames } from './account-navigation.js'

export function useServicePage() {
  const target = ref(null)
  let path
  function load(query) {
    target.value = accountTarget(serviceViewForPath(path), pageRecordId(query?.id), query?.tab)
  }
  onLoad(query => {
    const pages = getCurrentPages()
    path = pages[pages.length - 1]?.route
    load(query)
  })

  // #ifdef H5
  const vm = getCurrentInstance().proxy
  let visible = false
  onShow(() => { visible = true })
  onHide(() => { visible = false })
  watch(() => vm.$route.fullPath, () => {
    if (visible && vm.$route.path === '/' + path) {
      const query = vm.$route.query
      load({ ...query, id: decodePageOption(query.id) })
    }
  }, { flush: 'post' })
  // #endif

  function openRecord(id) {
    if (target.value && typeof id === 'string' && id) {
      return openAccountView(target.value.view, id, target.value.tab)
    }
  }
  function shareMessage() {
    if (!target.value) return { path: '/pages/index/index' }
    const { view, id, tab } = target.value
    return { title: viewNames[view], path: detailUrl(view, id, tab) }
  }
  return { target, openRecord, shareMessage }
}
