import axios from 'axios'

const AUTH_URL    = import.meta.env.VITE_AUTH_API_URL    || 'http://localhost:8081'
const PROVIDER_URL = import.meta.env.VITE_PROVIDER_API_URL || 'http://localhost:8082'
const SCHEDULE_URL = import.meta.env.VITE_SCHEDULE_API_URL || 'http://localhost:8083'

function createInstance(baseURL) {
  const instance = axios.create({ baseURL })

  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('medibook_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    res => res,
    err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('medibook_token')
        localStorage.removeItem('medibook_user')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )

  return instance
}

export const authApi     = createInstance(AUTH_URL)
export const providerApi = createInstance(PROVIDER_URL)
export const scheduleApi = createInstance(SCHEDULE_URL)
