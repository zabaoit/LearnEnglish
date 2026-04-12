const API_BASE = import.meta.env.VITE_API_URL || '/api'
export const TOKEN_KEY = 'learnenglish_token'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed')
    Object.assign(error, data)
    throw error
  }

  return data
}

export async function authRequest(mode, payload) {
  return apiRequest(`/auth/${mode}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function markWord(wordId, action) {
  return apiRequest(`/progress/words/${wordId}`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export async function saveQuizAttempt(payload) {
  return apiRequest('/progress/quiz-attempts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
