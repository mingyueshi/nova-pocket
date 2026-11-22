<script setup>
import { computed, ref, watch } from 'vue'
import NovaRow from './NovaRow.vue'
import StatePanel from './StatePanel.vue'
import { account, authRoute, state } from '../state.js'

const props = defineProps({ detail: Boolean, recordId: String, active: Boolean, tone: String })
defineEmits(['open'])
const { inbox, session } = account
const selected = computed(() => inbox.items.find(item => item.id === props.recordId))
const unread = computed(() => inbox.items.filter(item => !item.read))
const filtered = computed(() => state.messageFilter === 'unread' ? unread.value : inbox.items)
const readError = ref('')
const saving = ref(false)
let attempt = 0
async function mark(ids) {
  if (saving.value) return
  const request = ++attempt
  saving.value = true
  readError.value = ''
  try {
    await account.markRead(ids)
  } catch (error) {
    if (request === attempt) readError.value = error.message || '标记已读失败'
  } finally {
    if (request === attempt) saving.value = false
  }
}
watch(() => [props.active, props.detail, selected.value?.id, session.user?.id, inbox.status, state.scenario], () => {
  ++attempt
  saving.value = false
  readError.value = ''
  if (props.active && props.detail && state.scenario === 'normal' && inbox.status === 'ready' && selected.value && !selected.value.read) {
    mark([selected.value.id])
  }
}, { immediate: true })
function retry() {
  state.scenario = 'normal'
  return account.loadMessages()
}
</script>

<template>
  <StatePanel v-if="!session.user" title="登录后查看消息" action="去登录" @action="authRoute('login')" />
  <StatePanel v-else-if="state.scenario === 'error' || inbox.status === 'error'" title="暂时无法加载消息"
    :detail="inbox.error" action="重试" @action="retry" />
  <StatePanel v-else-if="inbox.status !== 'ready'" title="正在加载消息…" />
  <template v-else-if="detail">
    <view v-if="selected && state.scenario === 'normal'" class="panel np-stack">
      <text class="message-title">{{ selected.title }}</text><text class="note">{{ selected.body }}</text>
      <button v-if="readError" class="btn outline" @tap="mark([selected.id])">{{ readError }} · 重试</button>
    </view>
    <StatePanel v-else title="消息不存在" detail="请返回消息列表查看其他通知。" />
  </template>
  <StatePanel v-else-if="state.scenario === 'empty' || !inbox.items.length" title="暂时没有消息" detail="收到新的通知后，会显示在这里。" />
  <view v-else class="np-stack">
    <view class="message-tools"><text class="note">{{ unread.length ? unread.length + ' 条未读通知' : '所有通知已读' }}</text>
      <button class="btn outline" :aria-pressed="state.messageFilter === 'unread'"
        @tap="state.messageFilter = state.messageFilter === 'all' ? 'unread' : 'all'">{{ state.messageFilter === 'all' ? '只看未读' : '显示全部' }}</button>
    </view>
    <view v-if="filtered.length" class="message-rows">
      <NovaRow v-for="item in filtered" :key="item.id" icon="bell" :label="item.title" :tail="item.read ? '已读' : '未读'"
        :detail="item.date" :emphasis="!item.read" :tone="tone" @select="$emit('open', item.id)" />
    </view>
    <StatePanel v-else title="没有未读消息" />
    <text v-if="readError" role="alert" class="note">{{ readError }}</text>
    <button v-if="unread.length" class="link" :disabled="saving" @tap="mark(unread.map(item => item.id))">全部标为已读</button>
  </view>
</template>

<style scoped>
.message-tools{display:flex;flex-direction:column;gap:9px;align-items:flex-start}
.message-title{font-weight:750;font-size:16px}
.message-rows{border:1px solid var(--line);background:var(--card);border-radius:15px;overflow:hidden}
</style>
