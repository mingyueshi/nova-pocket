<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import config from '../../pocket.config.js'
import { getSession } from '../../trail/member.js'
const member = ref(null)
onShow(() => { member.value = getSession() })
function showWalk() { uni.navigateTo({ url: '/pages/trail/walk' }) }
</script>
<template>
  <view class="trail-page surface">
    <image v-if="config.brand.logo" :src="config.brand.logo" mode="aspectFit" aria-hidden="true" style="width:44px;height:44px" />
    <text class="trail-title">{{ config.brand.name }}</text>
    <text class="trail-note">{{ member ? member.nickname + '的路线' : '访客路线' }}</text>
    <button @tap="showWalk">河岸晨行</button>
  </view>
</template>
