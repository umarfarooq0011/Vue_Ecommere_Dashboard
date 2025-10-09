<template>
  <v-card class="h-100" elevation="2">
    <div class="flex items-center justify-between px-4 pt-4">
      <div class="text-h6 font-semibold">Add New Product</div>
      <v-btn icon aria-label="Close" @click="emitClose">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
    <v-divider />

    <v-card-text class="p-4 max-h-[70vh] overflow-y-auto">
      <v-alert
        v-if="creationSuccess"
        type="success"
        class="mb-4"
        density="comfortable"
        closable
        @click:close="clearCreationStatus"
      >
        {{ creationSuccess }}
      </v-alert>

      <v-alert
        v-if="creationError"
        type="error"
        class="mb-4"
        density="comfortable"
        closable
        @click:close="clearCreationStatus"
      >
        {{ creationError }}
      </v-alert>

      <v-alert
        v-if="localError"
        type="error"
        class="mb-4"
        density="comfortable"
        closable
        @click:close="() => (localError = null)"
      >
        {{ localError }}
      </v-alert>

      <v-form @submit.prevent="handleSubmit" ref="formRef">
        <v-text-field
          v-model="form.title"
          label="Product title"
          placeholder="E.g. Premium leather backpack"
          variant="outlined"
          :rules="[requiredRule]"
          class="mb-4"
        />

        <v-text-field
          v-model.number="form.price"
          label="Price"
          type="number"
          min="0"
          step="0.01"
          prefix="$"
          variant="outlined"
          :rules="[requiredRule, positiveNumberRule]"
          class="mb-4"
        />

        <v-text-field
          v-model.number="form.stock"
          label="Stock"
          type="number"
          min="0"
          step="1"
          variant="outlined"
          :rules="[requiredRule]"
          class="mb-4"
        />

        <v-select
          v-model="form.categoryId"
          label="Category"
          :items="categoryOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          :loading="loadingCategories"
          :rules="[requiredRule]"
          class="mb-4"
          no-data-text="No categories found"
        />

        <v-textarea
          v-model="form.description"
          label="Description"
          rows="3"
          auto-grow
          variant="outlined"
          :rules="[requiredRule]"
          class="mb-4"
        />

        <!-- Custom drag-and-drop dropzone -->
                <div
                  ref="dropzoneRef"
                  class="dropzone mb-4 border-dashed border-2 rounded-lg"
                  :class="{ 'dropzone--active': isOver }
                ">
                  <input ref="hiddenFileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                  <div class="flex flex-col items-center justify-center p-6 text-center text-gray-500">
                    <p class="mb-2 font-medium">Drag some files here</p>
                    <p class="text-sm">or click here to upload</p>
                    <v-btn variant="text" color="primary" class="mt-3" @click.prevent="triggerFilePicker">Choose file</v-btn>
                  </div>
                </div>

        <!-- Optional fallback: user can still paste an image URL -->
        <v-text-field
          v-model="form.image"
          label="Or image URL (optional)"
          placeholder="https://..."
          variant="outlined"
          class="mb-4"
        />

        <div v-if="previewUrl" class="mb-4">
          <label class="block text-sm text-gray-600 mb-1">Preview</label>
          <v-img :src="previewUrl" height="140" cover class="rounded-md" />
        </div>

        <v-btn
          type="submit"
          color="primary"
          class="w-full"
          :loading="creatingProduct"
          :disabled="creatingProduct"
        >
          Add product
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useDropZone } from '@vueuse/core'
import { useProductStore } from '../../../Store/ProductStore'


interface CreateProductFormState {
  title: string
  price: number | null
  stock: number | null
  categoryId: number | null
  description: string
  image: string
}

const productStore = useProductStore()

const formRef = ref()
const imageFile = ref<File | null>(null)
// note: requires @vueuse/core to be installed in the project
const hiddenFileInput = ref<HTMLInputElement | null>(null)
const previewObjectUrl = ref<string | null>(null)
const dropzoneRef = ref<HTMLElement | null>(null)
const { files, isOver } = useDropZone(dropzoneRef, {
  multiple: false,
  onDrop() {
    const f = files.value?.[0]
    if (f) setImageFile(f as File)
  },
})
const emit = defineEmits<{
  (e: 'created', product: any): void
  (e: 'close'): void
}>()

const form = reactive<CreateProductFormState>({
  title: '',
  price: null,
  stock: null,
  categoryId: null,
  description: '',
  image: '',
})

const loadingCategories = computed(() => productStore.loadingCategories)
const creatingProduct = computed(() => productStore.creatingProduct)
const creationError = computed(() => productStore.creationError)
const creationSuccess = computed(() => productStore.creationSuccess)

const categoryOptions = computed(() =>
  productStore.categories.map((category) => ({
    label: category.name,
    value: category.id,
  })),
)

const requiredRule = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 'This field is required.'
  }
  return true
}

const positiveNumberRule = (value: number | null) => {
  if (typeof value === 'number' && value >= 0) {
    return true
  }
  return 'Enter a valid positive value.'
}

const localError = ref<string | null>(null)

const resetForm = () => {
  form.title = ''
  form.price = null
  form.categoryId = null
  form.stock = null
  form.description = ''
  form.image = ''
  imageFile.value = null
  if (previewObjectUrl.value) {
    try {
      URL.revokeObjectURL(previewObjectUrl.value)
    } catch (e) {}
    previewObjectUrl.value = null
  }
}

// We upload files directly via ProductStore.uploadImage; preview uses object URL

const previewUrl = computed(() => previewObjectUrl.value || form.image || null)

const emitClose = () => emit('close')

const triggerFilePicker = () => {
  hiddenFileInput.value?.click()
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files && target.files[0]
  if (file) setImageFile(file)
}

// useDropZone handles drag/drop interactions; isOver indicates active state

const setImageFile = (file: File) => {
  if (previewObjectUrl.value) {
    try { URL.revokeObjectURL(previewObjectUrl.value) } catch (e) {}
    previewObjectUrl.value = null
  }
  imageFile.value = file
  try { previewObjectUrl.value = URL.createObjectURL(file) } catch (e) { previewObjectUrl.value = null }
}

const handleSubmit = async () => {
  const formEl = formRef.value as { validate: () => Promise<{ valid: boolean }> }
  const { valid } = formEl ? await formEl.validate() : { valid: true }
  if (!valid || form.price === null || form.categoryId === null) {
    return
  }

    try {
    let imagesPayload: string[] = []

    if (imageFile.value) {
      // First try Cloudinary unsigned upload if configured via Vite env
      const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

      if (CLOUD_NAME && UPLOAD_PRESET) {
        try {
          const fd = new FormData()
          fd.append('file', imageFile.value)
          fd.append('upload_preset', UPLOAD_PRESET)

          const resp = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
            { method: 'POST', body: fd },
          )

          if (!resp.ok) {
            throw new Error('Cloudinary upload failed')
          }

          const cloudData = await resp.json()
          if (cloudData?.secure_url) {
            imagesPayload = [cloudData.secure_url]
          }
        } catch (cloudErr) {
          // Cloudinary failed; fall back to productStore.uploadImage
          try {
            const uploadedUrl = await productStore.uploadImage(imageFile.value)
            if (uploadedUrl) imagesPayload = [uploadedUrl]
          } catch (uploadErr) {
            localError.value = 'Image upload failed. Please provide a publicly accessible image URL instead.'
            return
          }
        }
      } else {
        // No cloudinary config: fall back to productStore.uploadImage
        try {
          const uploadedUrl = await productStore.uploadImage(imageFile.value)
          if (uploadedUrl) imagesPayload = [uploadedUrl]
        } catch (uploadErr) {
          localError.value = 'Image upload failed. Please provide a publicly accessible image URL instead.'
          return
        }
      }
    } else if (form.image) {
      imagesPayload = [form.image.trim()]
    }

    // Validate that images are URLs (server expects URL addresses)
    const isHttpUrl = (s: string) => {
      try {
        const u = new URL(s)
        return u.protocol === 'http:' || u.protocol === 'https:'
      } catch (e) {
        return false
      }
    }

    if (imagesPayload.length > 0 && !imagesPayload.every((i) => isHttpUrl(i))) {
      localError.value = 'The API requires public image URLs. Upload your image to an image host and paste the URL, or configure an upload provider.'
      return
    }

    const created = await productStore.createProduct({
      title: form.title.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      categoryId: form.categoryId,
      images: imagesPayload,
    })
    resetForm()
    // notify parent that a product was created
    emit('created', created)
  } catch (error) {
    // Error state handled by the store
  }
}

const clearCreationStatus = () => {
  productStore.clearCreationStatus()
}

onMounted(() => {
  if (!productStore.hasCategories) {
    productStore.fetchCategories()
  }
})
</script>