import { ref } from 'vue'
import { accountHome, authRoute } from './state.js'
import { useLeaveConfirmation } from './use-leave-confirmation.js'

export function useAuthPage() {
  const dirty = ref(false)
  const leave = useLeaveConfirmation(() => dirty.value, '放弃已填写的内容？', '取消后可以继续填写。')

  function toLogin() {
    const pages = getCurrentPages()
    if (pages[pages.length - 2]?.route === 'pages/auth/login') return uni.navigateBack()
    return authRoute('login', true)
  }

  function setDirty(value) {
    dirty.value = value
  }

  function leaveAuth(destination) {
    return leave(destination === 'login' ? toLogin : accountHome)
  }

  return { setDirty, leaveAuth }
}
