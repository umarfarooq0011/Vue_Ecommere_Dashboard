<template>
  <v-card elevation="2" class="overflow-hidden">
    <!-- Header -->
    <div
      class="px-6 py-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
    >
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Category spotlight</h2>
          <p class="text-sm text-gray-500 mt-1">
            Track how your catalogue is distributed.
          </p>
        </div>
        <v-chip
          color="primary"
          variant="tonal"
          size="small"
          class="font-medium"
        >
          {{ categories.length }} total
        </v-chip>
      </div>
    </div>

    <v-divider />

    <!-- Category Content -->
    <v-card-text class="px-6 py-5 space-y-4">
      <div v-if="categoryError">
        <v-alert type="error" density="comfortable" class="rounded-xl">
          {{ categoryError }}
        </v-alert>
      </div>

      <!-- Loading State -->
      <div v-if="loadingCategories" class="grid gap-3">
        <v-skeleton-loader
          v-for="n in 4"
          :key="n"
          type="list-item"
          class="rounded-xl"
        />
      </div>

      <!-- Categories -->
      <template v-else>
        <div v-if="!hasCategories" class="text-gray-500 text-sm">
          Categories will appear here once they are created.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="category in displayedCategories"
            :key="category.id"
            class="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 hover:border-primary/40 transition-colors"
          >
            <div class="flex items-center gap-3">
              <v-avatar rounded size="44" class="ring-1 ring-slate-100">
                <v-img :src="category.image" :alt="category.name" cover />
              </v-avatar>
              <div>
                <p class="font-medium text-gray-900">{{ category.name }}</p>
                <p class="text-xs text-gray-500">
                  Updated {{ formatDate(category.updatedAt) }}
                </p>
              </div>
            </div>
            <v-chip
              size="small"
              color="primary"
              variant="tonal"
              class="font-medium"
            >
              Live
            </v-chip>
          </div>

          <div
            v-if="categories.length > displayedCategories.length"
            class="text-xs text-gray-500 text-center"
          >
            +{{ categories.length - displayedCategories.length }} more categories
          </div>
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

const displayedCategories = computed(() => categories.value.slice(0, 5))

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const formatDate = (value: string) => {
  try {
    return dateFormatter.format(new Date(value))
  } catch {
    return value
  }
}

onMounted(() => {
  if (!productStore.hasCategories) {
    productStore.fetchCategories()
  }
})
</script>
