import { onUnmounted, shallowRef } from 'vue'

export function useHeaderPadding() {
  const style = shallowRef()
  // #ifdef MP-WEIXIN
  function measure() {
    const menu = uni.getMenuButtonBoundingClientRect?.()
    const windowInfo = uni.getWindowInfo?.() || uni.getSystemInfoSync()
    const status = windowInfo.statusBarHeight || 0
    const bottom = menu?.bottom > status ? menu.bottom : status + 44
    style.value = { paddingTop: (bottom + 12) + 'px' }
  }
  measure()
  uni.onWindowResize?.(measure)
  onUnmounted(() => uni.offWindowResize?.(measure))
  // #endif
  return style
}
