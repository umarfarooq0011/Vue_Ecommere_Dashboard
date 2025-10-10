<template>
  <div class="rounded-3xl border border-slate-200 bg-white shadow-sm">
    <!-- Header -->
    <div
      class="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div
        class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
      >
        <v-text-field
          v-model="searchTerm"
          placeholder="Search products"
          variant="solo"
          density="comfortable"
          hide-details
          clearable
          class="sm:max-w-xs"
        />
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">
            Showing
            <strong class="text-gray-700">
              {{ showingRange.start }} - {{ showingRange.end }}
            </strong>
            of {{ pagination.total }}
          </span>
          <v-select
            v-model="pageSizeModel"
            :items="pageSizeOptions"
            item-title="label"
            item-value="value"
            variant="solo"
            hide-details
            density="comfortable"
            class="w-32"
          />
        </div>
      </div>
    </div>

    <!-- Loading Bar -->
    <v-progress-linear
      v-if="loadingProducts"
      color="primary"
      indeterminate
      height="3"
    />

    <!-- Product Grid -->
    <div class="px-6 py-6">
      <div v-if="productError" class="mb-4">
        <v-alert type="error" density="comfortable" class="rounded-xl">
          {{ productError }}
        </v-alert>
      </div>

      <!-- Skeleton -->
      <div v-if="!isHydrated" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <v-skeleton-loader
          v-for="row in skeletonRows"
          :key="row"
          type="image, article"
          class="h-full rounded-2xl"
        />
      </div>

      <!-- Empty -->
      <template v-else>
        <div
          v-if="!products.length"
          class="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500"
        >
          >
          <h3 class="mb-1 text-lg font-semibold text-gray-800">
            No products to show yet
          </h3>
          <p class="mx-auto max-w-md text-sm text-gray-500">
            Create your first product to populate the catalogue and begin
            selling instantly.
          </p>
          <v-btn
            color="primary"
            variant="tonal"
            class="mt-4"
            @click="$emit('add')"
          >
            Create a product
          </v-btn>
        </div>

        <!-- Product Cards -->
        <div v-else class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="product in products"
            :key="product.id"
            class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <v-img
              :src="product.images?.[0] || fallbackImage"
              height="200"
              cover
              class="bg-slate-100"
            />
            <div class="flex flex-1 flex-col gap-3 px-5 py-5">
              <div class="flex-1 space-y-2">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ product.title }}
                </h3>
                <p class="text-sm text-gray-500 line-clamp-3">
                  {{ product.description }}
                </p>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-base font-semibold text-gray-900">
                  {{ formatCurrency(product.price) }}
                </span>
                <div class="flex items-center gap-2">
                  <v-btn
                    color="primary"
                    density="comfortable"
                    prepend-icon="mdi-pencil"
                    class="rounded-full px-4"
                    @click="$emit('edit', product)"
                  >
                    Edit
                  </v-btn>
                  <v-btn
                    color="error"
                    density="comfortable"
                    prepend-icon="mdi-trash-can"
                    class="rounded-full px-4"
                    :loading="isDeleting(product.id)"
                    :disabled="isDeleting(product.id)"
                    @click="$emit('delete', product)"
                  >
                    Delete
                  </v-btn>
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div
      v-if="isHydrated && totalPages > 1"
      class="flex flex-col gap-4 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-sm text-gray-500 ">
        Page {{ pagination.currentPage }} of {{ totalPages }}
      </p>
      <v-pagination
        :length="totalPages"
        :model-value="pagination.currentPage"
        :total-visible="5"
        @update:model-value="handlePageChange"
        rounded="circle"
        density="comfortable"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductStore } from '../../../Store/ProductStore'
import type { Product } from '../../../types'

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', product: Product): void
  (e: 'delete', product: Product): void
}>()

const productStore = useProductStore()
const { searchQuery } = storeToRefs(productStore)

const products = computed(() => productStore.products)
const loadingProducts = computed(() => productStore.loadingProducts)
const productError = computed(() => productStore.productError)
const isHydrated = computed(() => productStore.hasHydrated)
const pagination = computed(() => productStore.pagination)
const totalPages = computed(() => productStore.totalPages)
const skeletonRows = computed(() => productStore.skeletonRows)
const showingRange = computed(() => productStore.showingRange)

const searchTerm = ref(searchQuery.value)
const pageSizeModel = ref(productStore.pagination.pageSize)

const pageSizeOptions = [
  { label: '8 / page', value: 8 },
  { label: '12 / page', value: 12 },
  { label: '24 / page', value: 24 },
]

const fallbackImage =
  'https://images.pexels.com/photos/7156889/pexels-photo-7156889.jpeg?auto=compress&cs=tinysrgb&w=600'

const isDeleting = (id: number) => productStore.isDeletingProduct(id)

const handlePageChange = (page: number) => {
  productStore.goToPage(page)
}
  
const updatePageSize = (size: number) => {
  if (typeof size !== 'number') return
  productStore.setPageSize(size)
}

let searchDebounceHandle: ReturnType<typeof setTimeout> | null = null

watch(searchTerm, (value) => {
  // Debounce search input
  if (searchDebounceHandle) clearTimeout(searchDebounceHandle)
  searchDebounceHandle = setTimeout(() => {
    productStore.fetchProducts(1, {
      force: true,
      reloadTotal: true,
      search: value ?? '',
    })
  }, 400)
})
 // Sync searchQuery with local searchTerm
watch(searchQuery, (value) => {
  // If the searchQuery changes, update the local searchTerm
  if ((value ?? '') !== (searchTerm.value ?? '')) {
    searchTerm.value = value ?? ''
  }
})
// Sync pageSizeModel with store
watch(pageSizeModel, (size) => updatePageSize(size))



watch(
  () => productStore.pagination.pageSize,
  (size) => {
    // Keep local pageSizeModel in sync with store changes
    if (size !== pageSizeModel.value) {
      pageSizeModel.value = size
    }
  },
)

onMounted(() => {
  productStore.fetchProducts(1, { force: true, reloadTotal: true })
})

onBeforeUnmount(() => {
  if (searchDebounceHandle) clearTimeout(searchDebounceHandle)
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})
const formatCurrency = (value: number) => currencyFormatter.format(value)
</script>
