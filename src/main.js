import { createSSRApp } from 'vue'
import App from './App.vue'
// #ifdef H5
import { installHistoryGuard } from './use-leave-confirmation.js'
// #endif

export function createApp() {
  // #ifdef H5
  installHistoryGuard()
  // #endif
  return { app: createSSRApp(App) }
}
