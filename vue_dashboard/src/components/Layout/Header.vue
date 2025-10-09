<template>
  <header class="flex justify-between items-center px-8 py-4 bg-white shadow-md">
    <h1 class="text-xl font-semibold text-gray-800">Vueity Dashboard</h1>
      
    <nav class="flex gap-6 items-center">
      <template v-if="isAuthenticated">
        <span class="text-gray-700">Hi, {{ user?.name }}</span>
        <v-btn color="primary" variant="flat" size="small" @click="handleLogout">
          Logout
        </v-btn>
      </template>
      <template v-else>
        <RouterLink
          to="/login"
          class="text-gray-700 hover:text-blue-600 transition-colors"
        >
          Login
        </RouterLink>
        <RouterLink
          to="/register"
          class="text-gray-700 hover:text-blue-600 transition-colors"
        >
          Register
        </RouterLink>
      </template>
    
    </nav>
  </header>
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../Store/AuthStore'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}



</script>

<style scoped>
header {
  z-index: 10;
}
</style>
