<template>
  <header class="flex justify-between items-center px-8 py-4 bg-white shadow-md">
    <h1 class="text-xl font-semibold text-gray-800">Vueity Dashboard</h1>

    <nav class="flex gap-6">
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
    </nav>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
header {
  z-index: 10;
}
</style>
