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
            v-model="email"
            label="Email Address"
            variant="outlined"
            class="rounded-lg"
          />

          <v-text-field
            v-model="password"
            type="password"
            label="Password"
            variant="outlined"
            class="rounded-lg"
          />

          <v-btn
            color="primary"
            block
            size="large"
            class="mt-3 font-semibold tracking-wide shadow-md
                   hover:scale-[1.02] transition-transform"
            @click="login"
          >
            Sign In
          </v-btn>
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
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const email = ref('')
const password = ref('')

const login = () => {
  console.log('Login with:', { email: email.value, password: password.value })
}
</script>
