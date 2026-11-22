<script setup>
import AuthScreen from '../../components/AuthScreen.vue'
import { useAuthPage } from '../../use-auth-page.js'

const { setDirty, leaveAuth, openAuth } = useAuthPage()
</script>

<template>
  <AuthScreen kind="login" @open="openAuth" @dirty="setDirty" @leave="leaveAuth" />
</template>
