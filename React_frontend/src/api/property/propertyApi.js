const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
let navigationOptionsPromise = null
let navigationOptionsCache = null

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

// ─── Features ──────────────────────────────────────────────────────────────

/**
 * GET /api/properties/features/
 * Fetches all available property features/amenities.
 */
export async function getFeatures() {
    return request('/api/properties/features/', { method: 'GET' })
}

/** Alias for getFeatures */
export async function getAllFeatures() {
    return getFeatures()
}

/**
 * GET /api/properties/navigation-options/
 * Returns public navbar-safe listing options supported by the backend.
 */
export async function getListingNavigationOptions({ force = false } = {}) {
    if (!force) {
        if (navigationOptionsCache) {
            return navigationOptionsCache
        }
        if (navigationOptionsPromise) {
            return navigationOptionsPromise
        }
    }

    navigationOptionsPromise = request('/api/properties/navigation-options/', { method: 'GET' })
        .then((payload) => {
            navigationOptionsCache = payload
            return payload
        })
        .finally(() => {
            navigationOptionsPromise = null
        })

    return navigationOptionsPromise
}

/**
 * GET /api/properties/regions/
 * Returns all Regions with their nested Cities.
 * Used for cascading Region → City dropdowns in forms and filters.
 *
 * Response shape:
 *   [{ id, name, cities: [{ id, name, region_id, region_name }, ...] }, ...]
 */
export async function getRegions() {
    return request('/api/properties/regions/', { method: 'GET' })
}

// ─── Properties ─────────────────────────────────────────────────────────────

/**
 * GET /api/properties/
 *
 * Accepts optional filter params:
 *   location, min_price, max_price, type, bedrooms, brand
 *
 * NOTE: The backend filters location against city, address, region.
 * There is no longer a `country` filter.
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
 * Fetches a single property by its ID, including nested house_detail/car_detail,
 * images, features, and company info.
 */
export async function getPropertyById(id) {
    return request(`/api/properties/${id}/`, { method: 'GET' })
}

/**
 * DELETE /api/properties/:id/
 * Removes a property. Requires authenticated owner/company manager/admin.
 */
export async function deleteProperty(id) {
    return request(`/api/properties/${id}/`, { method: 'DELETE' })
}

/**
 * POST /api/properties/
 * Create a new property. Expects FormData payload matching
 * PropertyCreateSerializer fields:
 *
 *   property_name, description, listing_type, price, rental_unit,
 *   security_deposit, address, city, region, kebele, latitude, longitude,
 *   status, is_available, house_detail (JSON), car_detail (JSON),
 *   feature_ids (JSON array), images (files), company (id, optional)
 *
 * NOTE: Do NOT send `country` or `floor_number` — those fields no longer exist.
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

// ─── Companies ──────────────────────────────────────────────────────────────

/**
 * GET /api/companies/
 * Fetches all companies. Public endpoint.
 */
export async function getCompanies() {
    return request('/api/companies/', { method: 'GET' })
}

/**
 * GET /api/companies/my-companies/
 * Returns only companies the authenticated user manages.
 */
export async function getMyManagedCompanies() {
    return request('/api/companies/my-companies/', { method: 'GET' })
}

/**
 * GET /api/companies/:id/
 * Fetches a single company by ID.
 */
export async function getCompany(id) {
    return request(`/api/companies/${id}/`, { method: 'GET' })
}

/**
 * GET /api/companies/:id/documents/
 * Lists verification documents for a company.
 */
export async function getCompanyDocuments(companyId) {
    return request(`/api/companies/${companyId}/documents/`, { method: 'GET' })
}

/**
 * POST /api/companies/:id/documents/
 * Upload a single verification document for a company.
 */
export async function createCompanyDocument(companyId, data) {
    return request(`/api/companies/${companyId}/documents/`, {
        method: 'POST',
        body: data,
    })
}

/**
 * DELETE /api/companies/:id/documents/:documentId/
 * Removes a verification document if the user has permission.
 */
export async function deleteCompanyDocument(companyId, documentId) {
    return request(`/api/companies/${companyId}/documents/${documentId}/`, { method: 'DELETE' })
}

/**
 * POST /api/companies/
 * Creates a new company. The authenticated user is automatically added
 * as a manager by the backend.
 * Accepts FormData (supports logo image upload).
 */
export async function createCompany(data) {
    return request('/api/companies/', {
        method: 'POST',
        body: data,
    })
}

/**
 * PUT /api/companies/:id/
 * Full update of a company. Requires manager or admin auth.
 */
export async function updateCompany(id, data) {
    return request(`/api/companies/${id}/`, {
        method: 'PUT',
        body: data,
    })
}

/**
 * PATCH /api/companies/:id/
 * Partial update of a company.
 */
export async function patchCompany(id, data) {
    return request(`/api/companies/${id}/`, {
        method: 'PATCH',
        body: data,
    })
}

/**
 * DELETE /api/companies/:id/
 * Deletes a company. Requires manager or admin auth.
 */
export async function deleteCompany(id) {
    return request(`/api/companies/${id}/`, { method: 'DELETE' })
}

// ─── Interactions ────────────────────────────────────────────────────────────

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
