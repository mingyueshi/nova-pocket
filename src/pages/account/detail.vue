<script setup>
import { computed, ref } from 'vue'
// #ifdef H5
import { getCurrentInstance, watch } from 'vue'
import { onHide, onUnload } from '@dcloudio/uni-app'
import { detailPath } from '../../account-navigation.js'
// #endif
import { onAddToFavorites, onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app'
import AccountScreen from '../../components/AccountScreen.vue'
import {
  backFromAccountView, detailTab, detailUrl, isDetail, showAccountTab, viewNames,
} from '../../account-navigation.js'
import { findMessage } from '../../messages.js'
import { state } from '../../state.js'

const detail = ref({ route: '', recordId: '', tab: 'home' })
const title = computed(() => viewNames[detail.value.route] || '页面未找到')

function loadDetail(query) {
  const route = typeof query?.view === 'string' && isDetail(query.view) ? query.view : ''
  const recordId = typeof query?.id === 'string' ? query.id : ''
  detail.value = { route, recordId, tab: detailTab(route, query?.tab) }
  uni.setNavigationBarTitle({ title: title.value })
}

function markMessageRead() {
  const { route, recordId } = detail.value
  if (route !== 'message' || state.mode === 'guest' || state.scenario !== 'normal') return
  if (findMessage(recordId) && !state.read.includes(recordId)) state.read.push(recordId)
}

onLoad(loadDetail)
onShow(markMessageRead)

// #ifdef H5
// A pasted hash URL can change the query without creating another UniApp page instance.
const instance = getCurrentInstance().proxy
let visible = false

onShow(() => { visible = true })
onHide(() => { visible = false })
onUnload(() => { visible = false })
watch(() => instance.$route.fullPath, () => {
  if (!visible || instance.$route.path !== detailPath) return
  loadDetail(instance.$route.query)
  markMessageRead()
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
  <AccountScreen :key="detail.route + ':' + detail.recordId" :route="detail.route"
    :record-id="detail.recordId" :tab="detail.tab" @back="back" @select-tab="showAccountTab" />
</template>
