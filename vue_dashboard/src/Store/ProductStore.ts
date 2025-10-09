import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '../plugins/axios'
import type { Category, CreateProductPayload, Product } from '../types'

const DEFAULT_IMAGE = 'https://images.pexels.com/photos/7156889/pexels-photo-7156889.jpeg'

export const useProductStore = defineStore('products', () => {
  const categories = ref<Category[]>([])
  const products = ref<Product[]>([])

  const loadingCategories = ref(false)
  const loadingProducts = ref(false)
  const creatingProduct = ref(false)

  const categoryError = ref<string | null>(null)
  const productError = ref<string | null>(null)
  const creationError = ref<string | null>(null)
  const creationSuccess = ref<string | null>(null)

  const hasCategories = computed(() => categories.value.length > 0)
  const hasProducts = computed(() => products.value.length > 0)

  const fetchCategories = async () => {
    if (loadingCategories.value) {
      return
    }

    loadingCategories.value = true
    categoryError.value = null
    try {
      const { data } = await api.get<Category[]>('/categories')
      categories.value = data
    } catch (error: any) {
      categoryError.value =
        error?.response?.data?.message || error?.message || 'Unable to load categories.'
    } finally {
      loadingCategories.value = false
    }
  }

  const fetchProducts = async (limit = 24) => {
    if (loadingProducts.value) {
      return
    }

    loadingProducts.value = true
    productError.value = null
    try {
      const { data } = await api.get<Product[]>(`/products?offset=0&limit=${limit}`)
      products.value = data
    } catch (error: any) {
      productError.value =
        error?.response?.data?.message || error?.message || 'Unable to load products.'
    } finally {
      loadingProducts.value = false
    }
  }

  const createProduct = async (payload: CreateProductPayload) => {
    creatingProduct.value = true
    creationError.value = null
    creationSuccess.value = null
    try {
      const body: CreateProductPayload = {
        ...payload,
        images: payload.images?.length ? payload.images : [DEFAULT_IMAGE],
      }

      const { data } = await api.post<Product>('/products', body)
      products.value = [data, ...products.value]
      creationSuccess.value = 'Product added successfully.'
      return data
    } catch (error: any) {
      creationError.value =
        error?.response?.data?.message || error?.message || 'Unable to create product.'
      throw error
    } finally {
      creatingProduct.value = false
    }
  }

  // Best-effort image upload helper: attempts to POST multipart/form-data to /files
  // Server must support this endpoint and return { url: string }
  const uploadImage = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post<{ url: string }>('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Expect backend to return { url }
      return data.url
    } catch (error: any) {
      throw error
    }
  }

  const clearCreationStatus = () => {
    creationError.value = null
    creationSuccess.value = null
  }

  return {
    categories,
    products,
    loadingCategories,
    loadingProducts,
    creatingProduct,
    categoryError,
    productError,
    creationError,
    creationSuccess,
    hasCategories,
    hasProducts,
    fetchCategories,
    fetchProducts,
    createProduct,
    uploadImage,
    clearCreationStatus,
  }
})