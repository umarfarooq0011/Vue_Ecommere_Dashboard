// src/Store/AuthStore.ts
import { defineStore } from 'pinia'
import api from '../plugins/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
  }),
  actions: {
    async registerUser (form: { username: string; email: string; password: string; role: string }) {
      // Using EscuelaJS (free, CORS-friendly) create-user endpoint
      const payload = {
        name: form.username,
        email: form.email,
        password: form.password,
        avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(form.username)}`,
        // 'role' is client-side only; backend ignores it
      }

      const { data } = await api.post('/users', payload)  
      this.user = { ...data, role: form.role }
      return data
    },
  },
})
