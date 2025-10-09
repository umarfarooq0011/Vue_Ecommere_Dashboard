import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://api.escuelajs.co/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storedTokens = window.localStorage.getItem('authTokens')
    if (storedTokens) {
      const { access_token } = JSON.parse(storedTokens) as {
        access_token?: string
      }

      if (access_token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${access_token}`
      }
    }
  }

  return config
})




export default axiosInstance

export function setupAxiosInterceptors(getAuthStore: () => any, router: any) {
  axiosInstance.interceptors.response.use(
    (res) => res,
    async (err) => {
      try {
        const status = err?.response?.status
        if (status === 401) {
          try {
            const authStore = getAuthStore()
            if (authStore && typeof authStore.logout === 'function') {
           
              await authStore.logout()
            }
          } catch (e) {
            console.error('Error while performing client logout after 401', e)
          }

          try {
            if (router && typeof router.push === 'function') {
              router.push({ name: 'login', query: { sessionExpired: '1' } })
            }
          } catch (e) {
         
          }
        }
      } catch (outer) {
       
      }

      return Promise.reject(err)
    },
  )
}