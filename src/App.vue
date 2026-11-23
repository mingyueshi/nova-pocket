<script>
import { account } from './state.js'
// #ifdef H5
import { detailPath, isTab, serviceUrl } from './account-navigation.js'
// #endif
export default {
  // #ifdef H5
  onLaunch() {
    // Opening a shared hash in an existing tab can reuse a discarded UniApp detail page.
    this.$router.beforeEach(to => {
      if (to.path !== detailPath) return
      const { view, id, tab } = to.query
      const path = serviceUrl(view)
      if (!path) return
      const query = {}
      // Match uni.navigateTo's query encoding. UniApp decodes page options on load.
      if (typeof id === 'string' && id) query.id = encodeURIComponent(id)
      if (isTab(tab) && tab !== 'services') query.tab = tab
      return { path, query, replace: true }
    })
  },
  // #endif
  onShow() { account.restoreSession() },
}
</script>
<style src="./account.css"></style>
<style>
page,body{margin:0;background:#f4f6fa;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",sans-serif;color:#23283a}
</style>
