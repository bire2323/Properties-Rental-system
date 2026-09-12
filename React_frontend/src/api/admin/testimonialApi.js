import { apiFetch } from '../apiClient'

async function request(endpoint, options = {}) {
    const response = await apiFetch(endpoint, options)

    const responseText = await response.text()
    let payload
    try {
        payload = responseText ? JSON.parse(responseText) : {}
    } catch {
        payload = {
            detail: response.statusText || `Server returned ${response.status}`,
        }
    }

    if (!response.ok) {
        const message = payload?.detail || payload?.message || payload?.error || response.statusText || 'Request failed.'
        throw new Error(message)
    }

    return payload
}

export async function getAdminTestimonials(filters = {}) {
    const params = new URLSearchParams()

    const searchableParams = ['status', 'featured', 'search', 'ordering', 'page', 'page_size']

    searchableParams.forEach((key) => {
        const value = filters[key]
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
        }
    })

    const queryString = params.toString()
    try {
        return await request(`/api/testimonials/admin/${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
        })
    } catch (error) {
        console.error('Error fetching testimonials:', error)
        throw error
    }
}

export async function getAdminTestimonial(testimonialId) {
    return request(`/api/testimonials/admin/${testimonialId}/`, {
        method: 'GET',
    })
}

export async function moderateTestimonial(testimonialId, payload) {
    return request(`/api/testimonials/admin/${testimonialId}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    })
}