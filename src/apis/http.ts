import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

// Any CLIuno backend template serves this contract. Android emulators need
// the host machine's address (e.g. http://10.0.2.2:3000/api/v1).
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3000/api/v1'

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Screens react to the cleared session via the auth store.
      await AsyncStorage.removeMany(['token', 'refreshToken'])
    }
    return Promise.reject(error)
  },
)

export default http
