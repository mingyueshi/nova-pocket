<script setup>
import StatePanel from './StatePanel.vue'
import { account, activeTheme, authRoute } from '../state.js'
import { detailUrl, requiresLogin, returnToAccountHome, returnToServiceList, showAccountTab, viewNames } from '../account-navigation.js'

const props = defineProps({ target: Object, shareable: Boolean })
const { session } = account

// #ifdef H5
import { getCurrentInstance } from 'vue'
const router = getCurrentInstance().proxy.$router
function copyLink() {
  const { view, id, tab } = props.target
  const href = router.resolve(detailUrl(view, id, tab)).href
  const link = new URL(href, window.location.origin + window.location.pathname).href
  uni.setClipboardData({ data: link, fail: () => uni.showModal({ title: '详情链接', content: link, showCancel: false }) })
}
// #endif
</script>

<template>
  <view class="surface service-page" :class="activeTheme.base" :style="activeTheme.style">
    <view class="service-body np-stack">
      <StatePanel v-if="!target" title="页面不可用" action="返回账户中心" @action="returnToAccountHome" />
      <StatePanel v-else-if="session.status === 'idle' || session.status === 'loading'" title="正在加载账户…" />
      <StatePanel v-else-if="session.status === 'error'" title="暂时无法加载账户" :detail="session.error" action="重试" @action="account.restoreSession" />
      <StatePanel v-else-if="session.expired && requiresLogin(target?.view)" title="登录已过期" action="重新登录" @action="authRoute('login', false, target)" />
      <StatePanel v-else-if="requiresLogin(target?.view) && !session.user" title="登录后可查看这项服务" action="去登录" @action="authRoute('login', false, target)" />
      <template v-else>
        <slot />
        <view v-if="shareable && target?.id">
          <!-- #ifdef H5 -->
          <button class="btn outline" @tap="copyLink">复制详情链接</button>
          <!-- #endif -->
          <!-- #ifdef MP-WEIXIN -->
          <button class="btn outline" open-type="share">分享详情</button>
          <!-- #endif -->
        </view>
      </template>
      <button v-if="target?.id" class="link" @tap="returnToServiceList(target)">返回列表</button>
      <button v-else-if="target" class="link" @tap="showAccountTab(target.tab)">{{ target.tab === 'services' ? '返回服务页' : '返回' + viewNames[target.tab] }}</button>
    </view>
  </view>
</template>

<style scoped>
.service-page{min-height:100vh}
.service-body{max-width:680px;margin:0 auto;padding:16px 16px max(20px,env(safe-area-inset-bottom))}
</style>
