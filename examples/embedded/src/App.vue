<script>
import { account } from './uni_modules/nova-pocket/index.js'
export default {
  onShow() { account.restoreSession() },
}
</script>

<style src="./uni_modules/nova-pocket/account.css"></style>
<style>
page{background:#f3f6f2;color:#203c33;font-family:system-ui,sans-serif}
.trail-page{max-width:520px;margin:auto;padding:24px 20px;display:flex;flex-direction:column;gap:16px}
.trail-title{font-size:26px;font-weight:720;color:#203c33}
.trail-note{font-size:15px;line-height:1.6;color:#476557}
.trail-page button{margin:0;width:100%;background:#23594c;color:white;border-radius:10px;font-size:16px}
.trail-page button[disabled]{color:#476557;background:#e2ede7}
.trail-page .trail-secondary{background:white;color:#23594c}
</style>
