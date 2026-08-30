/**
 * Admin Category Management API
 * Endpoints: /api/properties/admin/categories/
 * All write operations require admin role (enforced server-side).
 *
 * Public endpoint for listing forms:
 *   GET /api/properties/categories/?listing_type=house
 *   GET /api/properties/categories/?listing_type=car
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function extractErrorMessage(payload, fallbackStatus) {
    if (!payload) return `Request failed (${fallbackStatus})`
    if (typeof payload === 'string') return payload
    if (payload.detail || payload.message || payload.error) {
        return payload.detail || payload.message || payload.error
    }
    const firstField = Object.values(payload).find((v) =>
        Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v
    )
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

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * GET /api/properties/categories/?listing_type=house|car
 * Returns active categories for the given listing type.
 * Used by owner property/vehicle creation forms.
 */
export async function getPublicCategories(listingType) {
    const query = listingType ? `?listing_type=${listingType}` : ''
    return request(`/api/properties/categories/${query}`, { method: 'GET' })
}

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export async function adminGetCategories({ listingType, isActive, search } = {}) {
    const params = new URLSearchParams()
    if (listingType) params.set('listing_type', listingType)
    if (isActive !== undefined && isActive !== '') params.set('is_active', String(isActive))
    if (search) params.set('search', search)
    const query = params.toString() ? `?${params}` : ''
    return request(`/api/properties/admin/categories/${query}`, { method: 'GET' })
}

export async function adminCreateCategory(data) {
    return request('/api/properties/admin/categories/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function adminUpdateCategory(id, data) {
    return request(`/api/properties/admin/categories/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

export async function adminDeleteCategory(id) {
    return request(`/api/properties/admin/categories/${id}/`, { method: 'DELETE' })
}
