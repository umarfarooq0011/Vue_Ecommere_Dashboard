<template>
  <v-card class="rounded-2xl" elevation="8">
    <v-card-text class="space-y-6">
      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <v-text-field
            v-model="form.title"
            label="Title"
            variant="outlined"
            :rules="[requiredRule]"
          />
          <v-text-field
            v-model="form.price"
            label="Price (USD)"
            type="number"
            min="0"
            step="0.01"
            variant="outlined"
            :rules="[requiredRule, positiveNumberRule]"
          />
          <v-text-field
            v-model="form.stock"
            label="Stock Quantity"
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
          :class="{ 'border-primary bg-primary/5 shadow-inner': isOver }"
          role="button"
          tabindex="0"
          @click="triggerFilePicker"
          @keydown.enter="triggerFilePicker"
          @keydown.space="triggerFilePicker"
        >
          <div
            v-if="!previewUrl"
            class="flex flex-col items-center justify-center px-6 py-10 text-center text-slate-500 gap-3"
          >
            <v-icon size="40" color="primary">mdi-cloud-upload-outline</v-icon>
            <p class="text-base font-medium">Drag & drop product imagery</p>
            <p class="text-sm text-slate-400">
              High-resolution PNG or JPG up to 5 MB.
            </p>
            <v-btn
              type="button"
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
              <v-btn
                color="error"
                type="button"
                size="small"
                @click.stop="removeSelectedImage"
              >
                Remove
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <v-btn type="button" color="grey" @click="handleClose">Cancel</v-btn>
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
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useDropZone, useFileDialog, useObjectUrl } from '@vueuse/core'
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

// Props and emits
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

// Store setup
const productStore = useProductStore()
const { creatingProduct } = storeToRefs(productStore)

// Refs
const formRef = ref()
const imageFile = ref<File | null>(null)
const previewObjectUrl = useObjectUrl(imageFile)
const dropzoneRef = ref<HTMLElement | null>(null)

const { open: openFileDialog, reset: resetFileDialog, onChange: onFileDialogChange } =
  useFileDialog({ accept: 'image/*', multiple: false })

// Form data
const form = reactive<CreateProductFormState>({
  title: '',
  price: null,
  stock: null,
  description: '',
  image: '',
})

// Computed helpers
const isEditMode = computed(() => props.mode === 'edit' && !!props.product)
const submitLabel = computed(() =>
  isEditMode.value ? 'Save changes' : 'Add product',
)
const updateLoading = computed(() =>
  props.product ? productStore.isUpdatingProduct(props.product.id) : false,
)
const isSubmitting = computed(() =>
  isEditMode.value ? updateLoading.value : creatingProduct.value,
)
const previewUrl = computed(
  () =>
    previewObjectUrl.value ||
    form.image?.trim() ||
    props.product?.images?.[0] ||
    null,
)

// Validation rules
const requiredRule = (v: unknown) => (!!v ? true : 'This field is required.')
const positiveNumberRule = (v: number | null) =>
  typeof v === 'number' && v >= 0 ? true : 'Enter a valid positive value.'

// Form utilities
const resetForm = () => {
  form.title = ''
  form.price = null
  form.stock = null
  form.description = ''
  form.image = ''
  imageFile.value = null
  resetFileDialog()
  productStore.clearCreationStatus()
}

const hydrateForm = (p: Product | null | undefined) => {
  if (!p) return resetForm()
  form.title = p.title
  form.price = p.price
  form.description = p.description
  form.image = p.images?.[0] ?? ''
  form.stock = p.stock ?? null
  imageFile.value = null
}

// Watchers
watch(
  [() => props.mode, () => props.product],
  ([mode, product]) => {
    if (mode === 'edit') hydrateForm(product)
    else resetForm()
  },
  { immediate: true },
)

// Image helpers
const MAX_FILE_SIZE = 5 * 1024 * 1024
const triggerFilePicker = () => openFileDialog()

const setImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) return
  if (file.size > MAX_FILE_SIZE) return
  imageFile.value = file
  form.image = ''
  resetFileDialog()
}

const removeSelectedImage = () => {
  imageFile.value = null
  form.image = ''
  resetFileDialog()
}

onFileDialogChange((files) => {
  const file = files?.item(0)
  if (file) setImageFile(file)
})

const { isOverDropZone: isOver } = useDropZone(dropzoneRef, {
  onDrop(files) {
    const file = files?.[0]
    if (file) setImageFile(file)
  },
})

// ...existing code...

// Upload and submit
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
  if (!res.valid || form.price === null) return
  try {
    const imgs = await buildImagesPayload()
    if (!imgs.length && !isEditMode.value) return
    if (isEditMode.value && props.product) {
      const updated = await productStore.updateProduct(props.product.id, {
        title: form.title.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        images: imgs,
      })
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
  } catch (err) {
    console.error(err)
  }
}

const handleClose = () => emit('close')

onBeforeUnmount(() => {
  productStore.clearCreationStatus()
})
</script>
