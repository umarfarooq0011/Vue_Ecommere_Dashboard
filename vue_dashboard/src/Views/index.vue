<template>
  <v-container class="py-8" fluid>
    <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="welcome-card">
          <v-card-text>
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl font-semibold text-gray-800">
                  Welcome back, {{ user?.name || 'Guest' }}
                </h1>
                <p class="text-gray-600 mt-1">
                  Manage your catalogue, keep an eye on categories, and add fresh products in
                  seconds.
                </p>
              </div>
              <div class="flex items-center gap-3">
                <v-btn color="primary" variant="tonal" @click="openAddDialog">
                  Add Product
                </v-btn>
                <v-avatar size="56">
                  <v-img :src="userAvatar" :alt="user?.name ?? 'Account avatar'" />
                </v-avatar>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4" align="stretch" dense>
      <v-col cols="12" lg="4">
        <!-- Moved into a dialog; kept a small placeholder in the sidebar -->
        <CategoryOverview />
      </v-col>
      <v-col cols="12" lg="8">
        <CategoryOverview />
        <ProductList />
      </v-col>
    </v-row>
    
    <v-dialog v-model="addDialog" width="720">
      <AddProductForm @created="onProductCreated" />
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../Store/AuthStore'
import AddProductForm from '../components/dashboard/products/AddProductForm.vue'
import ProductList from '../components/dashboard/products/ProductList.vue'
import CategoryOverview from '../components/dashboard/products/CategoryOverview.vue'
import { ref } from 'vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const userAvatar = computed(
  () =>
    user.value?.avatar ||
    `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(
      user.value?.name || 'User',
    )}`,
)

const addDialog = ref(false)

const openAddDialog = () => {
  addDialog.value = true
}

const onProductCreated = (product: any) => {
  addDialog.value = false
  // refresh product list
  // import store lazily to avoid cycles
  import('../Store/ProductStore').then((m) => {
    const store = m.useProductStore()
    store.fetchProducts()
  })
}
</script>

<style scoped>
.welcome-card {
  border-radius: 18px;
}
</style>
