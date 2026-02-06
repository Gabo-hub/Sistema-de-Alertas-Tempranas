
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL + '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptar peticiones para añadir token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Ayudante para uso consistente de respuestas
const responseBody = (response) => response.data

export const alertsApi = {
  list: (params) => api.get('alerts/', { params }).then(responseBody),
  get: (id) => api.get(`alerts/${id}/`).then(responseBody),
  create: (data) => api.post('alerts/', data).then(responseBody),
  update: (id, data) => api.patch(`alerts/${id}/`, data).then(responseBody),
  delete: (id) => api.delete(`alerts/${id}/`).then(responseBody),
  exportUrl: (params) => {
    const q = new URLSearchParams(params).toString()
    return `${BASE_URL}/api/alerts/export/${q ? `?${q}` : ''}`
  }
}

export const zonesApi = {
  list: () => api.get('zones/').then(responseBody),
  get: (id) => api.get(`zones/${id}/`).then(responseBody),
  create: (data) => api.post('zones/', data).then(responseBody),
  update: (id, data) => api.patch(`zones/${id}/`, data).then(responseBody),
  delete: (id) => api.delete(`zones/${id}/`).then(responseBody),
}

export const statisticsApi = {
  get: (params) => api.get('statistics/', { params }).then(responseBody),
}

export const weatherApi = {
  get: (lat, lon) => api.get('weather/', { params: { lat, lon } }).then(responseBody),
}

export default api
