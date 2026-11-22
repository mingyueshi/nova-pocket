<script setup>
defineProps({name:{type:String,required:true},tone:{type:String,default:'muted'},size:{type:Number,default:21}})
</script>
<template><image class="nova-icon" mode="aspectFit" :src="'/static/icons/'+name+'-'+tone+'.svg'" :style="{width:size+'px',height:size+'px'}" aria-hidden="true" /></template>
<style>.nova-icon{display:inline-block;flex:none;vertical-align:middle}</style>
