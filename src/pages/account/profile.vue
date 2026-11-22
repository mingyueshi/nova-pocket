<script setup>
import { computed, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AccountScreen from '../../components/AccountScreen.vue'
import { accountTarget, backFromAccountView, detailTab, showAccountTab } from '../../account-navigation.js'
import { account, authRoute, hint, state } from '../../state.js'
import { useLeaveConfirmation } from '../../use-leave-confirmation.js'

const tab = ref('home')
const initial = ref('')
const draft = ref('')
const error = ref('')
const saving = ref(false)
const guest = computed(() => state.mode === 'guest')

function loadDraft() {
  initial.value = state.mode === 'incomplete' ? '' : state.nickname
  draft.value = initial.value
}

onLoad(query => {
  tab.value = detailTab('profile', query?.tab)
  loadDraft()
})

watch(() => account.session.user?.id, () => {
  error.value = ''
  loadDraft()
})

const leave = useLeaveConfirmation(
  () => !guest.value && draft.value !== initial.value,
  '放弃未保存的资料？',
  '取消后可以继续编辑。',
)

function back() {
  return leave(() => backFromAccountView('profile', tab.value))
}

function selectTab(value) {
  return leave(() => showAccountTab(value))
}

async function save() {
  if (saving.value) return
  const name = draft.value.trim()
  const size = Array.from(name).length
  if (!size || size > 20) {
    error.value = '请输入 1–20 个字符的昵称。'
    return
  }

  saving.value = true
  try {
    await account.updateProfile({ nickname: name })
    initial.value = state.nickname
    draft.value = initial.value
    hint('资料已保存')
    return back()
  } catch (cause) {
    error.value = cause.message || '保存失败，请重试'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AccountScreen route="profile" :tab="tab" @back="back" @select-tab="selectTab">
    <template #profile>
      <view v-if="guest" class="panel">
        <text class="profile-title">请先登录账号</text>
        <button class="btn profile-action" @tap="authRoute('login', false, accountTarget('profile', '', tab))">去登录</button>
      </view>
      <view v-else class="panel profile">
        <text class="profile-title">展示昵称</text>
        <input v-model="draft" aria-label="展示昵称" maxlength="64" placeholder="昵称" @input="error=''" />
        <text v-if="error" class="error" role="alert">{{ error }}</text>
        <text class="note">请输入 1–20 个字符。不必填写真实资料。</text>
        <view class="profile-actions">
          <button class="btn primary" :disabled="saving" @tap="save">保存资料</button>
          <button class="btn" @tap="back">取消</button>
        </view>
      </view>
    </template>
  </AccountScreen>
</template>

<style scoped>
.profile-title{display:block;font-size:16px;font-weight:750}
.profile input{width:100%;min-width:0;margin:9px 0 6px;height:46px;min-height:46px;padding:0 11px;background:var(--canvas);border:1px solid var(--control);border-radius:10px}
.error{font-size:14px;color:var(--error)}
.profile-action,.profile-actions{margin-top:12px}
.profile-actions{display:flex;gap:10px;flex-direction:column}
.profile-actions button{width:100%}
@media(min-width:760px){.profile-actions button{width:fit-content;min-width:128px}}
</style>
