<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import NovaIcon from './NovaIcon.vue'
import config from '../pocket.config.js'
import { auth } from '../adapters/index.js'
import { account as accountData, authRoute, hint, state, themeColor } from '../state.js'
const emit = defineEmits(['dirty', 'leave'])
const props=defineProps({kind:{type:String,required:true}})
const method=ref('password'), account=ref(''), code=ref(''), password=ref(''), nickname=ref(''), agree=ref(false), visible=ref(false), codeHint=ref(''), sending=ref(false), seconds=ref(0), error=ref(''), busy=ref(false)
const completed = ref(false)
let timer
let active = true
watch(
  () => !completed.value && Boolean(account.value || code.value || password.value || nickname.value || agree.value),
  dirty => emit('dirty', dirty),
  { flush: 'sync' },
)
function openAuth(kind) {
  if (!busy.value) authRoute(kind)
}
const register=computed(()=>props.kind==='register'), recover=computed(()=>props.kind==='recover')
const usesCode=computed(()=>register.value||recover.value||method.value==='code')
const title=computed(()=>register.value?'创建账号':recover.value?'找回密码':'欢迎回来')
const actionLabel=computed(()=>register.value?'创建账号':recover.value?'重置密码':'登录')
const tone=computed(()=>state.theme==='dark'?'light':'muted')
function mockFields() {
  account.value = 'demo@example.test'
  nickname.value = '新用户'
  password.value = 'NovaDemo2026'
  error.value = ''
}
function setMethod(value) {
  method.value = value
  error.value = ''
  code.value = ''
}
async function sendCode() {
  if (seconds.value || sending.value) return
  const email = account.value.trim()
  if (!email) { error.value = '请输入邮箱。'; return }
  sending.value = true
  error.value = ''
  codeHint.value = ''
  try {
    const result = await auth.sendCode({ account: email, purpose: props.kind })
    if (!active || email !== account.value.trim()) return
    codeHint.value = result?.hint || '验证码已发送。'
    seconds.value = 30
    clearInterval(timer)
    timer = setInterval(() => { if (--seconds.value <= 0) clearInterval(timer) }, 1000)
  } catch (cause) {
    if (active) error.value = cause.message || '验证码发送失败，请重试'
  } finally {
    sending.value = false
  }
}
function selectTerms(event) { agree.value = event.detail.value.includes('yes') }
async function submit() {
  if (busy.value) return
  error.value = ''
  const form = { account: account.value.trim() }
  if (!form.account) { error.value = '请输入邮箱。'; return }
  if (usesCode.value) {
    form.code = code.value.trim()
    if (!form.code) { error.value = '请输入验证码。'; return }
  }
  if (register.value || recover.value || method.value === 'password') {
    form.password = password.value
    if (!form.password) { error.value = '请输入密码。'; return }
  }
  if (register.value) {
    form.nickname = nickname.value.trim()
    if (!form.nickname || Array.from(form.nickname).length > 20) { error.value = '请输入 1–20 个字符的昵称。'; return }
    if (!agree.value) { error.value = '请先勾选注册确认。'; return }
  }
  if (props.kind === 'login') form.method = method.value
  busy.value = true
  try {
    if (recover.value) await auth.recover(form)
    else await accountData.authenticate(props.kind, form)
    if (!active) return
    completed.value = true
    password.value = ''
    code.value = ''
    hint(recover.value ? '密码已重置' : register.value ? '账号已创建' : '已登录')
    emit('leave', recover.value ? 'login' : 'home')
  } catch (cause) {
    if (active) error.value = cause.message || '操作失败，请重试'
  } finally {
    busy.value = false
  }
}
watch(account, () => {
  codeHint.value = ''
  code.value = ''
  seconds.value = 0
  clearInterval(timer)
})
onUnmounted(() => { active = false; clearInterval(timer) })
</script>
<template>
<view class="surface auth" :class="state.theme">
 <view class="auth-top"><button class="icon-button" aria-label="返回账户中心" @tap="$emit('leave', 'home')"><NovaIcon name="chevron-left" :tone="tone" /></button><text class="brand-name">{{config.brand.name}}</text></view>
 <view class="auth-content">
  <view class="auth-mark"><image v-if="config.brand.logo" class="auth-logo" mode="aspectFit" :src="config.brand.logo" /><NovaIcon v-else name="sparkles" :tone="state.theme==='dark'?'muted':'white'" :size="26" /></view>
  <text class="title">{{title}}</text>
  <text v-if="auth.demo" class="note auth-intro">仅使用演示数据，不发送真实邮件或保存密码。</text>
  <view v-if="kind==='login'" class="methods" aria-label="登录方式">
   <text class="mode-label">{{method==='password'?'密码登录':'邮箱验证码登录'}}</text>
   <button class="link" @tap="setMethod(method==='password'?'code':'password')">{{method==='password'?'改用邮箱验证码':'改用密码登录'}}</button>
  </view>
  <form @submit="submit">
   <view class="fields">
    <view v-if="register" class="field"><text>昵称</text><input v-model="nickname" aria-label="昵称" placeholder="昵称" maxlength="40" /></view>
    <view class="field"><text>邮箱</text><input v-model="account" aria-label="邮箱" :placeholder="auth.demo ? 'demo@example.test' : '请输入邮箱'" maxlength="70" /></view>
    <view v-if="usesCode" class="field"><text>验证码</text><view class="input-row code-row"><input v-model="code" aria-label="验证码" type="number" maxlength="16" placeholder="请输入验证码"/><button class="btn" :disabled="seconds>0 || sending" @tap="sendCode">{{seconds>0?seconds+' 秒':(auth.demo?'生成验证码':'发送验证码')}}</button></view><text v-if="codeHint" class="note hint-code" role="status">{{codeHint}}</text></view>
    <view v-if="register||recover||method==='password'" class="field"><text>{{recover?'新密码':'密码'}}</text><view class="input-row password-row"><input v-model="password" :password="!visible" aria-label="密码" placeholder="请输入密码" maxlength="100" /><button class="btn password-toggle" :aria-label="visible?'隐藏密码':'显示密码'" @tap="visible=!visible"><NovaIcon :name="visible?'eye-off':'eye'" :tone="tone" /></button></view></view>
    <checkbox-group v-if="register" @change="selectTerms"><label class="consent"><checkbox value="yes" :checked="agree" :color="themeColor" /><text>{{auth.demo?'同意仅使用虚构资料体验，不创建真实账号':'确认使用上述资料注册账号'}}</text></label></checkbox-group>
    <text v-if="error" class="error" role="alert">{{error}}</text>
    <button class="btn primary" form-type="submit" :disabled="busy">{{busy?'处理中…':actionLabel}}</button>
   </view>
  </form>
  <view class="form-links">
   <button v-if="auth.demo" class="link" @tap="mockFields">填入演示资料</button>
   <button v-if="kind==='login'" class="link" @tap="openAuth('register')">注册</button>
   <button v-if="kind==='login'" class="link" @tap="openAuth('recover')">忘记密码</button>
   <button v-if="kind!=='login'" class="link" @tap="$emit('leave', 'login')">返回登录</button>
  </view>
 </view>
</view>
</template>
<style scoped>
.auth-logo{width:32px;height:32px}
.auth{min-height:100vh;min-height:100dvh;padding:0 20px max(20px,env(safe-area-inset-bottom))}
.auth-top{width:100%;max-width:440px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:calc(12px + env(safe-area-inset-top)) 0 10px}.brand-name{font-size:15px;font-weight:780}
.auth-content{width:100%;max-width:440px;margin:22px auto 0}.auth-mark{display:flex;align-items:center;justify-content:center;width:50px;height:50px;border-radius:15px;background:var(--brand);margin:0 0 13px}.auth-intro{margin:6px 0 18px}
.methods{display:flex;flex-direction:column;padding:9px 12px 3px;background:var(--soft);border-radius:13px;margin:0 0 17px}.mode-label{font-size:15px;font-weight:750}.methods button{justify-content:flex-start;align-self:flex-start;padding:0}
.auth-content form{width:100%;min-width:0}.fields,.field{width:100%;min-width:0;display:flex;flex-direction:column;gap:6px}.fields{gap:13px}.field>text:first-child{font-size:14px;font-weight:720}.field input{height:46px;min-height:46px;padding:0 11px;border:1px solid var(--control);background:var(--card);border-radius:10px;font-size:15px;color:var(--ink);width:100%;min-width:0}.input-row{display:flex;width:100%;min-width:0;gap:8px;align-items:stretch}.form-links{display:flex;flex-flow:column wrap;align-items:flex-start;justify-content:center;margin-top:8px}.form-links .link{padding:0}.input-row input{width:0;flex:1 1 0%}.input-row .btn{flex:none;min-height:46px;white-space:nowrap}.code-row{flex-direction:column;align-items:stretch}.code-row input{width:100%;flex:none}.code-row .btn{align-self:flex-start}.password-row{position:relative;display:block}.password-row input{width:100%;padding-right:52px}.password-row .password-toggle{position:absolute;right:1px;top:1px;bottom:1px;width:44px;height:44px;min-height:44px;padding:0;background:transparent;border-radius:9px}.hint-code{margin-top:2px}.consent{display:flex;gap:7px;font-size:14px;line-height:1.5;color:var(--muted);align-items:flex-start;min-height:44px}.consent checkbox{flex:none}.consent text{flex:1;min-width:0;overflow-wrap:anywhere}.error{color:var(--error);font-size:14px}
@media(min-width:760px){.auth-content{margin-top:36px}}
</style>
