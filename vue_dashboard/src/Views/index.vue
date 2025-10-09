<template>
  <v-container fluid class="dashboard-page py-10 px-4 md:px-10">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <!-- Header -->
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div class="space-y-1">
          <p class="text-sm font-medium uppercase tracking-[0.18em] text-primary">Dashboard</p>
          <h1 class="text-3xl font-semibold text-gray-900">All products</h1>
          <p class="text-sm text-gray-500">
            Upload, edit, and remove products from your shop.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <v-btn
            color="primary"
            class="rounded-full px-5"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Add product
          </v-btn>
         
        </div>
      </header>

      <!-- Product List -->
      <section>
        <ProductList
          @add="openCreateDialog"
          @edit="openEditDialog"
          @delete="requestDelete"
        />
      </section>
    </div>

    <!-- Add / Edit Dialog -->
    <v-dialog v-model="productDialog.open" max-width="720">
      <AddProductForm
        :mode="productDialog.mode"
        :product="productDialog.product"
        @close="closeProductDialog"
        @created="onProductCreated"
        @updated="onProductUpdated"
      />
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card class="rounded-2xl">
        <v-card-title class="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <v-icon color="error">mdi-trash-can</v-icon>
          Remove product
        </v-card-title>
        <v-card-text class="text-sm text-gray-600 space-y-2">
          <p>
            Are you sure you want to delete
            <span class="font-semibold text-gray-900">{{ productToDelete?.title }}</span>?
          </p>
          <p>This action cannot be undone and the product will disappear from your catalogue.</p>
        </v-card-text>
        <v-card-actions class="justify-end gap-3 px-6 pb-6">
          <v-btn variant="text" color="grey" @click="cancelDelete">Cancel</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deletingSelected"
            :disabled="deletingSelected"
            @click="confirmDelete"
          >
            Delete product
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import AddProductForm from '../components/dashboard/products/AddProductForm.vue'
import ProductList from '../components/dashboard/products/ProductList.vue'
import { useProductStore } from '../Store/ProductStore'
import type { Product } from '../types'
import { useNotifier } from '../compasables/useNotifier'


const productStore = useProductStore()
const notifier = useNotifier()

// Dialog State
const productDialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  product: null as Product | null,
})

// Delete Dialog State
const deleteDialogOpen = ref(false)
const productToDelete = ref<Product | null>(null)

// ─── CRUD Dialog Actions ──────────────────────────────────────────────
const openCreateDialog = () => {
  productDialog.mode = 'create'
  productDialog.product = null
  productDialog.open = true
}

const openEditDialog = (product: Product) => {
  productDialog.mode = 'edit'
  productDialog.product = product
  productDialog.open = true
}

const closeProductDialog = () => {
  productDialog.open = false
  setTimeout(() => {
    productDialog.product = null
  }, 200)
}

// ─── Product CRUD Feedback ────────────────────────────────────────────
const onProductCreated = (_product: Product) => {
  notifier.success('Product created successfully')
  closeProductDialog()
}

const onProductUpdated = (_product: Product) => {
  notifier.success('Product updated successfully')
  closeProductDialog()
}


// ─── Delete Handling ──────────────────────────────────────────────────
const requestDelete = (product: Product) => {
  productToDelete.value = product
  deleteDialogOpen.value = true
}

const cancelDelete = () => {
  deleteDialogOpen.value = false
  productToDelete.value = null
}

const deletingSelected = computed(() => {
  if (!productToDelete.value) return false
  return productStore.isDeletingProduct(productToDelete.value.id)
})

const confirmDelete = async () => {
  if (!productToDelete.value) return
  try {
    await productStore.deleteProduct(productToDelete.value.id)
    notifier.success('Product removed successfully')
    cancelDelete()
  } catch (error: any) {
    notifier.error(error?.message || 'Unable to delete product. Please try again.')
  }
}
</script>

<style scoped>
.dashboard-page {
  background-color: #f9fafb;
}
</style>
