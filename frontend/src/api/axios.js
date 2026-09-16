// ─────────────────────────────────────────────
//  Axios instance — all API calls go through here
// ─────────────────────────────────────────────
import axios from 'axios'

const api = axios.create({
  baseURL:         '/api',       // proxied to http://localhost:5000/api by Vite
  withCredentials: true,         // send session cookie
  headers: { 'Content-Type': 'application/json' },
})

// Global response interceptor — redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
