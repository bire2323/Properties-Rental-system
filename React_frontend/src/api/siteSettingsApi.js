import { apiFetch, API_BASE_URL } from './apiClient'

let siteSettingsPromise = null
let siteSettingsCache = null

async function request(path = '', options = {}, canRefresh = options.method !== 'GET') {
    const response = await apiFetch(`/api/site-settings/${path}`, options, { noRefresh: !canRefresh })

    const text = await response.text()
    let payload
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

const PAYMENT_METHOD_FIELDS = ['name', 'account', 'holder', 'description', 'enabled']

/**
 * Build the request body for create/update.
 *
 * A logo is a file, so the request must be multipart FormData (never
 * JSON.stringify — a File serializes to `{}`). When no new file was chosen the
 * request stays JSON, and the stored logo URL is always omitted: it is
 * read-only server-side and echoing it back would be rejected as "not a file".
 */
function buildPaymentMethodBody(values) {
    const hasLogoFile = values.logo instanceof File
    const fields = PAYMENT_METHOD_FIELDS.filter((key) => values[key] !== undefined && values[key] !== null)

    if (hasLogoFile) {
        const body = new FormData()
        fields.forEach((key) => {
            const value = values[key]
            body.append(key, typeof value === 'boolean' ? String(Boolean(value)) : value)
        })
        body.append('logo', values.logo)
        return body
    }

    const json = {}
    fields.forEach((key) => {
        json[key] = values[key]
    })
    return JSON.stringify(json)
}

export function createPaymentMethod(values) {
    return request('payment-methods/', { method: 'POST', body: buildPaymentMethodBody(values) })
}

export function updatePaymentMethod(id, values) {
    return request(`payment-methods/${id}/`, { method: 'PATCH', body: buildPaymentMethodBody(values) })
}

export function deletePaymentMethod(id) {
    return request(`payment-methods/${id}/`, { method: 'DELETE' })
}

export function resolveSiteMediaUrl(value) {
    if (!value) return null
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    // Legacy local-media references (`/media/...`) predate the Cloudinary
    // migration. The backend never serves /media/ in production (its disk is
    // ephemeral) so those URLs always 404 — treat them as missing so callers
    // fall back to a default image instead of rendering a broken one.
    if (value.startsWith('/media/') || value.startsWith('media/')) return null
    return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}
