<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import NovaRow from './NovaRow.vue'
import StatePanel from './StatePanel.vue'
import { account, state } from '../state.js'

const props = defineProps({ detail: Boolean, recordId: String, active: Boolean, tone: String })
defineEmits(['open', 'login'])
const { inbox, session } = account
const selected = ref(null)
const detailStatus = ref('loading')
const detailError = ref('')
const readError = ref('')
const saving = ref(false)
const filtered = computed(() => state.messageFilter === 'unread' ? inbox.items.filter(item => !item.read) : inbox.items)
let visit = 0
onUnmounted(() => { ++visit })

async function mark(all) {
  if (saving.value) return
  const current = visit
  saving.value = true
  readError.value = ''
  try {
    if (all) await account.markAllRead()
    else await account.markRead([props.recordId])
  } catch (error) {
    if (current === visit) readError.value = error.message || '标记已读失败'
  } finally {
    if (current === visit) saving.value = false
  }
}

async function loadDetail() {
  const current = ++visit
  selected.value = null
  detailStatus.value = 'loading'
  detailError.value = ''
  readError.value = ''
  saving.value = false
  if (!props.detail || !props.active || !session.user || state.scenario !== 'normal') return
  try {
    const item = await account.getMessage(props.recordId)
    if (current !== visit) return
    selected.value = item
    detailStatus.value = 'ready'
    if (item && !item.read) await mark(false)
  } catch (error) {
    if (current !== visit) return
    if ((error.statusCode ?? error.status ?? error.response?.status) === 404) detailStatus.value = 'ready'
    else {
      detailStatus.value = 'error'
      detailError.value = error.message || '消息详情加载失败'
    }
  }
}

watch(() => [props.active, props.detail, props.recordId, session.version, state.scenario], loadDetail, { immediate: true })

function refresh() {
  state.scenario = 'normal'
  return account.loadMessages()
}
</script>

<template>
  <StatePanel v-if="!session.user" title="登录后查看消息" action="去登录" @action="$emit('login')" />
  <StatePanel v-else-if="state.scenario === 'error'" title="暂时无法加载消息" action="重试" @action="refresh" />
  <template v-else-if="detail">
    <StatePanel v-if="state.scenario === 'empty'" title="消息不存在" detail="请返回消息列表查看其他通知。" />
    <StatePanel v-else-if="detailStatus === 'loading'" title="正在加载消息…" />
    <StatePanel v-else-if="detailStatus === 'error'" title="暂时无法加载消息" :detail="detailError" action="重试" @action="loadDetail" />
    <view v-else-if="selected" class="panel np-stack">
      <text class="message-title">{{ selected.title }}</text><text class="note">{{ selected.body }}</text>
      <text v-if="readError" role="alert" class="note">{{ readError }}</text>
      <button v-if="readError" class="btn outline" :disabled="saving" @tap="mark(false)">重试标记已读</button>
    </view>
    <StatePanel v-else title="消息不存在" detail="请返回消息列表查看其他通知。" />
  </template>
  <StatePanel v-else-if="inbox.status === 'error'" title="暂时无法加载消息" :detail="inbox.error" action="重试" @action="refresh" />
  <StatePanel v-else-if="inbox.status !== 'ready'" title="正在加载消息…" />
  <StatePanel v-else-if="state.scenario === 'empty' || (!inbox.items.length && !inbox.nextCursor)"
    title="暂时没有消息" action="刷新" @action="refresh" />
  <view v-else class="np-stack">
    <view class="message-tools"><text class="note">{{ inbox.unreadCount ? inbox.unreadCount + ' 条未读通知' : '所有通知已读' }}</text>
      <button class="btn outline" :aria-pressed="state.messageFilter === 'unread'"
        @tap="state.messageFilter = state.messageFilter === 'all' ? 'unread' : 'all'">{{ state.messageFilter === 'all' ? '只看未读' : '显示全部' }}</button>
      <button class="link" @tap="refresh">刷新</button>
    </view>
    <view v-if="filtered.length" class="message-rows">
      <NovaRow v-for="item in filtered" :key="item.id" icon="bell" :label="item.title" :tail="item.read ? '已读' : '未读'"
        :detail="item.date" :emphasis="!item.read" :tone="tone" @select="$emit('open', item.id)" />
    </view>
    <StatePanel v-else :title="inbox.nextCursor && inbox.unreadCount ? '当前页没有未读消息' : '没有未读消息'" />
    <text v-if="inbox.moreError" role="alert" class="note">{{ inbox.moreError }}</text>
    <button role="button" v-if="inbox.nextCursor" class="btn outline" :disabled="inbox.moreStatus === 'loading'" @tap="account.loadMessages(true)">
      {{ inbox.moreStatus === 'loading' ? '正在加载…' : inbox.moreStatus === 'error' ? '重试加载下一页' : '加载更多' }}
    </button>
    <text v-if="readError" role="alert" class="note">{{ readError }}</text>
    <button v-if="inbox.unreadCount" class="link" :disabled="saving" @tap="mark(true)">{{ readError ? '重试全部标为已读' : '全部标为已读' }}</button>
  </view>
</template>

<style scoped>
.message-tools{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.message-tools .note{flex-basis:100%}
.message-title{font-weight:750;font-size:16px}
.message-rows{border:1px solid var(--line);background:var(--card);border-radius:15px;overflow:hidden}
</style>
