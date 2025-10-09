<template>
  <v-card elevation="2" class="mb-6">
    <v-card-title class="text-h6 font-semibold">Categories</v-card-title>
    <v-divider />
    <v-card-text>
      <div v-if="categoryError" class="mb-4">
        <v-alert type="error" density="comfortable">
          {{ categoryError }}
        </v-alert>
      </div>

      <div v-if="loadingCategories" class="flex gap-2 flex-wrap">
        <v-skeleton-loader type="chip" v-for="n in 6" :key="n" />
      </div>

      <template v-else>
        <div v-if="!hasCategories" class="text-gray-500">
          Categories will appear here once they are created.
        </div>

        <div v-else class="flex flex-wrap gap-2">
          <v-chip
            v-for="category in categories"
            :key="category.id"
            variant="tonal"
            color="primary"
          >
            {{ category.name }}
          </v-chip>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProductStore } from '../../../Store/ProductStore'

const productStore = useProductStore()

const categories = computed(() => productStore.categories)
const loadingCategories = computed(() => productStore.loadingCategories)
const hasCategories = computed(() => productStore.hasCategories)
const categoryError = computed(() => productStore.categoryError)

onMounted(() => {
  if (!productStore.hasCategories) {
    productStore.fetchCategories()
  }
})
</script>