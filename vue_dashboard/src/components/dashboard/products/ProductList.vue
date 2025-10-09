<template>
  <v-card elevation="2">
    <v-card-title class="flex items-center justify-between">
      <span class="text-h6 font-semibold">Products</span>
      <v-btn
        variant="text"
        color="primary"
        prepend-icon="mdi-refresh"
        @click="refresh"
        :loading="loadingProducts"
      >
        Refresh
      </v-btn>
    </v-card-title>
    <v-divider />

    <v-card-text>
      <div v-if="productError" class="mb-4">
        <v-alert type="error" density="comfortable">
          {{ productError }}
        </v-alert>
      </div>

      <div v-if="loadingProducts" class="grid gap-4 md:grid-cols-2">
        <v-skeleton-loader
          v-for="n in 4"
          :key="n"
          type="image, article"
        />
      </div>

      <template v-else>
        <div v-if="!hasProducts" class="py-10 text-center text-gray-500">
          No products found yet. Create one to see it listed here.
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <v-card
            v-for="product in products"
            :key="product.id"
            variant="outlined"
            class="h-full flex flex-col"
          >
            <v-img
              :src="product.images?.[0] || fallbackImage"
              height="160"
              cover
              class="rounded-t"
            />

            <v-card-text class="flex-1 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                  {{ product.title }}
                </h3>
                <span class="text-primary font-semibold">${{ product.price }}</span>
              </div>

              <p class="text-sm text-gray-600 two-line-clamp">
                {{ product.description }}
              </p>

              <v-chip
                size="small"
                color="primary"
                variant="tonal"
                class="self-start mt-2"
              >
                {{ product.category?.name || 'Uncategorised' }}
              </v-chip>
            </v-card-text>
          </v-card>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProductStore } from '../../../Store/ProductStore'


const productStore = useProductStore()

const products = computed(() => productStore.products)
const loadingProducts = computed(() => productStore.loadingProducts)
const productError = computed(() => productStore.productError)
const hasProducts = computed(() => productStore.hasProducts)

const fallbackImage =
  'https://images.pexels.com/photos/7156889/pexels-photo-7156889.jpeg?auto=compress&cs=tinysrgb&w=600'

const refresh = () => {
  productStore.fetchProducts()
}

onMounted(() => {
  if (!productStore.hasProducts) {
    productStore.fetchProducts()
  }
})
</script>

<style scoped>
.two-line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>