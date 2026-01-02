import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';

// Create axios instance
const API = axios.create({ baseURL: '' })

// Helper to get current profile from localStorage
const getProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('profile')) || null
  } catch {
    return null
  }
}

// Helper to update tokens in localStorage
const updateTokens = (accessToken, refreshToken) => {
  const profile = getProfile()
  if (profile) {
    profile.accessToken = accessToken
    profile.refreshToken = refreshToken
    localStorage.setItem('profile', JSON.stringify(profile))
  }
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor - add token to every request
API.interceptors.request.use(
  (config) => {
    const profile = getProfile()
    if (profile?.accessToken) {
      config.headers['Authorization'] = `token ${profile.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token expiration
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Check if it's a 401/403 and not already retried
    if ((error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      error.response?.data?.code === 'TOKEN_EXPIRED') {

      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = `token ${token}`
          return API(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const profile = getProfile()

      if (!profile?.refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('profile')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Call refresh endpoint
        const response = await axios.post('/api/users/v1/refresh', {
          refreshToken: profile.refreshToken
        })

        const { accessToken, refreshToken } = response.data

        // Update stored tokens
        updateTokens(accessToken, refreshToken)

        // Update header for original request
        originalRequest.headers['Authorization'] = `token ${accessToken}`

        // Process queued requests
        processQueue(null, accessToken)

        console.log('[Auth] Token refreshed successfully')

        // Retry original request
        return API(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear everything and redirect to login
        processQueue(refreshError, null)
        localStorage.removeItem('profile')
        console.log('[Auth] Token refresh failed, redirecting to login')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// API exports - all use the interceptor-equipped axios instance
export const loginIn = (formData) => API.post('/api/users/v1/login', formData)

export const register = (formData) => API.post('/api/users/v1/register', formData)

export const deleteUser = (formData) => API.delete('/api/users/v1/delete', { data: formData })

export const updatePassword = (formData) => API.post('/api/users/v1/updatePassword', formData)

export const getUser = (formData) => API.post('/api/users/v1/view', formData)

export const editUser = (formData) => API.post('/api/users/v1/edit', formData)

export const getUserGroups = (formData) => API.post('/api/group/v1/user', formData)

export const getEmailList = () => API.get('/api/users/v1/emailList')

export const createGroup = (formData) => API.post('/api/group/v1/add', formData)

export const editGroup = (formData) => API.post('/api/group/v1/edit', formData)

export const getGroupDetails = (formData) => API.post('/api/group/v1/view', formData)

export const getGroupExpense = (formData) => API.post('/api/expense/v1/group', formData)

export const addExpense = (formData) => API.post('/api/expense/v1/add', formData)

export const editExpense = (formData) => API.post('/api/expense/v1/edit', formData)

export const deleteExpense = (formData) => API.delete('/api/expense/v1/delete', { data: formData })

export const getGroupCategoryExp = (formData) => API.post('/api/expense/v1/group/categoryExp', formData)

export const getGroupMonthlyExp = (formData) => API.post('/api/expense/v1/group/monthlyExp', formData)

export const getGroupDailyExp = (formData) => API.post('/api/expense/v1/group/dailyExp', formData)

export const getUserExpense = (formData) => API.post('/api/expense/v1/user', formData)

export const getUserMonthlyExp = (formData) => API.post('/api/expense/v1/user/monthlyExp', formData)

export const getUserDailyExp = (formData) => API.post('/api/expense/v1/user/dailyExp', formData)

export const getUserCategoryExp = (formData) => API.post('/api/expense/v1/user/categoryExp', formData)

export const getRecentUserExp = (formData) => API.post('/api/expense/v1/user/recent', formData)

export const getExpDetails = (formData) => API.post('/api/expense/v1/view', formData)

export const getSettle = (formData) => API.post('/api/group/v1/settlement', formData)

// Add UUID for idempotency

export const makeSettle = (formData) => {
  // Inject idempotency key if not present
  if (!formData.idempotencyKey) {
    formData.idempotencyKey = uuidv4();
  }
  return API.post('/api/group/v1/makeSettlement', formData);
}

export const getUserNames = (formData) => API.post('/api/users/v1/getUserNames', formData)

// Member Search & Invite APIs
export const getRecentContacts = () => API.get('/api/users/v1/recentContacts')

export const searchUsers = (query) => API.get(`/api/users/v1/search?q=${encodeURIComponent(query)}`)

export const sendInvite = (formData) => API.post('/api/users/v1/sendInvite', formData)

// Email Verification & Password Reset APIs (no auth required, use axios directly)
export const verifyEmail = (token) => axios.get(`/api/users/v1/verify/${token}`)
export const resendVerification = (email) => axios.post('/api/users/v1/resendVerification', { email })
export const forgotPassword = (email) => axios.post('/api/users/v1/forgotPassword', { email })
export const resetPassword = (token, newPassword) => axios.post('/api/users/v1/resetPassword', { token, newPassword })

// Analytics APIs
export const getTopSpenders = (groupId, limit = 5) => API.post('/api/analytics/top-spenders', { groupId, limit })