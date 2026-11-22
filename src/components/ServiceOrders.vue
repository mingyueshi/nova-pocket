<script setup>
import { computed } from 'vue'
import { isDetail } from '../account-navigation.js'
import FilterTabs from './FilterTabs.vue'
import NovaIcon from './NovaIcon.vue'
import { findServiceOrder, serviceDemo, serviceOrders } from '../service-demo.js'

const props = defineProps({ view: { type: String, required: true }, id: String })
const emit = defineEmits(['navigate'])
const filterOptions = [['all', '全部'], ['active', '进行中'], ['complete', '已完成'], ['closed', '已关闭']]
const order = computed(() => findServiceOrder(props.id))
const orders = computed(() => serviceOrders.filter(item => serviceDemo.orderFilter === 'all' || item.status === serviceDemo.orderFilter))
function open(view, id) {
  emit('navigate', { view, id })
}
</script>

<template>
  <view v-if="view === 'orders'" class="np-stack">
    <text class="note">浏览实物、数字内容和服务的示例记录。</text>
    <FilterTabs :options="filterOptions" :value="serviceDemo.orderFilter" label="订单状态" @select="serviceDemo.orderFilter = $event" />
    <button v-for="item in orders" :key="item.id" class="service-card panel" @click="open('order', item.id)">
      <view class="service-card-head">
        <view class="service-glyph" aria-hidden="true">{{ item.glyph }}</view>
        <view class="np-grow">
          <text class="service-name">{{ item.title }}</text>
          <text class="note service-meta">{{ item.kind }} · {{ item.date }}</text>
        </view>
        <NovaIcon name="chevron-right" :size="16" />
      </view>
      <view class="service-card-foot">
        <text class="service-price">¥{{ item.amount }}</text>
        <text class="badge" :class="{ secondary: item.status === 'closed' }">{{ item.statusLabel }}</text>
      </view>
    </button>
    <view v-if="!orders.length" class="panel"><text class="note">这个状态暂没有示例订单。</text></view>
  </view>
  <view v-else-if="order" class="np-stack">
    <view class="panel np-stack">
      <text class="eyebrow">{{ order.kind }}订单</text>
      <text class="service-detail-name">{{ order.title }}</text>
      <view class="service-detail-meta"><text class="service-price">¥{{ order.amount }}</text><text class="badge">{{ order.statusLabel }}</text></view>
      <text class="note">{{ order.summary }}</text>
    </view>
    <view class="panel np-stack">
      <text class="service-name">订单进度</text>
      <view v-for="(label, index) in order.progress" :key="label" class="service-step" :class="{ last: index === order.progress.length - 1 }">
        <view class="service-dot" aria-hidden="true"></view><text>{{ label }}</text>
      </view>
    </view>
    <view class="panel np-stack">
      <view class="service-data"><text>订单编号</text><text>{{ order.id }}</text></view>
      <view class="service-data"><text>创建时间</text><text>{{ order.date }}</text></view>
      <text class="note">仅演示状态，不会付款、发货或预约服务。</text>
    </view>
    <!-- #ifndef POCKET_NO_REVIEWS -->
    <button v-if="order.status === 'complete' && isDetail('review')" class="btn primary" @click="open('review', order.id)">
      {{ serviceDemo.reviews[order.id] ? '查看我的评价' : '发表评价' }}
    </button>
    <!-- #endif -->
  </view>
  <view v-else class="panel"><text class="note">找不到这笔示例订单。请返回订单列表。</text></view>
</template>

<style scoped>
.service-card{display:flex;flex-direction:column;gap:12px;align-items:stretch;width:100%;text-align:left}
.service-card:active{background:var(--soft)}
.service-card-head,.service-card-foot,.service-detail-meta,.service-data{display:flex;align-items:center;justify-content:space-between;gap:10px}
.service-card-foot{flex-wrap:wrap;border-top:1px solid var(--line);padding-top:10px}
.service-name{display:block;font-size:16px;font-weight:740;overflow-wrap:anywhere}
.service-detail-name{overflow-wrap:anywhere;font-size:23px;font-weight:800;line-height:1.25}
.service-meta{font-size:13px;margin-top:2px}
.service-glyph{display:flex;align-items:center;justify-content:center;width:41px;height:41px;flex:none;border-radius:11px;background:var(--soft);color:var(--brand);font-weight:750}
.service-price{font-size:17px;font-weight:800;white-space:nowrap}
.service-card .secondary{background:var(--canvas);color:var(--muted)}
.service-step{display:flex;align-items:center;gap:9px;color:var(--muted);font-size:14px}
.service-step.last{color:var(--ink);font-weight:720}
.service-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--control)}
.service-step.last .service-dot{background:var(--brand)}
.service-data{font-size:14px;flex-wrap:wrap}
.service-data text:first-child{flex:none;color:var(--muted)}.service-data text:last-child{min-width:0;flex:1;text-align:right;overflow-wrap:anywhere}
</style>
