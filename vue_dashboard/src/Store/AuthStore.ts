import { defineStore } from 'pinia'
import api from '../plugins/axios'
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UserProfile,
} from '../types'

const USER_STORAGE_KEY = 'authUser'
const TOKEN_STORAGE_KEY = 'authTokens'
const REGISTERED_USER_STORAGE_KEY = 'authRegisteredUser'

type StoredRegistration = RegisterPayload & { userId?: number }

const readFromStorage = <T>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(key)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as T
  } catch (error) {
    console.warn(`Unable to parse stored value for ${key}`, error)
    window.localStorage.removeItem(key)
    return null
  }
}

const persistValue = <T>(key: string, value: T | null) => {
  if (typeof window === 'undefined') {
    return
  }

  if (value === null) {
    window.localStorage.removeItem(key)
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readFromStorage<UserProfile>(USER_STORAGE_KEY) as UserProfile | null,
    tokens: readFromStorage<AuthTokens>(TOKEN_STORAGE_KEY) as AuthTokens | null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.tokens?.access_token),
  },

  actions: {
    async registerUser(form: RegisterPayload) {
      this.loading = true
      try {
        const payload = {
          name: form.username,
          email: form.email,
          password: form.password,
          avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(
            form.username,
          )}`,
        }

        const { data } = await api.post<UserProfile>('/users/', payload)

        this.user = { ...data, role: form.role }
        persistValue(USER_STORAGE_KEY, this.user)

        const storedRegistration: StoredRegistration = {
          ...form,
          userId: data.id,
        }
        persistValue(REGISTERED_USER_STORAGE_KEY, storedRegistration)

        return { ...data, role: form.role }
      } finally {
        this.loading = false
      }
    },

    async loginUser(credentials: LoginPayload) {
      this.loading = true
      try {
        const storedRegistration = readFromStorage<StoredRegistration>(
          REGISTERED_USER_STORAGE_KEY,
        )

        const emailsMatch = (emailA: string, emailB: string) =>
          emailA.trim().toLowerCase() === emailB.trim().toLowerCase()

        // Local login fallback (when using stored registration)
        if (
          storedRegistration &&
          emailsMatch(storedRegistration.email, credentials.email)
        ) {
          if (storedRegistration.password !== credentials.password) {
            throw new Error('Invalid email or password.')
          }

          const persistedProfile =
            this.user && emailsMatch(this.user.email, storedRegistration.email)
              ? this.user
              : readFromStorage<UserProfile>(USER_STORAGE_KEY) ?? {
                  id: storedRegistration.userId ?? Date.now(),
                  email: storedRegistration.email,
                  name: storedRegistration.username,
                  role: storedRegistration.role,
                  avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(
                    storedRegistration.username,
                  )}`,
                }

          this.user = persistedProfile
          persistValue(USER_STORAGE_KEY, persistedProfile)

          const localTokens: AuthTokens = {
            access_token: 'local-access-token',
            refresh_token: 'local-refresh-token',
          }

          this.tokens = localTokens
          persistValue(TOKEN_STORAGE_KEY, localTokens)

          return persistedProfile
        }

        // Remote login through API
        const { data: tokens } = await api.post<AuthTokens>(
          '/auth/login',
          credentials,
        )
        this.tokens = tokens
        persistValue(TOKEN_STORAGE_KEY, tokens)

        const { data: profile } = await api.get<UserProfile>('/auth/profile')
        this.user = profile
        persistValue(USER_STORAGE_KEY, profile)

        return profile
      } catch (err: any) {
        if (err?.response) {
          try {
            console.error('Auth login error status:', err?.response?.status)
            console.error('Auth login error response data:', err?.response?.data)
          } catch (loggingErr) {
            console.error('Error logging auth error details', loggingErr)
          }
        } else {
          console.error('Auth login error:', err)
        }

        const serverMessage =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message
        throw new Error(serverMessage || 'Login failed')
      } finally {
        this.loading = false
      }
    },

    async logout() {
     
      try {
        // best-effort: some APIs provide /auth/logout to revoke refresh tokens
        await api.post('/auth/logout')
      } catch (e) {
        // ignore server errors during logout (some APIs won't support it)
      }

      this.tokens = null
      this.user = null
      persistValue(TOKEN_STORAGE_KEY, null)
      persistValue(USER_STORAGE_KEY, null)

      // Broadcast logout to other tabs/windows so they can react
      try {
        if (typeof window !== 'undefined') {
          // use a timestamp so changes always trigger storage event
          window.localStorage.setItem('app.logout', String(Date.now()))
        }
      } catch (e) {
        // ignore storage errors
      }
    },
  },
})
