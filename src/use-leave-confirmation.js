import { onHide, onShow, onUnload } from '@dcloudio/uni-app'
import { watch } from 'vue'
import { confirm, hint } from './state.js'

// #ifdef H5
let activeHistoryGuard

function handleHistoryChange(event) {
  activeHistoryGuard?.(event)
}

export function installHistoryGuard() {
  // Register before Vue Router handles popstate. UniApp prunes its page stack in that listener.
  window.addEventListener('popstate', handleHistoryChange, true)
}
// #endif

export function useLeaveConfirmation(hasChanges, title, content) {
  let visible = false
  let confirming = false
  let leaving = false

  // #ifdef H5
  let pagePosition
  let returnDelta
  let afterRestore

  function beforeUnload(event) {
    if (!hasChanges() || leaving) return
    event.preventDefault()
    event.returnValue = true
  }

  function onPopState(event) {
    const position = event.state?.position
    if (!Number.isInteger(position)) return

    if (returnDelta !== undefined && position === pagePosition) {
      event.stopImmediatePropagation()
      const delta = returnDelta
      returnDelta = undefined
      if (afterRestore) {
        const navigate = afterRestore
        afterRestore = undefined
        navigate()
      } else if (!confirming) {
        void leave(() => window.history.go(delta))
      }
      return
    }

    if (!hasChanges() || leaving || position === pagePosition) return
    event.stopImmediatePropagation()
    returnDelta = position - pagePosition
    window.history.go(-returnDelta)
  }
  // #endif

  // #ifdef MP-WEIXIN
  let nativePrompt = false
  let nativeUpdate = Promise.resolve()

  function setNativePrompt(enable) {
    if (nativePrompt === enable || !wx.enableAlertBeforeUnload || !wx.disableAlertBeforeUnload) return nativeUpdate

    nativePrompt = enable
    nativeUpdate = nativeUpdate.then(() => new Promise(resolve => {
      const complete = () => resolve()
      if (enable) wx.enableAlertBeforeUnload({ message: title, complete })
      else wx.disableAlertBeforeUnload({ complete })
    }))

    return nativeUpdate
  }
  // #endif

  function syncPrompt() {
    const active = visible && !leaving && hasChanges()
    // #ifdef H5
    if (active) window.addEventListener('beforeunload', beforeUnload)
    else window.removeEventListener('beforeunload', beforeUnload)
    // #endif
    // #ifdef MP-WEIXIN
    return setNativePrompt(active && getCurrentPages().length > 1)
    // #endif
  }

  onShow(() => {
    visible = true
    leaving = false
    // #ifdef H5
    pagePosition = window.history.state?.position
    activeHistoryGuard = onPopState
    // #endif
    syncPrompt()
  })

  function hide() {
    visible = false
    // #ifdef H5
    if (activeHistoryGuard === onPopState) activeHistoryGuard = undefined
    returnDelta = undefined
    afterRestore = undefined
    // #endif
    syncPrompt()
  }

  onHide(hide)
  onUnload(hide)
  watch(hasChanges, syncPrompt, { flush: 'sync' })

  async function leave(navigate) {
    if (confirming || leaving) return
    if (hasChanges()) {
      confirming = true
      const discard = await confirm(title, content, '放弃')
      confirming = false
      if (!discard || !visible) return
    }

    async function proceed() {
      leaving = true
      try {
        await syncPrompt()
        await navigate()
      } catch {
        leaving = false
        syncPrompt()
        hint('暂时无法返回，请重试')
      }
    }

    // #ifdef H5
    if (returnDelta !== undefined) {
      afterRestore = proceed
      return
    }
    // #endif
    await proceed()
  }

  return leave
}
