<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { account, accountTarget, leaveAuthPages, pageRecordId } from '../../uni_modules/nova-pocket/index.js'
import { signIn } from '../../trail/member.js'
import config from '../../pocket.config.js'

let target
onLoad(query => { target = accountTarget(query.returnView, pageRecordId(query.returnId), query.returnTab) })
async function login() {
  signIn()
  await account.restoreSession()
  return leaveAuthPages(target)
}
</script>
<template>
  <view class="trail-page">
    <text class="trail-title">{{ config.brand.name }}会员登录</text>
    <text class="trail-note">使用本机示例会员继续。</text>
    <button @tap="login">以步道会员登录</button>
    <button class="trail-secondary" @tap="leaveAuthPages()">取消登录</button>
  </view>
</template>
