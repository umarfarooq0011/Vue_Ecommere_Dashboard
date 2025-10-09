<template>
  <div
    class="min-h-screen flex items-center justify-center px-4 py-10
           bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300"
  >
    <v-card
      class="w-full max-w-[440px] sm:max-w-[480px] rounded-2xl shadow-2xl
             backdrop-blur-md border border-gray-200"
      elevation="8"
    >
      <!-- Header -->
      <v-card-title class="flex flex-col items-center pt-8 pb-2">
        <span class="text-2xl font-bold text-center text-gray-800">
          Welcome Back
        </span>
        <p class="text-gray-500 text-sm mt-2 text-center px-4">
          Sign in to continue to your dashboard
        </p>
      </v-card-title>

      <!-- Form -->
      <v-card-text class="px-6 sm:px-8 pb-2 pt-4">
        <div class="flex flex-col gap-4">
          <v-text-field
            v-model="form.email"
            label="Email Address"
            type="email"
            variant="outlined"
            class="rounded-lg"
          />

          <v-text-field
            v-model="form.password"
            type="password"
            label="Password"
            variant="outlined"
            class="rounded-lg"
          />

          <v-btn
            color="primary"
            block
            size="large"
            :loading="auth.loading"
            :disabled="auth.loading"
            class="mt-3 font-semibold tracking-wide shadow-md
                   hover:scale-[1.02] transition-transform"
            @click="onSubmit"
          >
            Sign In
          </v-btn>

          <p v-if="successMessage" class="text-sm text-green-600 text-center">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="text-sm text-red-500 text-center">
            {{ errorMessage }}
          </p>
        </div>
      </v-card-text>

      <!-- Footer -->
      <v-card-actions
        class="flex justify-center pb-6 pt-2 text-gray-600 text-sm"
      >
        Don’t have an account?
        <RouterLink
          to="/register"
          class="ml-1 text-blue-600 font-semibold hover:underline"
        >
          Register
        </RouterLink>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../Store/AuthStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const errorMessage = ref('')
const successMessage = ref('')

const REGISTERED_USER_STORAGE_KEY = 'authRegisteredUser'

onMounted(() => {
  if (route.query.registered === '1') {
    successMessage.value = 'Registration successful. Please sign in with the same credentials.'
  }

  

  try {
    const storedRegistration = window.localStorage.getItem(
      REGISTERED_USER_STORAGE_KEY,
    )

    if (storedRegistration) {
      const parsed = JSON.parse(storedRegistration) as {
        email?: string
        password?: string
      }

      form.email = parsed.email ?? form.email
      form.password = parsed.password ?? form.password
    }
  } catch (storageError) {
    console.warn('Unable to read stored registration details', storageError)
  }
})

const onSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!form.email || !form.password) {
    errorMessage.value = 'Please provide an email and password.'
    return
  }

  try {
    await auth.loginUser({ ...form })
    const redirectPath = (route.query.redirect as string) || '/Dashboard'
    router.push(redirectPath)
  } catch (error) {
    console.error('Login failed:', error)
    errorMessage.value =
      (error as Error).message || 'Unable to sign in with the provided credentials.'
  }
}
</script>
