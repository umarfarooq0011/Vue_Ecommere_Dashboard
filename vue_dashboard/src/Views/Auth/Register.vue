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
      <v-card-title class="flex flex-col items-center pt-8 pb-2">
        <span class="text-2xl font-bold text-center">
          Create Account
        </span>
        <p class="text-gray-500 text-sm mt-2 text-center px-4">
          Sign up to access your dashboard
        </p>
      </v-card-title>

      <v-card-text class="px-6 sm:px-8 pb-2 pt-4">
        <div class="flex flex-col gap-4">
          <v-text-field
            v-model="form.username"
            label="Username"
            variant="outlined"
            class="rounded-lg"
          />

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
          
          <v-select
            v-model="form.role"
            :items="['Admin', 'User']"
            label="Select Role"
            variant="outlined"
            class="rounded-lg"
          />


          <v-btn
            color="primary"
            block
            size="large"
            class="mt-3 font-semibold tracking-wide transition-transform duration-300 hover:scale-[1.02]"
            @click="onSubmit"
          >
            Create Account
          </v-btn>
        </div>
      </v-card-text>

      <v-card-actions
        class="flex justify-center pb-6 pt-2 text-gray-600 text-sm"
      >
        Already have an account?
        <RouterLink
          to="/login"
          class="ml-1 text-blue-600 font-semibold hover:underline"
        >
          Sign in
        </RouterLink>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import router from '../../router'
import { useAuthStore } from '../../Store/AuthStore'

const store = useAuthStore()

type payload = {
  username: string
  email: string
  password: string
  role: string
}

const form = ref<payload>({
  username: 'Umar',
  email: 'umarfarooq6153@gmail.com',
  password: 'Umar1122',
  role: 'Admin'
})

const onSubmit = async () => {
  try {
    await store.registerUser(form.value)
    router.push('/')
    console.log('Registration successful', form.value);
  } catch (error) {
    console.error('Registration failed:', error)
  }
}

</script>

