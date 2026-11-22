<script setup>
import { computed } from 'vue'
// #ifdef MP-WEIXIN
import { onShareAppMessage } from '@dcloudio/uni-app'
// #endif
import ServicePage from '../../components/ServicePage.vue'
import NovaRow from '../../components/NovaRow.vue'
import StatePanel from '../../components/StatePanel.vue'
import { useServicePage } from '../../use-service-page.js'

const { target, openRecord, shareMessage } = useServicePage()
// #ifdef MP-WEIXIN
onShareAppMessage(shareMessage)
// #endif
const loans = [
  { id: '借阅/山川+02', title: '山川笔记', status: '借阅中', borrowed: '2026-11-10', due: '2026-12-10' },
  { id: 'BR-1038', title: '城市里的树', status: '已归还', borrowed: '2026-10-05', returned: '2026-10-26' },
]
const book = computed(() => loans.find(item => item.id === target.value?.id))
</script>

<template>
  <ServicePage :target="target" :shareable="!!book">
    <view v-if="!target?.id" class="panel">
      <NovaRow v-for="item in loans" :key="item.id" icon="layers" :label="item.title"
        :detail="'借阅日期 ' + item.borrowed" :tail="item.status" @select="openRecord(item.id)" />
    </view>
    <view v-else-if="book" class="panel np-stack">
      <text class="title" role="heading" aria-level="1">{{ book.title }}</text>
      <text class="loan-status badge">{{ book.status }}</text>
      <text class="note">借阅日期　{{ book.borrowed }}</text>
      <text v-if="book.returned" class="note">归还日期　{{ book.returned }}</text>
      <text v-else class="note">应还日期　{{ book.due }}</text>
    </view>
    <StatePanel v-else title="借阅记录不存在" detail="返回列表可查看你的其他借阅记录。" />
  </ServicePage>
</template>

<style scoped>
.loan-status{align-self:flex-start}
</style>
