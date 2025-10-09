<template>
  <v-card class="h-100 overflow-hidden" elevation="2">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-5 pb-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">{{ titleLabel }}</h2>
        <p class="text-sm text-gray-500" v-if="isEditMode">
          Update product details, pricing, and imagery in a single place.
        </p>
        <p class="text-sm text-gray-500" v-else>
          Create a stunning product card with imagery, price, and category in minutes.
        </p>
      </div>
      <v-btn icon aria-label="Close" variant="text" color="grey" @click="handleClose">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-divider />

    <v-card-text class="p-5 max-h-[70vh] overflow-y-auto space-y-4">
      <!-- Success / Error Alerts -->
      <v-alert
        v-if="successMessage"
        type="success"
        class="rounded-xl"
        density="comfortable"
        closable
        @click:close="clearMessages"
      >
        {{ successMessage }}
      </v-alert>

      <v-alert
        v-if="errorMessage"
        type="error"
        class="rounded-xl"
        density="comfortable"
        closable
        @click:close="clearMessages"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- Form -->
      <v-form ref="formRef" @submit.prevent="handleSubmit" class="space-y-4">
        <v-text-field
          v-model="form.title"
          label="Product title"
          placeholder="E.g. Premium leather backpack"
          variant="outlined"
          :rules="[requiredRule]"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <v-text-field
            v-model.number="form.price"
            label="Price"
            type="number"
            min="0"
            step="0.01"
            prefix="$"
            variant="outlined"
            :rules="[requiredRule, positiveNumberRule]"
          />

          <v-text-field
            v-model.number="form.stock"
            label="Stock"
            type="number"
            min="0"
            step="1"
            variant="outlined"
            hint="Optional — keep track of inventory locally"
            persistent-hint
          />
        </div>

      
        <v-textarea
          v-model="form.description"
          label="Description"
          rows="3"
          auto-grow
          variant="outlined"
          :rules="[requiredRule]"
        />

        <!-- Drag & Drop Image Upload -->
        <div
          ref="dropzoneRef"
          class="relative border-2 border-dashed border-slate-300 rounded-2xl transition-all duration-200 cursor-pointer group"
          :class="{
            'border-primary bg-primary/5 shadow-inner': isOver,
           
          }"
          role="button"
          tabindex="0"
          @click="triggerFilePicker"
          @keydown.enter="triggerFilePicker"
          @keydown.space="triggerFilePicker"
        >
          <input
            ref="hiddenFileInput"
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onFileChange"
          />

          <div
            v-if="!previewUrl"
            class="flex flex-col items-center justify-center px-6 py-10 text-center text-slate-500 gap-3"
          >
            <v-icon size="40" color="primary">mdi-cloud-upload-outline</v-icon>
            <p class="text-base font-medium">Drag & drop product imagery</p>
            <p class="text-sm text-slate-400">
              High-resolution PNG or JPG up to 5&nbsp;MB.
            </p>
            <v-btn
              variant="tonal"
              color="primary"
              class="mt-1"
              @click.stop="triggerFilePicker"
            >
              Browse files
            </v-btn>
          </div>

          <div v-else class="relative overflow-hidden rounded-xl">
            <v-img :src="previewUrl" height="210" cover class="rounded-xl" />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-between p-3"
            >
              <span class="text-white text-sm font-medium">Image preview</span>
              <div class="flex items-center gap-2">
                
                <v-tooltip text="Remove" location="bottom">
                  <template #activator="{ props }">
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="white"
                      v-bind="props"
                      @click.stop.prevent="removeSelectedImage"
                    >
                      <v-icon size="20">mdi-close</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </div>
            </div>
          </div>
        </div>

       

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <v-btn variant="text" color="grey" @click="handleClose">Cancel</v-btn>
          <v-btn
            type="submit"
            color="primary"
            class="px-6"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            {{ submitLabel }}
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductStore } from '../../../Store/ProductStore'
import type { Product } from '../../../types'

interface CreateProductFormState {
  title: string
  price: number | null
  stock: number | null
  description: string
  image: string
}

const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'edit'
    product?: Product | null
  }>(),
  { mode: 'create', product: null },
)

const emit = defineEmits<{
  (e: 'created', product: Product): void
  (e: 'updated', product: Product): void
  (e: 'close'): void
}>()

const productStore = useProductStore()
const {
  creatingProduct,
  creationError,
  creationSuccess,
  updatingProducts,
} = storeToRefs(productStore)

const formRef = ref()
const imageFile = ref<File | null>(null)
const hiddenFileInput = ref<HTMLInputElement | null>(null)
const previewObjectUrl = ref<string | null>(null)
const dropzoneRef = ref<HTMLElement | null>(null)
const dropzoneCleanup = ref<(() => void) | null>(null)
const isOver = ref(false)
const updateSuccess = ref<string | null>(null)
const updateError = ref<string | null>(null)
const localError = ref<string | null>(null)

const form = reactive<CreateProductFormState>({
  title: '',
  price: null,
  stock: null,
  description: '',
  image: '',
})

const isEditMode = computed(() => props.mode === 'edit' && !!props.product)
const titleLabel = computed(() =>
  isEditMode.value ? 'Update Product' : 'Add New Product',
)
const submitLabel = computed(() =>
  isEditMode.value ? 'Save changes' : 'Add product',
)
const updateLoading = computed(() =>
  props.product ? !!updatingProducts.value?.[props.product.id] : false,
)
const isSubmitting = computed(() =>
  isEditMode.value ? updateLoading.value : creatingProduct.value,
)



const successMessage = computed(() =>
  isEditMode.value ? updateSuccess.value : creationSuccess.value,
)

const errorMessage = computed(() => {
  if (localError.value) return localError.value
  return isEditMode.value ? updateError.value : creationError.value
})

const requiredRule = (v: unknown) => (!!v ? true : 'This field is required.')
const positiveNumberRule = (v: number | null) =>
  typeof v === 'number' && v >= 0 ? true : 'Enter a valid positive value.'

const clearObjectUrl = () => {
  if (previewObjectUrl.value) {
    try {
      URL.revokeObjectURL(previewObjectUrl.value)
    } catch {}
    previewObjectUrl.value = null
  }
}

const resetForm = () => {
  form.title = ''
  form.price = null
  form.stock = null
  form.description = ''
  form.image = ''
  localError.value = null
  updateError.value = null
  updateSuccess.value = null
  imageFile.value = null
  clearObjectUrl()
  hiddenFileInput.value && (hiddenFileInput.value.value = '')
  productStore.clearCreationStatus()
}

const hydrateForm = (p: Product | null | undefined) => {
  if (!p) return resetForm()
  form.title = p.title
  form.price = p.price
  form.description = p.description
  form.image = p.images?.[0] ?? ''
  form.stock = p.stock ?? null
  clearObjectUrl()
}

watch(
  () => props.product,
  (p) => (isEditMode.value ? hydrateForm(p) : resetForm()),
  { immediate: true },
)
watch(
  () => props.mode,
  () => {
    if (props.mode === 'create') resetForm()
    else if (props.mode === 'edit') hydrateForm(props.product)
  },
)
watch(() => form.image, (v) => v && imageFile.value && (imageFile.value = null))

const MAX_FILE_SIZE = 5 * 1024 * 1024

const bindDropzone = (el: HTMLElement | null) => {
  dropzoneCleanup.value?.()
  if (!el) return
  const prevent = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const enter = (e: DragEvent) => (prevent(e), (isOver.value = true))
  const over = (e: DragEvent) => (prevent(e), (isOver.value = true))
  const leave = (e: DragEvent) => (prevent(e), (isOver.value = false))
  const drop = (e: DragEvent) => {
    prevent(e)
    isOver.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) setImageFile(file)
  }
  el.addEventListener('dragenter', enter)
  el.addEventListener('dragover', over)
  el.addEventListener('dragleave', leave)
  el.addEventListener('drop', drop)
  dropzoneCleanup.value = () => {
    el.removeEventListener('dragenter', enter)
    el.removeEventListener('dragover', over)
    el.removeEventListener('dragleave', leave)
    el.removeEventListener('drop', drop)
  }
}

const previewUrl = computed(() =>
  previewObjectUrl.value || form.image?.trim() || props.product?.images?.[0] || null,
)

const triggerFilePicker = () => hiddenFileInput.value?.click()
const onFileChange = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) setImageFile(f)
}
const setImageFile = (file: File) => {
  localError.value = null
  if (!file.type.startsWith('image/'))
    return (localError.value = 'Please choose an image file.')
  if (file.size > MAX_FILE_SIZE)
    return (localError.value = 'Image must be smaller than 5 MB.')
  clearObjectUrl()
  imageFile.value = file
  form.image = ''
  previewObjectUrl.value = URL.createObjectURL(file)
  hiddenFileInput.value && (hiddenFileInput.value.value = '')
}
const removeSelectedImage = () => {
  imageFile.value = null
  clearObjectUrl()
  form.image = ''
}


const buildImagesPayload = async () => {
  const imgs: string[] = []
  if (imageFile.value) {
    const uploaded = await productStore.uploadImage(imageFile.value)
    if (!uploaded) throw new Error('Image upload failed.')
    imgs.push(uploaded)
  } else if (form.image?.trim()) imgs.push(form.image.trim())
  else if (isEditMode.value && props.product?.images?.length)
    imgs.push(...props.product.images)
  return imgs
}

const handleSubmit = async () => {
  const res = formRef.value ? await formRef.value.validate() : { valid: true }
  if (!res.valid || form.price === null ) return
  localError.value = updateError.value = updateSuccess.value = null
  try {
    const imgs = await buildImagesPayload()
    if (!imgs.length && !isEditMode.value)
      return (localError.value = 'Please provide an image.')
    if (isEditMode.value && props.product) {
      const updated = await productStore.updateProduct(props.product.id, {
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        images: imgs,
      })
      updateSuccess.value = 'Product updated successfully.'
      emit('updated', updated)
    } else {
      const created = await productStore.createProduct({
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        images: imgs,
      })
      emit('created', created)
      resetForm()
    }
  } catch (err: any) {
    const msg = err?.message || 'Something went wrong.'
    isEditMode.value ? (updateError.value = msg) : (localError.value = msg)
  }
}

const clearMessages = () => {
  localError.value = updateError.value = updateSuccess.value = null
  productStore.clearCreationStatus()
}
const handleClose = () => {
  clearMessages()
  emit('close')
}

onMounted(() => {
  bindDropzone(dropzoneRef.value)
})
onBeforeUnmount(() => {
  clearObjectUrl()
  dropzoneCleanup.value?.()
  productStore.clearCreationStatus()
})
</script>
