const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Generic request helper — mirrors the pattern in authApi.js.
 * Includes credentials (cookies) for authenticated endpoints.
 */
async function request(endpoint, options = {}) {
    const headers = {
        ...(options.headers || {}),
    }

    if (!(options.body instanceof FormData) && headers['Content-Type'] !== 'multipart/form-data') {
        headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers,
        ...options,
    })

    const responseText = await response.text()
    const payload = responseText ? JSON.parse(responseText) : {}

    if (!response.ok) {
        const message =
            payload?.detail ||
            payload?.message ||
            payload?.error ||
            'Request failed.'
        throw new Error(message)
    }

    return payload
}

/**
 * GET /api/properties/features/
 *
 * Fetches all available property features/amenities.
 *
 * @returns {Promise<Array<{id: number, name: string}>>}
 */
export async function getFeatures() {
    return request('/api/properties/features/', { method: 'GET' })
}

/**
 * GET /api/properties/features/
 * Alias for getFeatures.
 */
export async function getAllFeatures() {
    return getFeatures()
}

/**
 * GET /api/properties/
 *
 * Fetches all properties from the backend.
 * Accepts optional filter params that map to the Django ViewSet's
 * query_params filtering (location, min_price, max_price, type, bedrooms, brand).
 *
 * @param {Object} [filters] - Optional query parameter filters
 * @param {string} [filters.location]  - Case-insensitive partial match
 * @param {number} [filters.min_price] - Minimum monthly rent
 * @param {number} [filters.max_price] - Maximum monthly rent
 * @param {string} [filters.type]      - 'house' or 'car'
 * @param {number} [filters.bedrooms]  - Exact bedroom count (houses only)
 * @param {string} [filters.brand]     - Car brand (cars only)
 * @returns {Promise<Array>} List of property objects
 */
export async function getAllProperties(filters = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value)
        }
    })

    const queryString = params.toString()
    const endpoint = `/api/properties/${queryString ? `?${queryString}` : ''}`

    return request(endpoint, { method: 'GET' })
}

/**
 * GET /api/properties/:id/
 *
 * Fetches a single property by its ID, including nested
 * 'specific' (house/car fields), 'images', and computed 'main_image'.
 *
 * @param {number|string} id - The property ID
 * @returns {Promise<Object>} Property detail object
 */
export async function getPropertyById(id) {
    return request(`/api/properties/${id}/`, { method: 'GET' })
}

/**
 * DELETE /api/properties/:id/
 * Removes a property. Requires authenticated owner with permission.
 */
export async function deleteProperty(id) {
    return request(`/api/properties/${id}/`, { method: 'DELETE' })
}

/**
 * POST /api/properties/
 * Create a new property. Expects the create serializer payload.
 */
export async function createProperty(payload) {
    return request(`/api/properties/`, {
        method: 'POST',
        body: payload,
    })
}

/**
 * PUT /api/properties/:id/
 * Update an existing property (full update).
 */
export async function updateProperty(id, payload) {
    return request(`/api/properties/${id}/`, {
        method: 'PUT',
        body: payload,
    })
}

/**
 * POST /api/interactions/properties/:id/rating/
 * Rates a property (1-5 stars) for the authenticated user.
 */
export async function rateProperty(propertyId, rating) {
    return request(`/api/interactions/properties/${propertyId}/rating/`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
    })
}

/**
 * DELETE /api/interactions/properties/:id/rating/
 * Removes the authenticated user's rating for a property.
 */
export async function removeRating(propertyId) {
    return request(`/api/interactions/properties/${propertyId}/rating/`, {
        method: 'DELETE',
    })
}

/**
 * POST /api/interactions/properties/:id/favorite/
 * Adds a property to the authenticated user's favorites.
 */
export async function addFavorite(propertyId) {
    return request(`/api/interactions/properties/${propertyId}/favorite/`, {
        method: 'POST',
    })
}

/**
 * DELETE /api/interactions/properties/:id/favorite/
 * Removes a property from the authenticated user's favorites.
 */
export async function removeFavorite(propertyId) {
    return request(`/api/interactions/properties/${propertyId}/favorite/`, {
        method: 'DELETE',
    })
}

/**
 * GET /api/interactions/favorites/
 * Retrieves the authenticated user's favorited properties.
 */
export async function getFavorites() {
    return request(`/api/interactions/favorites/`, {
        method: 'GET',
    })
}
