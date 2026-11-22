<script setup>
import { onLoad } from '@dcloudio/uni-app'
import AccountScreen from '../../components/AccountScreen.vue'
import { detailTab, rootTab, showAccountTab } from '../../account-navigation.js'

onLoad(query => {
  rootTab.value = detailTab('home', query?.tab)
})
</script>

<template>
  <AccountScreen :route="rootTab" :tab="rootTab" @select-tab="showAccountTab" />
</template>
