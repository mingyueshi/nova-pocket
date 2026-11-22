<script setup>
defineProps({
  options: { type: Array, required: true },
  value: { type: String, required: true },
  label: { type: String, required: true },
})
defineEmits(['select'])
</script>

<template>
  <view class="filter-tabs" role="group" :aria-label="label">
    <button v-for="option in options" :key="option[0]" class="filter-choice"
      :class="{ chosen: value === option[0] }" :aria-pressed="value === option[0]"
      @tap="$emit('select', option[0])">{{ option[1] }}</button>
  </view>
</template>

<style scoped>
.filter-tabs{display:grid;grid-auto-columns:minmax(0,1fr);grid-auto-flow:column;gap:7px}
.filter-tabs .filter-choice{display:flex;align-items:center;justify-content:center;width:100%;min-width:0;min-height:44px;padding:6px;line-height:1.4;border-radius:10px;background:var(--card);border:1px solid var(--line);color:var(--muted);font-size:13px;font-weight:650}
.filter-choice.chosen{background:var(--soft);border-color:var(--brand);color:var(--brand)}
</style>
