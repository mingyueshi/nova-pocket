<script setup>
import { computed, ref, watch } from 'vue'
import FilterTabs from './FilterTabs.vue'
import NovaIcon from './NovaIcon.vue'
import { findServiceOrder, serviceDemo, serviceOrders } from '../service-demo.js'

const props = defineProps({ view: { type: String, required: true }, id: String })
const emit = defineEmits(['navigate'])
const options = [['all', '全部'], ['pending', '待评价'], ['submitted', '已评价']]
const order = computed(() => findServiceOrder(props.id))
const saved = computed(() => order.value ? serviceDemo.reviews[order.value.id] : null)
const orders = computed(() => serviceOrders.filter(item => item.status === 'complete' &&
  (serviceDemo.reviewFilter === 'all' || (serviceDemo.reviewFilter === 'submitted') === Boolean(serviceDemo.reviews[item.id]))))
const stars = [1, 2, 3, 4, 5]
const commentLimit = 140
const rating = ref(0), content = ref(''), problem = ref(''), submitted = ref(false)
const count = computed(() => Array.from(content.value).length)
watch(() => [props.view, props.id, serviceDemo.reviews], () => {
  rating.value = 0
  content.value = ''
  problem.value = ''
  submitted.value = false
})
function choose(value) {
  rating.value = value
  problem.value = ''
}
function submit() {
  if (!order.value || order.value.status !== 'complete' || saved.value) return
  if (!rating.value) { problem.value = '请先选择评分。'; return }
  if (count.value > commentLimit) { problem.value = '评价不超过 140 个字符。'; return }
  const message = content.value.trim()
  serviceDemo.reviews[order.value.id] = { rating: rating.value, content: message, date: '刚刚' }
  content.value = ''
  rating.value = 0
  problem.value = ''
  submitted.value = true
}
function open(view, id) {
  emit('navigate', { view, id })
}
</script>

<template>
  <view v-if="view === 'reviews'" class="np-stack">
    <text class="note">已完成的示例订单可以评分和留言。</text>
    <FilterTabs :options="options" :value="serviceDemo.reviewFilter" label="评价状态" @select="serviceDemo.reviewFilter = $event" />
    <button v-for="item in orders" :key="item.id" class="panel review-card" @click="open('review', item.id)">
      <view class="review-card-main">
        <view class="review-mark"><NovaIcon name="sparkles" tone="blue" :size="19" /></view>
        <view class="np-grow">
          <text class="review-name">{{ item.title }}</text>
          <text class="note review-meta">{{ item.kind }} · {{ item.date }}</text>
        </view>
        <NovaIcon name="chevron-right" :size="16" />
      </view>
      <view class="review-card-foot">
        <text class="badge">{{ serviceDemo.reviews[item.id] ? '已评价' : '待评价' }}</text>
        <text v-if="serviceDemo.reviews[item.id]" class="review-score">{{ serviceDemo.reviews[item.id].rating }} / 5 星</text>
      </view>
    </button>
    <view v-if="!orders.length" class="panel"><text class="note">这个状态暂没有示例评价。</text></view>
  </view>
  <view v-else-if="order && order.status === 'complete'" class="np-stack">
    <view class="panel np-stack">
      <text class="eyebrow">{{ saved ? '已评价' : '发表评价' }}</text>
      <text class="review-name">{{ order.title }}</text>
      <text class="note">{{ order.kind }} · {{ order.id }}</text>
    </view>
    <view v-if="saved" class="panel np-stack">
      <text v-if="submitted" class="badge" role="status">示例评价已保存</text>
      <text class="review-score">{{ saved.rating }} / 5 星</text>
      <text class="note review-text">{{ saved.content || '未填写评语。' }}</text>
      <text class="note">{{ saved.date }} · 仅本次演示可见</text>
    </view>
    <view v-else class="panel np-stack">
      <text class="review-name">为本次体验评分</text>
      <view class="review-stars" role="group" aria-label="星级评分">
        <button v-for="value in stars" :key="value" class="review-star" :class="{ selected: value <= rating }"
          :aria-label="value + ' 星'" :aria-pressed="rating === value" @click="choose(value)">{{ value <= rating ? '★' : '☆' }}</button>
      </view>
      <text class="note" role="status">{{ rating ? '已选 ' + rating + ' / 5 星' : '请选择 1–5 星。' }}</text>
      <text class="review-field-label">评价内容（选填）</text>
      <textarea v-model="content" class="review-field" @input="problem=''" :maxlength="-1" placeholder="写下示例体验，不要填写真实个人信息" aria-label="评价内容" />
      <text class="note review-counter" :class="{ 'review-problem': count > commentLimit }">{{ count }} / {{ commentLimit }}</text>
      <text v-if="problem" class="review-problem" role="alert">{{ problem }}</text>
      <button class="btn primary" @click="submit">提交示例评价</button>
      <text class="note">模拟提交，不会公开。刷新页面后恢复示例。</text>
    </view>
  </view>
  <view v-else class="panel"><text class="note">这笔示例订单当前不可评价。请返回列表。</text></view>
</template>

<style scoped>
.review-card{display:flex;flex-direction:column;gap:12px;align-items:stretch;width:100%;text-align:left}
.review-card:active{background:var(--soft)}
.review-card-main,.review-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px}
.review-card-foot{flex-wrap:wrap;border-top:1px solid var(--line);padding-top:10px}
.review-mark{display:flex;align-items:center;justify-content:center;width:41px;height:41px;flex:none;border-radius:11px;background:var(--soft)}
.review-name{display:block;font-size:16px;font-weight:740;overflow-wrap:anywhere}
.review-meta{font-size:13px;margin-top:2px}
.review-score{font-weight:750;color:var(--brand);font-size:15px}
.review-text{white-space:pre-wrap;overflow-wrap:anywhere}
.review-stars{display:flex;flex-wrap:nowrap;gap:4px}
.review-star{flex:0 0 44px;display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:22px}
.review-star.selected{border-color:var(--brand);background:var(--soft);color:var(--brand)}
.review-field-label{font-size:14px;font-weight:670;padding-top:3px}
.review-field{box-sizing:border-box;width:100%;height:88px;padding:10px;border:1px solid var(--control);border-radius:10px;background:var(--canvas);color:var(--ink);font-family:inherit;font-size:14px;line-height:1.5}
.review-counter{text-align:right;font-size:12px}
.review-problem{font-size:14px;color:var(--error)}
</style>
