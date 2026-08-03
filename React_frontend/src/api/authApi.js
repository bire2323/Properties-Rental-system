const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    })

    const responseText = await response.text()
    const payload = responseText ? JSON.parse(responseText) : {}

    if (!response.ok) {
        const message = payload?.detail || payload?.message || payload?.error || 'Request failed.'
        throw new Error(message)
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
