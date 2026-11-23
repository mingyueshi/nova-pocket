<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSession, getReminders, setReminders } from '../../trail/member.js'
import { accountTarget, authRoute } from '../../uni_modules/nova-pocket/index.js'
const signedIn = ref(false)
const enabled = ref(false)
onShow(() => {
  signedIn.value = Boolean(getSession())
  enabled.value = signedIn.value && getReminders()
})
function toggle(event) {
  setReminders(event.detail.value)
  enabled.value = event.detail.value
}
</script>
<template>
  <view class="trail-page">
    <template v-if="signedIn">
      <label>加入行程时生成站内提醒 <switch aria-label="行程提醒" :checked="enabled" color="#23594c" @change="toggle" /></label>
    </template>
    <button v-else @tap="authRoute('login', false, accountTarget('notifications'))">登录后设置提醒</button>
  </view>
</template>
