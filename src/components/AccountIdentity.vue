<script setup>
import { computed } from 'vue'
import config from '../pocket.config.js'
import { auth } from '../adapters/index.js'
import { viewNames } from '../account-navigation.js'
import { activeTheme, state } from '../state.js'
import NovaIcon from './NovaIcon.vue'

defineProps({ actions: Boolean, compact: Boolean, canLogin: Boolean, canRegister: Boolean })
defineEmits(['login', 'register', 'profile'])
const guest = computed(() => state.mode === 'guest')
const avatar = computed(() => guest.value ? '访' : Array.from(state.nickname)[0] || '示')
const identity = computed(() => guest.value ? '你好，访客' : state.nickname)
const role = computed(() => guest.value ? '浏览账户中心' : state.mode === 'incomplete' ? '资料待完善' : (auth.demo ? '演示账号' : '已登录'))
</script>

<template>
  <view class="hero" :class="{compact, solid:(activeTheme.heroStyle || (config.host ? 'solid' : 'gradient')) === 'solid'}">
   <view class="orbit" aria-hidden="true"><view></view><view></view><view></view><image v-if="config.brand.logo" :src="config.brand.logo" mode="aspectFit" class="brand-logo" /><NovaIcon v-else name="sparkles" tone="white" :size="52" /></view>
   <view class="identity"><view class="avatar" aria-hidden="true">{{avatar}}</view><view><text class="hero-name">{{identity}}</text><text class="hero-note">{{role}}</text></view></view>
   <view v-if="actions" class="actions">
    <button role="button" v-if="guest && canLogin" class="hero-btn" @tap="$emit('login')">登录</button>
    <button role="button" v-if="guest && canRegister" class="hero-btn secondary-hero" @tap="$emit('register')">注册</button>
    <button role="button" v-if="!guest && viewNames.profile" class="hero-btn" @tap="$emit('profile')">{{state.mode==='incomplete'?'完善资料':'编辑资料'}}</button>
   </view>
  </view>
</template>

<style scoped>
.hero.solid{background:var(--hero)}
.brand-logo{width:52px;height:52px}
.hero{position:relative;overflow:hidden;border-radius:21px;min-height:138px;background:linear-gradient(113deg,var(--hero-start),var(--hero));color:#fff;padding:18px}.hero.compact{min-height:110px}.orbit{position:absolute;pointer-events:none;right:-24px;top:-57px;width:235px;height:235px;opacity:.43;display:flex;align-items:center;justify-content:center}.orbit view{position:absolute;width:200px;height:106px;border:1px solid currentColor;border-radius:100%;transform:rotate(-36deg)}.orbit view:nth-child(2){transform:rotate(36deg)}.orbit view:nth-child(3){width:142px;height:142px;border-style:dashed;transform:rotate(0deg)}
.identity,.actions{position:relative;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.identity{flex-wrap:nowrap}.identity>view:last-child{min-width:0;flex:1}.actions{align-items:stretch;flex-direction:column}.actions button{width:100%}.avatar{display:flex;align-items:center;justify-content:center;width:49px;height:49px;border-radius:15px;background:var(--soft);color:var(--brand);font-size:21px;font-weight:840;flex:none}.hero-name,.hero-note{display:block;overflow-wrap:anywhere}.hero-name{font-size:22px;font-weight:780}.hero-note{font-size:14px;color:inherit;margin-top:2px}.hero .actions{margin-top:12px}.hero-btn{display:flex;align-items:center;justify-content:center;line-height:1.4;border-radius:10px;min-height:44px;padding:0 16px;background:var(--soft);color:var(--brand);font-weight:730}.secondary-hero{background:#ffffff22;color:#fff}
@media(min-width:760px){.hero{padding:23px}.actions button{width:fit-content;min-width:128px}}
</style>
