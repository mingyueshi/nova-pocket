<script setup>
import { ref } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
// #ifdef MP-WEIXIN
import { onShareAppMessage } from '@dcloudio/uni-app'
// #endif
import ServicePage from '../../components/ServicePage.vue'
import NovaRow from '../../components/NovaRow.vue'
import StatePanel from '../../components/StatePanel.vue'
import { useServicePage } from '../../use-service-page.js'
import { account } from '../../state.js'
import { request } from '../../adapters/index.js'
import { useLoans } from './use-loans.js'

const { target, openRecord, shareMessage } = useServicePage()
const visible = ref(false)
onShow(() => { visible.value = true })
onHide(() => { visible.value = false })
const { result, retry } = useLoans(account, request, target, visible)
// #ifdef MP-WEIXIN
onShareAppMessage(shareMessage)
// #endif
</script>

<template>
  <ServicePage :target="target" :shareable="!!result.book">
    <StatePanel v-if="result.status === 'idle' || result.status === 'loading'" title="正在加载借阅记录…" />
    <StatePanel v-else-if="result.status === 'error'" title="借阅加载失败" :detail="result.error" action="重试" @action="retry" />
    <StatePanel v-else-if="result.status === 'unavailable'" title="借阅记录不可用" detail="返回列表可查看你的借阅记录。" />
    <view v-else-if="result.book" class="panel np-stack">
      <text class="title" role="heading" aria-level="1">{{ result.book.title }}</text>
      <text class="loan-status badge">{{ result.book.status }}</text>
      <text class="note">借阅日期　{{ result.book.borrowed }}</text>
      <text v-if="result.book?.returned" class="note">归还日期　{{ result.book.returned }}</text>
      <text v-else class="note">应还日期　{{ result.book.due }}</text>
    </view>
    <view v-else-if="result.items?.length" class="panel">
      <NovaRow v-for="item in result.items" :key="item.id" icon="layers" :label="item.title"
        :detail="'借阅日期 ' + item.borrowed" :tail="item.status" @select="openRecord(item.id)" />
    </view>
    <StatePanel v-else title="暂无借阅记录" detail="借书后可在这里查看借阅与归还日期。" />
  </ServicePage>
</template>

<style scoped>
.loan-status{align-self:flex-start}
</style>
