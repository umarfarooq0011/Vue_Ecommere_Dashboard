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