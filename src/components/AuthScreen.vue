<script setup>
import { computed, onUnmounted, ref } from 'vue'
import NovaIcon from './NovaIcon.vue'
import { accountHome, authRoute, hint, state } from '../state.js'
const props=defineProps({kind:{type:String,required:true}})
const method=ref('password'), account=ref(''), code=ref(''), password=ref(''), nickname=ref(''), agree=ref(false), visible=ref(false), dispatched=ref(false), seconds=ref(0), error=ref(''), busy=ref(false)
let timer, submitTimer
const register=computed(()=>props.kind==='register'), recover=computed(()=>props.kind==='recover')
const usesCode=computed(()=>register.value||recover.value||method.value==='code')
const title=computed(()=>register.value?'创建账号':recover.value?'找回密码':'欢迎回来')
const actionLabel=computed(()=>register.value?'创建演示账号':recover.value?'重置演示密码':'登录')
const tone=computed(()=>state.theme==='dark'?'light':'muted')
const emailOk=()=>/^[^\s@]+@example\.test$/i.test(account.value.trim())
function mockFields(){account.value='demo@example.test';nickname.value='新用户';password.value='NovaDemo2026';error.value=''}
function setMethod(v){method.value=v;error.value='';code.value=''}
function sendCode(){if(seconds.value)return;if(!emailOk()){error.value='请输入以 @example.test 结尾的虚构邮箱。';return}
 dispatched.value=true;seconds.value=30;error.value='';clearInterval(timer);timer=setInterval(()=>{if(--seconds.value<=0)clearInterval(timer)},1000);
}
function selectTerms(v){agree.value=v.detail.value.includes('yes')}
function submit(){
 if(busy.value)return
 error.value=''
 if(!emailOk()){error.value='请使用虚构邮箱，例如 demo@example.test。';return}
 if(usesCode.value&&(!dispatched.value||code.value.trim()!=='246810')){error.value='请先生成演示验证码，再输入 246810。';return}
 if((register.value||recover.value||method.value==='password')&&password.value.length<8){error.value='演示密码至少需要 8 个字符。';return}
 if(register.value&&(!nickname.value.trim()||Array.from(nickname.value.trim()).length>20)){error.value='请输入 1–20 个字符的虚构昵称。';return}
 if(register.value&&!agree.value){error.value='请先勾选同意演示说明。';return}
 busy.value=true
 submitTimer=setTimeout(()=>{
  busy.value=false;password.value='';code.value=''
  if(recover.value){hint('演示重置已完成');authRoute('login',true);return}
  if(register.value)state.nickname=nickname.value.trim()
  state.mode='member';hint(register.value?'演示账号已创建':'已登录演示账号');accountHome()
 },250)
}
onUnmounted(()=>{clearInterval(timer);clearTimeout(submitTimer);password.value='';code.value=''})
</script>
<template>
<view class="surface auth" :class="state.theme">
 <view class="auth-top"><button class="icon-button" aria-label="返回账户中心" @tap="accountHome"><NovaIcon name="chevron-left" :tone="tone" /></button><text class="brand-name">Nova Pocket</text></view>
 <view class="auth-content">
  <view class="auth-mark"><NovaIcon name="sparkles" tone="white" :size="26" /></view>
  <text class="title">{{title}}</text>
  <text class="note auth-intro">仅使用演示数据，不发送真实邮件或保存密码。</text>
  <view v-if="kind==='login'" class="methods" aria-label="登录方式">
   <text class="mode-label">{{method==='password'?'密码登录':'邮箱验证码登录'}}</text>
   <button class="link" @tap="setMethod(method==='password'?'code':'password')">{{method==='password'?'改用邮箱验证码':'改用密码登录'}}</button>
  </view>
  <form @submit="submit">
   <view class="fields">
    <view v-if="register" class="field"><text>昵称</text><input v-model="nickname" aria-label="昵称" placeholder="虚构昵称" maxlength="40" /></view>
    <view class="field"><text>演示邮箱</text><input v-model="account" aria-label="演示邮箱" placeholder="demo@example.test" maxlength="70" /></view>
    <view v-if="usesCode" class="field"><text>演示验证码</text><view class="input-row code-row"><input v-model="code" aria-label="演示验证码" type="number" maxlength="6" placeholder="6 位数字"/><button class="btn" :disabled="seconds>0" @tap="sendCode">{{seconds>0?seconds+' 秒':'生成验证码'}}</button></view><text v-if="dispatched" class="note hint-code" role="status">演示验证码：246810（未发送邮件）</text></view>
    <view v-if="register||recover||method==='password'" class="field"><text>{{recover?'新密码':'演示密码'}}</text><view class="input-row password-row"><input v-model="password" :password="!visible" aria-label="演示密码" placeholder="输入至少 8 个字符" maxlength="100" /><button class="btn password-toggle" :aria-label="visible?'隐藏密码':'显示密码'" @tap="visible=!visible"><NovaIcon :name="visible?'eye-off':'eye'" :tone="tone" /></button></view></view>
    <checkbox-group v-if="register" @change="selectTerms"><label class="consent"><checkbox value="yes" :checked="agree" color="#1d4ed8" /><text>同意仅使用虚构资料体验，不创建真实账号</text></label></checkbox-group>
    <text v-if="error" class="error" role="alert">{{error}}</text>
    <button class="btn primary" form-type="submit" :disabled="busy">{{busy?'处理中…':actionLabel}}</button>
   </view>
  </form>
  <view class="form-links">
   <button class="link" @tap="mockFields">填入演示资料</button>
   <button v-if="kind==='login'" class="link" @tap="authRoute('register',true)">注册</button>
   <button v-if="kind==='login'" class="link" @tap="authRoute('recover',true)">忘记密码</button>
   <button v-if="kind!=='login'" class="link" @tap="authRoute('login',true)">返回登录</button>
  </view>
 </view>
</view>
</template>
<style scoped>
.auth{min-height:100vh;min-height:100dvh;padding:0 20px max(20px,env(safe-area-inset-bottom))}
.auth-top{width:100%;max-width:440px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:calc(12px + env(safe-area-inset-top)) 0 10px}.brand-name{font-size:15px;font-weight:780}
.auth-content{width:100%;max-width:440px;margin:22px auto 0}.auth-mark{display:flex;align-items:center;justify-content:center;width:50px;height:50px;border-radius:15px;background:#1d4ed8;margin:0 0 13px}.auth-intro{margin:6px 0 18px}
.methods{display:flex;flex-direction:column;padding:9px 12px 3px;background:var(--soft);border-radius:13px;margin:0 0 17px}.mode-label{font-size:15px;font-weight:750}.methods button{justify-content:flex-start;align-self:flex-start;padding:0}
.auth-content form{width:100%;min-width:0}.fields,.field{width:100%;min-width:0;display:flex;flex-direction:column;gap:6px}.fields{gap:13px}.field>text:first-child{font-size:14px;font-weight:720}.field input{height:46px;min-height:46px;padding:0 11px;border:1px solid var(--control);background:var(--card);border-radius:10px;font-size:15px;color:var(--ink);width:100%;min-width:0}.input-row,.form-links{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.form-links{flex-direction:column;align-items:flex-start;gap:0}.form-links .link{padding:0}.input-row{width:100%;min-width:0;align-items:stretch;flex-wrap:nowrap}.input-row input{width:0;flex:1 1 0%}.input-row .btn{flex:none;min-height:46px;white-space:nowrap}.code-row{flex-direction:column;align-items:stretch}.code-row input{width:100%;flex:none}.code-row .btn{align-self:flex-start}.password-row{position:relative;display:block}.password-row input{width:100%;padding-right:52px}.password-row .password-toggle{position:absolute;right:1px;top:1px;bottom:1px;width:44px;height:44px;min-height:44px;padding:0;background:transparent;border-radius:9px}.hint-code{margin-top:2px}.form-links{justify-content:center;margin-top:8px}.consent{display:flex;gap:7px;font-size:14px;line-height:1.5;color:var(--muted);align-items:flex-start;min-height:44px}.consent checkbox{flex:none}.consent text{flex:1;min-width:0;overflow-wrap:anywhere}.error{color:var(--error);font-size:14px}
@media(min-width:760px){.auth-content{margin-top:36px}}
</style>
