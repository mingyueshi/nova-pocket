<script setup>
import NovaIcon from './NovaIcon.vue'
defineProps({icon:{type:String,required:true},label:{type:String,required:true},detail:String,tail:String,tone:{type:String,default:'muted'},emphasis:{type:Boolean,default:false}})
defineEmits(['select'])
</script>
<template>
<button class="row" :class="{'unread':emphasis}" role="button" tabindex="0" @tap="$emit('select')" @keydown.enter.prevent="$emit('select')" @keydown.space.prevent="$emit('select')">
 <view class="row-icon"><NovaIcon :name="icon" :tone="tone" :size="18" /></view>
 <view class="row-content"><text class="row-label">{{label}}</text><text v-if="detail" class="row-detail">{{detail}}</text></view>
 <view v-if="tail" class="row-tail" :class="{'fresh':emphasis}"><text>{{tail}}</text></view>
 <NovaIcon name="chevron-right" :tone="tone" :size="15" />
</button>
</template>
<style scoped>
.row{display:flex;align-items:center;text-align:left;width:100%;gap:11px;min-height:58px;padding:10px 13px;color:var(--ink);background:var(--card);border-radius:0;border-bottom:1px solid var(--line)}
.row:last-child{border-bottom:0}.row:focus-visible{outline-offset:-3px}.row:active{background:var(--soft)}
.row-icon{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:11px;background:var(--soft);flex:none}
.row-content{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.row-label{font-size:15px;font-weight:690;line-height:1.35;overflow-wrap:anywhere}
.row-detail{font-size:13px;line-height:1.38;color:var(--muted);overflow-wrap:anywhere}.row-tail{max-width:30%;overflow-wrap:anywhere;font-size:12px;color:var(--muted);text-align:right;flex:none}.row-tail.fresh{color:var(--brand);background:var(--soft);padding:3px 7px;border-radius:7px;font-weight:730}
</style>
