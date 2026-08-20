const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
let refreshInFlight = null

function getErrorMessage(payload, fallback = 'Request failed.') {
    const detail = payload?.detail || payload?.message || payload?.error
    if (typeof detail === 'string') return detail
    if (detail && typeof detail === 'object') {
        return Object.entries(detail)
            .flatMap(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' ')
    }
    return fallback
}

function refreshSession() {
    if (!refreshInFlight) {
        refreshInFlight = refreshToken().finally(() => {
            refreshInFlight = null
        })
    }
    return refreshInFlight
}

async function request(endpoint, options = {}, canRefresh = endpoint !== '/api/accounts/token/refresh/') {
    const isFormData = options.body instanceof FormData
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: isFormData ? (options.headers || {}) : { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    })

    if (response.status === 401 && canRefresh) {
        try {
            await refreshSession()
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                credentials: 'include',
                headers: isFormData ? (options.headers || {}) : { 'Content-Type': 'application/json', ...(options.headers || {}) },
                ...options,
            })
        } catch {
            // Preserve the original authentication response below.
        }
    }

    const responseText = await response.text()
    let payload = {}
    try {
        payload = responseText ? JSON.parse(responseText) : {}
    } catch {
        payload = { detail: response.statusText || 'Request failed.' }
    }

    if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.statusText || 'Request failed.'))
    }

    return payload
}

export async function register(data) {
    return request('/api/accounts/register/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function login(data) {
    return request('/api/accounts/login/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function logout() {
    return request('/api/accounts/logout/', {
        method: 'POST',
    })
}

export async function getProfile() {
    return request('/api/accounts/profile/', {
        method: 'GET',
    })
}

export async function updateProfile(data) {
    if (data instanceof FormData) {
        return request('/api/accounts/profile/', { method: 'PATCH', body: data })
    }
    return request('/api/accounts/profile/', {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

export async function googleLogin(token) {
    return request('/api/accounts/google/', {
        method: 'POST',
        body: JSON.stringify({ credential: token }),
    })
}

export async function refreshToken() {
    return request('/api/accounts/token/refresh/', {
        method: 'POST',
    })
}
