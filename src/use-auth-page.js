import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { accountTarget, leaveAuthPages, pageRecordId } from './account-navigation.js'
import { authRoute } from './state.js'
import { useLeaveConfirmation } from './use-leave-confirmation.js'

export function useAuthPage() {
  const dirty = ref(false)
  let target
  onLoad(query => { target = accountTarget(query?.returnView, pageRecordId(query?.returnId), query?.returnTab) })
  const openAuth = kind => authRoute(kind, false, target)
  const leave = useLeaveConfirmation(() => dirty.value, '放弃已填写的内容？', '取消后可以继续填写。')

  function toLogin() {
    const pages = getCurrentPages()
    if (pages[pages.length - 2]?.route === 'pages/auth/login') return uni.navigateBack()
    return authRoute('login', true, target)
  }

  function setDirty(value) {
    dirty.value = value
  }

  function leaveAuth(destination) {
    if (destination === 'login') return leave(toLogin)
    return leave(() => leaveAuthPages(destination === 'authenticated' ? target : null))
  }

  return { setDirty, leaveAuth, openAuth }
}
