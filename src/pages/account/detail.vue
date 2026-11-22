<script setup>
import { computed, ref } from 'vue'
// #ifdef H5
import { getCurrentInstance, watch } from 'vue'
import { detailPath } from '../../account-navigation.js'
// #endif
import { onAddToFavorites, onHide, onLoad, onShareAppMessage, onShow, onUnload } from '@dcloudio/uni-app'
import AccountScreen from '../../components/AccountScreen.vue'
import {
  backFromAccountView, detailTab, detailUrl, isDetail, pageRecordId, showAccountTab, viewNames,
} from '../../account-navigation.js'

const detail = ref({ route: '', recordId: '', tab: 'home' })
const title = computed(() => viewNames[detail.value.route] || '页面未找到')

function loadDetail(query) {
  const route = typeof query?.view === 'string' && isDetail(query.view) ? query.view : ''
  const recordId = pageRecordId(query?.id)
  detail.value = { route, recordId, tab: detailTab(route, query?.tab) }
  uni.setNavigationBarTitle({ title: title.value })
}

const visible = ref(false)
onLoad(loadDetail)
onShow(() => { visible.value = true })
onHide(() => { visible.value = false })
onUnload(() => { visible.value = false })

// #ifdef H5
// A pasted hash URL can change the query without creating another UniApp page instance.
const instance = getCurrentInstance().proxy
watch(() => instance.$route.fullPath, () => {
  if (!visible.value || instance.$route.path !== detailPath) return
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
  <AccountScreen :key="detail.route + ':' + detail.recordId" :route="detail.route"
    :active="visible" :record-id="detail.recordId" :tab="detail.tab" @back="back" @select-tab="showAccountTab" />
</template>
