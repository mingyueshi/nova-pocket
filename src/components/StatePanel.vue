<script setup>
defineProps({ title: String, detail: String, action: String })
defineEmits(['action'])
</script>
<template>
  <view class="panel np-stack" role="status">
    <text v-if="title" class="state-title">{{ title }}</text>
    <text v-if="detail" class="note">{{ detail }}</text>
    <button v-if="action" class="btn state-action" @tap="$emit('action')">{{ action }}</button>
  </view>
</template>
<style scoped>
.state-title{font-weight:750;font-size:16px}
.state-action{align-self:flex-start}
</style>
