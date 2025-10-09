<template>
  <div class="min-h-[70vh] flex flex-col items-center justify-center gap-6">
    <v-card class="max-w-2xl w-full shadow-lg rounded-2xl p-8 text-center">
      <h1 class="text-3xl font-semibold text-gray-800">
        Welcome back, {{ user?.name || 'Guest' }}
      </h1>
      <p class="text-gray-500 mt-3">
        You are now authenticated and ready to explore the e-commerce dashboard.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../Store/AuthStore';




const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
</script>