<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSession, hasJoined, joinWalk, routeNoticeId } from '../../trail/member.js'
import { openAccountView } from '../../uni_modules/nova-pocket/index.js'

const joined = ref(false)
const member = ref(null)
onShow(() => {
  joined.value = hasJoined()
  member.value = getSession()
})
function join() {
  if (!member.value) return uni.navigateTo({ url: '/pages/trail/login' })
  joinWalk()
  joined.value = true
}
</script>
<template>
  <view class="trail-page">
    <text class="trail-title">河岸晨行</text>
    <text class="trail-note">南门出发 · 环线 3 公里</text>
    <button :disabled="joined" @tap="join">{{ joined ? '已加入行程' : member ? '加入行程' : '登录后加入行程' }}</button>
    <button class="trail-secondary" @tap="openAccountView('message', routeNoticeId, 'mine')">查看集合通知</button>
  </view>
</template>
