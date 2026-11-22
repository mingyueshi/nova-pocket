import { createHttpAdapters } from './http.js'
import { createRequest } from './request.js'

const localApi = process.env.UNI_PLATFORM === 'h5' ? '/api' : 'http://127.0.0.1:4318/api'
const baseUrl = import.meta.env.VITE_API_BASE_URL || localApi
export const { auth, messages } = createHttpAdapters(createRequest(baseUrl), { paginatedMessages: true })
export const demoSettingsEnabled = false
