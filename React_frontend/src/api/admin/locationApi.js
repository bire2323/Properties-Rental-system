/**
 * Admin Location Management API
 * Endpoints: /api/properties/admin/regions/ and /api/properties/admin/cities/
 * All write operations require admin role (enforced server-side).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function extractErrorMessage(payload, fallbackStatus) {
    if (!payload) return `Request failed (${fallbackStatus})`
    if (typeof payload === 'string') return payload
    if (payload.detail || payload.message || payload.error) {
        return payload.detail || payload.message || payload.error
    }

    const firstField = Object.values(payload).find((value) => {
        if (Array.isArray(value)) return value.length > 0
        return typeof value === 'string' && value
    })

    if (Array.isArray(firstField)) return firstField[0]
    if (typeof firstField === 'string') return firstField

    return `Request failed (${fallbackStatus})`
}

async function request(endpoint, options = {}) {
    const headers = { ...(options.headers || {}) }
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers,
        ...options,
    })
    const text = await response.text()
    let payload = {}
    try { payload = text ? JSON.parse(text) : {} } catch { payload = {} }

    if (!response.ok) {
        const message = extractErrorMessage(payload, response.status)
        const err = new Error(message)
        err.status = response.status
        err.payload = payload
        throw err
    }
    return payload
}

// ─── Regions ─────────────────────────────────────────────────────────────────

export async function adminGetRegions() {
    return request('/api/properties/admin/regions/', { method: 'GET' })
}

export async function adminCreateRegion(data) {
    return request('/api/properties/admin/regions/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function adminUpdateRegion(id, data) {
    return request(`/api/properties/admin/regions/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

export async function adminDeleteRegion(id) {
    return request(`/api/properties/admin/regions/${id}/`, { method: 'DELETE' })
}

// ─── Cities ──────────────────────────────────────────────────────────────────

export async function adminGetCities(regionId = null) {
    const query = regionId ? `?region_id=${regionId}` : ''
    return request(`/api/properties/admin/cities/${query}`, { method: 'GET' })
}

export async function adminCreateCity(data) {
    return request('/api/properties/admin/cities/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function adminUpdateCity(id, data) {
    return request(`/api/properties/admin/cities/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

export async function adminDeleteCity(id) {
    return request(`/api/properties/admin/cities/${id}/`, { method: 'DELETE' })
}
