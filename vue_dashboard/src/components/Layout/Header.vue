<template>
  <header class="flex justify-between items-center px-8 py-4 bg-white shadow-md">
    <h1 class="text-xl font-semibold text-gray-800">Vueity Dashboard</h1>

    <nav class="flex gap-6 items-center">
      <template v-if="isAuthenticated">
        <RouterLink
          v-for="link in navigationLinks"
          :key="link.name"
          :to="link.to"
          class="text-gray-600"
          :class="{ 'text-blue-600 font-medium': isRouteActive(link.name) }"
        >
          {{ link.label }}
        </RouterLink>

        <v-menu location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" class="!px-2" variant="text" color="primary">
              <v-avatar size="36">
                <v-img :src="userAvatar" :alt="user?.name ?? 'Account'" />
              </v-avatar>
              <span class="ml-1 text-gray-500 text-sm">▼</span>
            </v-btn>
          </template>

          <v-list min-width="220">
            <v-list-item>
              <div class="flex flex-col">
                <span class="font-semibold text-gray-800">{{ user?.name }}</span>
                <span class="text-sm text-gray-500">{{ user?.email }}</span>
              </div>
            </v-list-item>

            <v-divider />

            <v-list-item @click="handleLogout">
              <v-list-item-title class="text-red-500">Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
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
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw, RouteRecordName } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../Store/AuthStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const navigationLinks: Array<{
  name: RouteRecordName
  to: RouteLocationRaw
  label: string
}> = [
  { name: 'dashboard', to: { name: 'dashboard' }, label: 'Home' },
]

const userAvatar = computed(
  () =>
    user.value?.avatar ||
    `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(
      user.value?.name || 'User',
    )}`,
)

const isRouteActive = (name: RouteRecordName) => route.name === name

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
