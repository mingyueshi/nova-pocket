<script setup>
import { computed, ref, watch } from 'vue'
import { iconSource } from '../icons.js'

const props = defineProps({
  name: { type: String, required: true },
  tone: { type: String, default: 'muted' },
  size: { type: Number, default: 21 },
})

const fallback = computed(() => iconSource('circle-help', props.tone))
const requested = computed(() => iconSource(props.name, props.tone))
const src = ref(requested.value)
const dimensions = computed(() => ({ width: props.size + 'px', height: props.size + 'px' }))

watch(requested, value => {
  src.value = value
})

function onError() {
  src.value = src.value === fallback.value ? '' : fallback.value
}
</script>

<template>
  <image v-if="src" :key="src" class="nova-icon" mode="aspectFit" :src="src"
    :style="dimensions" aria-hidden="true" @error="onError" />
  <view v-else class="nova-icon nova-icon-placeholder" :style="dimensions" aria-hidden="true">?</view>
</template>

<style>
.nova-icon{display:inline-block;flex:none;vertical-align:middle}
.nova-icon-placeholder{text-align:center;line-height:1;color:var(--muted)}
</style>
