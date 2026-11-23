<script setup>
import { onShow } from '@dcloudio/uni-app'
import { account } from '../../state.js'
import AccountScreen from '../../components/AccountScreen.vue'
// Reconcile changes made on host pages while this native tab was hidden.
onShow(() => account.restoreSession())
function showWalk() { uni.navigateTo({ url: '/pages/trail/walk' }) }
</script>
<template>
  <AccountScreen route="mine" tab="mine">
    <template #business><button class="btn outline" @tap="showWalk">我的步行行程</button></template>
  </AccountScreen>
</template>
