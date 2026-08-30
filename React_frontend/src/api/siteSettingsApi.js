import { refreshToken } from './authApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
let siteSettingsPromise = null
let siteSettingsCache = null

async function request(path = '', options = {}, canRefresh = options.method !== 'GET') {
    const headers = { ...(options.headers || {}) }
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
    }

    let response = await fetch(`${API_BASE_URL}/api/site-settings/${path}`, {
        credentials: 'include',
        headers,
        ...options,
    })

    if (response.status === 401 && canRefresh) {
        try {
            await refreshToken()
            response = await fetch(`${API_BASE_URL}/api/site-settings/${path}`, {
                credentials: 'include',
                headers,
                ...options,
            })
        } catch {
            // Preserve the original authentication response below.
        }
    }
    const text = await response.text()
    let payload = {}
    try {
        payload = text ? JSON.parse(text) : {}
    } catch {
        payload = { detail: response.statusText || 'Request failed.' }
    }

    if (!response.ok) {
        throw new Error(payload.detail || payload.message || 'Request failed.')
    }
    return payload
}

export function getSiteSettings({ force = false } = {}) {
    if (!force) {
        if (siteSettingsCache) {
            return Promise.resolve(siteSettingsCache)
        }
        if (siteSettingsPromise) {
            return siteSettingsPromise
        }
    }

    siteSettingsPromise = request('', { method: 'GET' }, false)
        .then((payload) => {
            siteSettingsCache = payload
            return payload
        })
        .finally(() => {
            siteSettingsPromise = null
        })

    return siteSettingsPromise
}

export function updateSiteSettings(values, logoFile) {
    const body = new FormData()
    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) body.append(key, value)
    })
    if (logoFile) body.append('logo', logoFile)
    siteSettingsCache = null
    siteSettingsPromise = null
    return request('', { method: 'PATCH', body }).then((payload) => {
        siteSettingsCache = payload
        return payload
    })
}

export function getPaymentMethods() {
    return request('payment-methods/', { method: 'GET' }, false)
}

export function createPaymentMethod(values) {
    const payload = { ...values }
    if (!payload.logo) delete payload.logo
    return request('payment-methods/', { method: 'POST', body: JSON.stringify(payload) })
}

export function updatePaymentMethod(id, values) {
    const payload = { ...values }
    if (!payload.logo) delete payload.logo
    return request(`payment-methods/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function deletePaymentMethod(id) {
    return request(`payment-methods/${id}/`, { method: 'DELETE' })
}

export function resolveSiteMediaUrl(value) {
    if (!value) return null
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}
