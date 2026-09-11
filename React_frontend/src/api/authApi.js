import { apiFetch } from './apiClient'

function getErrorMessage(payload, fallback = 'Request failed.') {
    const detail = payload?.detail || payload?.message || payload?.error
    if (typeof detail === 'string') return detail
    if (detail && typeof detail === 'object') {
        return Object.entries(detail)
            .flatMap(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' ')
    }
    const fieldErrors = Object.entries(payload || {})
        .flatMap(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .filter(Boolean)
    if (fieldErrors.length) return fieldErrors.join(' ')
    return fallback
}

async function request(endpoint, options = {}, noRefresh = false) {
    const response = await apiFetch(endpoint, options, { noRefresh })

    const responseText = await response.text()
    const payload = responseText
        ? (() => {
            try {
                return JSON.parse(responseText)
            } catch {
                return { detail: response.statusText || 'Request failed.' }
            }
        })()
        : {}

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

export async function loginOtpVerify(challengeId, code) {
    return request('/api/accounts/login/otp-verify/', {
        method: 'POST',
        body: JSON.stringify({ login_challenge_id: challengeId, code }),
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
    }, true)
}

export const api = {
    get(endpoint) {
        return request(endpoint, { method: 'GET' })
    },
    post(endpoint, body = {}) {
        return request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        })
    },
    patch(endpoint, body = {}) {
        return request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body),
        })
    },
}
