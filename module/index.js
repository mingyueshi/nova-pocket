// Public host integration API. The host keeps its own session and notification storage.
export { account, authRoute } from './state.js'
export { accountTarget, leaveAuthPages, openAccountView, pageRecordId } from './account-navigation.js'
// #ifdef H5
import { installFormViewport } from './form-viewport.js'
import { installHistoryGuard } from './use-leave-confirmation.js'
export function installPocketH5() {
  installHistoryGuard()
  installFormViewport()
}
// #endif
