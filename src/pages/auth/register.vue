<script setup>
import AuthScreen from '../../components/AuthScreen.vue'
import { useAuthPage } from '../../use-auth-page.js'

const { setDirty, leaveAuth } = useAuthPage()
</script>

<template>
  <AuthScreen kind="register" @dirty="setDirty" @leave="leaveAuth" />
</template>
