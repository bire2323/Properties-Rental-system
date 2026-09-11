/**
 * Admin Subscription Plan Management API
 * Endpoints: /api/subscriptions/admin/plans/
 * All write operations require admin role (enforced server-side).
 *
 * Owner-facing plan selection: GET /api/subscriptions/plans/ (active plans only)
 * — see src/api/subscriptionApi.js
 */

import { apiFetch } from '../apiClient'

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
    const response = await apiFetch(endpoint, options)
    const text = await response.text()
    let payload
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

export async function adminGetSubscriptionPlans({ search, targetType, isActive } = {}) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (targetType) params.set('target_type', targetType)
    if (isActive !== undefined && isActive !== '') params.set('is_active', String(isActive))
    const query = params.toString() ? `?${params}` : ''
    return request(`/api/subscriptions/admin/plans/${query}`, { method: 'GET' })
}

export async function adminGetSubscriptionPlan(id) {
    return request(`/api/subscriptions/admin/plans/${id}/`, { method: 'GET' })
}

export async function adminCreateSubscriptionPlan(data) {
    return request('/api/subscriptions/admin/plans/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

export async function adminUpdateSubscriptionPlan(id, data) {
    return request(`/api/subscriptions/admin/plans/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

export async function adminSetSubscriptionPlanActive(id, isActive) {
    return request(`/api/subscriptions/admin/plans/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: Boolean(isActive) }),
    })
}

export async function adminDeleteSubscriptionPlan(id) {
    return request(`/api/subscriptions/admin/plans/${id}/`, { method: 'DELETE' })
}