import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import api from '../plugins/axios'
import type {
  Category,
  CreateProductPayload,
  Product,
  UpdateProductPayload,
} from '../types'

const DEFAULT_IMAGE =
  'https://images.pexels.com/photos/7156889/pexels-photo-7156889.jpeg?auto=compress&cs=tinysrgb&w=800'
const DEFAULT_CATEGORY_ID = 1

interface PaginationState {
  currentPage: number
  pageSize: number
  total: number
}

export const useProductStore = defineStore('products', () => {
  // ─── STATE ──────────────────────────────────────────────────────
  const categories = ref<Category[]>([])
  const products = ref<Product[]>([])

  const loadingCategories = ref(false)
  const loadingProducts = ref(false)
  const creatingProduct = ref(false)

  const categoryError = ref<string | null>(null)
  const productError = ref<string | null>(null)
  const creationError = ref<string | null>(null)
  const creationSuccess = ref<string | null>(null)

  const pagination = reactive<PaginationState>({
    currentPage: 1,
    pageSize: 8,
    total: 0,
  })

  const searchQuery = ref('')
  const hasHydrated = ref(false)
  const totalLoadedForQuery = ref<string | null>(null)

  const deletingProducts = ref<Record<number, boolean>>({})
  const updatingProducts = ref<Record<number, boolean>>({})

  // ─── COMPUTED ───────────────────────────────────────────────────
  const hasCategories = computed(() => categories.value.length > 0)
  const hasProducts = computed(() => products.value.length > 0)
  const totalPages = computed(() =>
    pagination.pageSize > 0
      ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
      : 1,
  )
  const hasPreviousPage = computed(() => pagination.currentPage > 1)
  const hasNextPage = computed(() => pagination.currentPage < totalPages.value)
  const skeletonRows = computed(() => pagination.pageSize)
  const showingRange = computed(() => {
    if (!products.value.length) return { start: 0, end: 0 }
    const start = (pagination.currentPage - 1) * pagination.pageSize + 1
    const end = start + products.value.length - 1
    return { start, end }
  })

  // ─── FETCH CATEGORIES ────────────────────────────────────────────
  const fetchCategories = async () => {
    if (loadingCategories.value) return

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

  // ─── TOTAL COUNT FOR SEARCH ─────────────────────────────────────
  const fetchTotalForQuery = async (query: string) => {
    try {
      const params = new URLSearchParams()
      if (query) params.set('title', query)
      const path = params.toString() ? `/products?${params.toString()}` : '/products'
      const { data } = await api.get<Product[]>(path)
      return data.length
    } catch (error) {
      console.warn('Unable to resolve total products for query', error)
      return pagination.total
    }
  }

  // ─── FETCH PRODUCTS ──────────────────────────────────────────────
  const fetchProducts = async (
    page = pagination.currentPage,
    options: { force?: boolean; reloadTotal?: boolean; search?: string } = {},
  ) => {
    const { force = false, reloadTotal = false, search } = options
    if (loadingProducts.value && !force) return

    if (typeof search === 'string') {
      const trimmed = search.trim()
      if (trimmed !== searchQuery.value) totalLoadedForQuery.value = null
      searchQuery.value = trimmed
    }

    loadingProducts.value = true
    productError.value = null

    try {
      const offset = Math.max((page - 1) * pagination.pageSize, 0)
      const params = new URLSearchParams()
      params.set('offset', String(offset))
      params.set('limit', String(pagination.pageSize))
      if (searchQuery.value) params.set('title', searchQuery.value)

      const { data } = await api.get<Product[]>(`/products?${params.toString()}`)
      products.value = data
      pagination.currentPage = page

      const shouldRefreshTotal =
        reloadTotal ||
        !hasHydrated.value ||
        totalLoadedForQuery.value !== searchQuery.value

      if (shouldRefreshTotal) {
        pagination.total = await fetchTotalForQuery(searchQuery.value)
        totalLoadedForQuery.value = searchQuery.value
      } else if (data.length < pagination.pageSize) {
        pagination.total = offset + data.length
      } else if (pagination.total < offset + data.length) {
        pagination.total = offset + data.length
      }

      hasHydrated.value = true
    } catch (error: any) {
      productError.value =
        error?.response?.data?.message || error?.message || 'Unable to load products.'
      if (!hasHydrated.value) products.value = []
      throw error
    } finally {
      loadingProducts.value = false
    }
  }

  // ─── PAGINATION HELPERS ──────────────────────────────────────────
  const setPageSize = async (size: number) => {
    if (size === pagination.pageSize) return
    pagination.pageSize = size
    pagination.currentPage = 1
    await fetchProducts(1, { force: true, reloadTotal: true })
  }

  const goToPage = async (page: number) => {
    const target = Math.min(Math.max(page, 1), totalPages.value)
    await fetchProducts(target, { force: true })
  }

  // ─── CREATE PRODUCT ──────────────────────────────────────────────
  const createProduct = async (payload: CreateProductPayload) => {
    creatingProduct.value = true
    creationError.value = null
    creationSuccess.value = null
    try {
      const images = payload.images?.length ? payload.images : [DEFAULT_IMAGE]
      const body: CreateProductPayload = {
        ...payload,
        categoryId: payload.categoryId ?? DEFAULT_CATEGORY_ID,
        images,
      }

      const { data } = await api.post<Product>('/products', body)
      const createdProduct: Product = { ...data, images }

      // Refresh and keep first-page display synced
      pagination.currentPage = 1
      totalLoadedForQuery.value = null
      await fetchProducts(1, { force: true, reloadTotal: true })

      const existingIndex = products.value.findIndex(
        (product) => product.id === createdProduct.id,
      )

      if (existingIndex !== -1) {
        products.value.splice(existingIndex, 1, createdProduct)
      } else if (pagination.currentPage === 1) {
        products.value = [createdProduct, ...products.value]
        if (products.value.length > pagination.pageSize) {
          products.value = products.value.slice(0, pagination.pageSize)
        }
      }

      creationSuccess.value = 'Product added successfully.'
      return createdProduct
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Unable to create product.'
      creationError.value = message
      throw new Error(message)
    } finally {
      creatingProduct.value = false
    }
  }

  // ─── UPDATE PRODUCT ──────────────────────────────────────────────
  const updateProduct = async (id: number, payload: UpdateProductPayload) => {
    updatingProducts.value = { ...updatingProducts.value, [id]: true }
    try {
      const body: UpdateProductPayload = { ...payload }
      if (body.images && body.images.length === 0) delete body.images

      const { data } = await api.put<Product>(`/products/${id}`, body)
      const index = products.value.findIndex((product) => product.id === id)
      if (index !== -1) products.value.splice(index, 1, data)
      return data
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Unable to update product.'
      throw new Error(message)
    } finally {
      const { [id]: _omit, ...rest } = updatingProducts.value
      updatingProducts.value = rest
    }
  }

  // ─── DELETE PRODUCT ──────────────────────────────────────────────
  const deleteProduct = async (id: number) => {
    deletingProducts.value = { ...deletingProducts.value, [id]: true }
    try {
      await api.delete(`/products/${id}`)
      products.value = products.value.filter((product) => product.id !== id)
      pagination.total = Math.max(pagination.total - 1, 0)
      totalLoadedForQuery.value = null

      if (!products.value.length && pagination.currentPage > 1) {
        await goToPage(pagination.currentPage - 1)
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Unable to delete product.'
      throw new Error(message)
    } finally {
      const { [id]: _omit, ...rest } = deletingProducts.value
      deletingProducts.value = rest
    }
  }

  // ─── IMAGE UPLOAD ────────────────────────────────────────────────
  const uploadImage = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post<{
        originalname?: string
        filename?: string
        url?: string
        location?: string
      }>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const uploadedUrl = data.location || data.url
      if (!uploadedUrl) throw new Error('Image upload failed: missing URL.')

      return uploadedUrl
    } catch (error: any) {
      throw error
    }
  }

  // ─── HELPERS ────────────────────────────────────────────────────
  const clearCreationStatus = () => {
    creationError.value = null
    creationSuccess.value = null
  }

  const isDeletingProduct = (id: number) => deletingProducts.value[id] === true
  const isUpdatingProduct = (id: number) => updatingProducts.value[id] === true

  // ─── EXPORT ─────────────────────────────────────────────────────
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
    pagination,
    searchQuery,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    skeletonRows,
    showingRange,
    hasHydrated,
    deletingProducts,
    updatingProducts,
    fetchCategories,
    fetchProducts,
    setPageSize,
    goToPage,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
    clearCreationStatus,
    isDeletingProduct,
    isUpdatingProduct,
  }
})
