<script setup>
import { computed, ref } from 'vue'
// #ifdef H5
import { getCurrentInstance, watch } from 'vue'
import { detailPath } from '../../account-navigation.js'
// #endif
import { onAddToFavorites, onHide, onLoad, onReady, onShareAppMessage, onShow, onUnload } from '@dcloudio/uni-app'
import config from '../../pocket.config.js'
import AccountScreen from '../../components/AccountScreen.vue'
import {
  backFromAccountView, detailTab, detailUrl, isDetail, pageRecordId, serviceUrl, showAccountTab, viewNames,
} from '../../account-navigation.js'

const detail = ref({ route: '', recordId: '', tab: 'home' })
const title = computed(() => viewNames[detail.value.route] || '页面未找到')
const destination = computed(() => config.accountPages?.[detail.value.route] || serviceUrl(detail.value.route, detail.value.recordId, detail.value.tab))
let ready = false
// #ifdef H5
const instance = getCurrentInstance().proxy
let loadedPath
// #endif

function forward() {
  uni.redirectTo({
    url: destination.value,
    fail: () => {
      detail.value.route = ''
      uni.setNavigationBarTitle({ title: title.value })
    },
  })
}

function loadDetail(query) {
  const route = typeof query?.view === 'string' && isDetail(query.view) ? query.view : ''
  // #ifdef H5
  loadedPath = instance.$route.fullPath
  // A public service URL is encoded once. Vue Router has already decoded it.
  if (serviceUrl(route)) query = instance.$route.query
  // #endif
  const recordId = pageRecordId(query?.id)
  detail.value = { route, recordId, tab: detailTab(route, query?.tab) }
  if (!destination.value) uni.setNavigationBarTitle({ title: title.value })
  else if (ready) forward()
}

const visible = ref(false)
onLoad(loadDetail)
// WeChat must finish mounting a freshly launched share page before replacing it.
onReady(() => {
  ready = true
  if (destination.value) forward()
})
onShow(() => { visible.value = true })
onHide(() => { visible.value = false })
onUnload(() => { visible.value = false })

// #ifdef H5
// A pasted hash URL can change the query without creating another UniApp page instance.
watch(() => instance.$route.fullPath, () => {
  if (!visible.value || instance.$route.path !== detailPath || instance.$route.fullPath === loadedPath) return
  loadDetail(instance.$route.query)
}, { flush: 'post' })
// #endif

function back() {
  return backFromAccountView(detail.value.route, detail.value.tab)
}

// #ifdef MP-WEIXIN
function sharePath() {
  return detailUrl(detail.value.route, detail.value.recordId)
}

onShareAppMessage(() => ({ title: title.value, path: sharePath() }))
onAddToFavorites(() => ({ title: title.value, query: sharePath().split('?')[1] }))
// #endif
</script>

<template>
  <AccountScreen v-if="!destination" :key="detail.route + ':' + detail.recordId" :route="detail.route"
    :active="visible" :record-id="detail.recordId" :tab="detail.tab" @back="back" @select-tab="showAccountTab" />
</template>
