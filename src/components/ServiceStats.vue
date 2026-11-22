<script setup>
import { computed, ref } from 'vue'
import NovaIcon from './NovaIcon.vue'
import { summarizeValues, trendLabels } from '../service-stats.js'
import { state } from '../state.js'
const spans=[['week','最近 7 天'],['month','最近 30 天']]
const data=[
 {title:'访问次数',unit:'次',short:[12,18,14,22,16,26,20],prior:[6,8,9,4,7,9,5,8,7,5,6,7,9,10,13,5,12,10,12,8,6,9,12],summary:'进入账户中心的次数'},
 {title:'完成事项',unit:'项',short:[2,4,2,6,3,5,4],prior:[1,2,0,2,1,2,1,2,2,0,3,1,2,1,0,2,3,3,2,3,1,2,3],summary:'标记完成的待办与服务事项'},
 {title:'收到通知',unit:'条',short:[1,3,0,2,4,1,2],prior:[0,0,1,1,0,2,1,1,0,1,2,1,0,1,0,2,0,1,1,0,1,2,1],summary:'账户、服务和安全类通知'}
]
const { week, month } = trendLabels()
const span = ref(0)
const metric = ref(0)
const selected = ref(null)
const curr = computed(() => data[metric.value])
const values = computed(() => {
  if (!span.value) return curr.value.short
  const days = [...curr.value.prior, ...curr.value.short]
  return month.map((_, index) => days.slice(index * 6, (index + 1) * 6).reduce((sum, day) => sum + day, 0))
})
const labels = computed(() => span.value ? month : week)
const summary = computed(() => summarizeValues(values.value))
const detail = computed(() => selected.value === null
  ? null
  : { label: labels.value[selected.value], val: values.value[selected.value] })
const tone = computed(() => state.theme === 'dark' ? 'light' : 'blue')

function setSpan(event) {
  span.value = Number(event.detail.value)
  selected.value = null
}

function setMetric(event) {
  metric.value = Number(event.detail.value)
  selected.value = null
}
</script>
<template>
<view class="stats">
 <view class="panel summary">
  <view class="stat-icon"><NovaIcon name="chart-no-axes-combined" :tone="tone" :size="23" /></view>
  <text class="metric">{{curr.title}}</text><text class="number">{{summary.total}}<text class="unit">{{curr.unit}}</text></text><text class="note">{{spans[span][1]}} · {{curr.summary}}</text>
 </view>
 <view class="picker-list">
  <picker :range="spans.map(x=>x[1])" :value="span" @change="setSpan"><view class="pick"><text>统计区间</text><text>{{spans[span][1]}}</text><NovaIcon name="chevron-right" :tone="tone" :size="15" /></view></picker>
  <picker :range="data.map(x=>x.title)" :value="metric" @change="setMetric"><view class="pick"><text>选择指标</text><text>{{curr.title}}</text><NovaIcon name="chevron-right" :tone="tone" :size="15" /></view></picker>
 </view>
 <view class="panel chart"><text class="metric">{{span?'按时间分段':'每日趋势'}}</text><text class="note chart-note">点任一条查看该时间段，图内以本区间最高值为比例。</text>
  <button v-for="(val,i) in values" :key="labels[i]" class="bar-row" role="button" tabindex="0" :aria-pressed="selected===i" :class="{selected:selected===i}" @tap="selected=i" @keydown.enter.prevent="selected=i" @keydown.space.prevent="selected=i">
   <text class="bar-label">{{labels[i]}}</text><view class="bar-track" aria-hidden="true"><view class="bar-fill" :style="{width:(val/summary.scale*100)+'%'}"></view></view><text class="bar-value">{{val}}</text>
  </button>
  <view class="chart-detail" role="status">
   <text v-if="detail">{{detail.label}} · {{detail.val}} {{curr.unit}}</text>
   <text v-else-if="summary.peak>=0">最高：{{labels[summary.peak]}} · {{summary.maximum}} {{curr.unit}}</text>
   <text v-else>当前区间暂无数据。</text>
  </view>
 </view>
 <text class="note source-note">日期随当天滚动，数据为示例。</text>
</view>
</template>
<style scoped>
.stats{display:flex;flex-direction:column;gap:15px}.summary{background:var(--card);border-left:3px solid var(--brand);padding:15px 18px}.stat-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:var(--soft);margin-bottom:7px}.metric,.number{display:block;font-weight:780}.metric{font-size:16px}.number{color:var(--brand);font-size:36px;line-height:1.25;font-variant-numeric:tabular-nums}.unit{color:var(--muted);font-size:14px;margin-left:6px}.picker-list{background:var(--card);border:1px solid var(--line);border-radius:15px;overflow:hidden}.pick{display:flex;min-height:52px;align-items:center;gap:8px;padding:9px 13px}.picker-list picker+picker .pick{border-top:1px solid var(--line)}.pick text:first-child{flex:1;min-width:0;font-weight:680}.pick text:nth-child(2){font-size:14px;color:var(--muted)}.chart{padding:14px 12px}.chart-note{margin:5px 0 7px}.bar-row{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;border-radius:9px;padding:0 6px;color:var(--ink);background:transparent;text-align:left}.bar-row.selected{background:var(--soft)}.bar-label{font-size:12px;flex:0 0 83px;white-space:nowrap;font-variant-numeric:tabular-nums}.bar-track{flex:1;min-width:0;height:10px;border-radius:100px;background:var(--line);overflow:hidden}.bar-fill{height:100%;background:var(--brand);border-radius:100px}.bar-value{flex:0 0 27px;text-align:right;font-size:13px;font-weight:760}.chart-detail{padding:9px 7px;color:var(--brand);font-size:14px;font-weight:740}.source-note{margin:0 2px}
</style>
