import { createSSRApp } from 'vue'
import App from './App.vue'
// #ifdef H5
import { installPocketH5 } from './uni_modules/nova-pocket/index.js'
// #endif

export function createApp() {
  // #ifdef H5
  installPocketH5()
  // #endif
  return { app: createSSRApp(App) }
}
