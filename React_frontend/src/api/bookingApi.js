/**
 * Booking API Client
 * 
 * Encapsulates all booking-related HTTP requests to the Django backend.
 * Uses the existing request helper pattern from propertyApi.js.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Generic request helper — mirrors the pattern in authApi.js and propertyApi.js.
 * Includes credentials (cookies) for authenticated endpoints.
 *
 * The response body is parsed EXACTLY ONCE (via response.text()) and then, on
 * error, the parsed payload is preserved on the thrown Error so no backend
 * message is ever lost.
 *
 * On error, throws an Error with:
 * - message: the single most relevant backend message
 * - status: HTTP status code
 * - response: the full parsed backend response object
 * - fieldErrors: { fieldName: string[] } for every field-level validation error
 * - nonFieldErrors: string[] for non-field (form-wide) backend errors
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

    // Parse the body once. Never call response.json() again after this.
    const responseText = await response.text()
    let payload = {}
    try {
        payload = responseText ? JSON.parse(responseText) : {}
    } catch {
        payload = { detail: responseText || 'Request failed.' }
    }

    if (!response.ok) {
        const error = buildHttpError(response, payload)
        throw error
    }

    return payload
}

/**
 * Normalize a Django REST Framework error response into a structured Error.
 *
 * Handles the standard DRF shapes returned by BookingCreateSerializer:
 *   { "start_date": ["A start date is required."] }                       field errors
 *   { "non_field_errors": ["This property is already booked for..."] }    form-wide errors
 *   { "property": ["This listing is currently unavailable."] }            related-field errors
 *   { "detail": "..." }                                                   view-level errors (403/404/405/409/500)
 * plus unknown keys and non-JSON fallbacks.
 */
function buildHttpError(response, payload) {
    const fieldErrors = {}
    const nonFieldErrors = []
    let detailMessage = null

    if (payload && typeof payload === 'object') {
        for (const [key, value] of Object.entries(payload)) {
            if (key === 'detail') {
                detailMessage = Array.isArray(value) ? value[0] : normalizeScalar(value)
            } else if (key === 'non_field_errors') {
                nonFieldErrors.push(...(Array.isArray(value) ? value : [value]).map(normalizeScalar).filter(Boolean))
            } else if (Array.isArray(value) || typeof value === 'string' || typeof value === 'number') {
                fieldErrors[key] = (Array.isArray(value) ? value : [value]).map(normalizeScalar).filter(Boolean)
            }
        }
    }

    let message =
        detailMessage ||
        nonFieldErrors[0] ||
        Object.values(fieldErrors)
            .flat()
            .find(Boolean) ||
        (typeof payload === 'string' ? payload : null)

    if (!message) {
        if (response.status === 401) message = 'Your session has expired. Please sign in again.'
        else if (response.status === 403) message = 'You do not have permission to perform this action.'
        else if (response.status === 404) message = 'The requested resource could not be found.'
        else if (response.status === 409) message = 'The request conflicts with the current state.'
        else if (response.status >= 500) message = 'A server error occurred. Please try again later.'
        else message = 'Request failed.'
    }

    const error = new Error(message)
    error.name = response.status === 401 ? 'UnauthorizedError' : 'BookingApiError'
    error.status = response.status
    error.response = payload
    error.fieldErrors = fieldErrors
    error.nonFieldErrors = nonFieldErrors
    return error
}

/**
 * Keep primitives as text; JSON-safe stringify nested objects/arrays that DRF
 * occasionally embeds so the raw value is never silently dropped.
 */
function normalizeScalar(value) {
    if (value == null) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    try {
        return JSON.stringify(value)
    } catch {
        return ''
    }
}

// ─── BOOKING OPERATIONS ────────────────────────────────────────────────────

/**
 * POST /api/bookings/
 * Create a new booking for a property/vehicle.
 * 
 * The renter is automatically set to the authenticated user.
 * Financial fields are calculated by the backend.
 * 
 * @param {Object} data - Booking request data
 * @param {number} data.property - Property ID
 * @param {string} data.rental_type - 'fixed_term' or 'month_to_month' (optional, auto-resolved by backend)
 * @param {string} data.start_date - Start date (YYYY-MM-DD)
 * @param {string} data.end_date - End date (YYYY-MM-DD) or null for month-to-month
 * @returns {Promise<Object>} Created booking with full financial snapshot
 */
export async function createBooking(data) {
    return request('/api/bookings/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

/**
 * GET /api/bookings/
 * List all bookings visible to the authenticated user.
 * 
 * - Renters see: their own bookings
 * - Owners/managers see: bookings for their properties
 * - Admins see: all bookings
 * 
 * @param {Object} filters - Optional query filters
 * @param {string} filters.status - Filter by status (pending, confirmed, rejected, etc.)
 * @param {number} filters.property - Filter by property ID
 * @param {string} filters.rental_type - Filter by rental type (fixed_term, month_to_month)
 * @returns {Promise<Object>} Paginated list of bookings
 */
export async function listBookings(filters = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value)
        }
    })

    const query = params.toString()
    const endpoint = query ? `/api/bookings/?${query}` : '/api/bookings/'

    return request(endpoint, { method: 'GET' })
}

/**
 * GET /api/bookings/{id}/
 * Retrieve a specific booking by ID.
 * 
 * User must be the renter, owner/manager, or admin.
 * 
 * @param {number} id - Booking ID
 * @returns {Promise<Object>} Booking details
 */
export async function getBooking(id) {
    return request(`/api/bookings/${id}/`, { method: 'GET' })
}

/**
 * PATCH /api/bookings/{id}/
 * Update booking status.
 * 
 * Owner/manager can:
 * - Reject: PENDING → REJECTED
 * 
 * Renter can:
 * - Cancel: PENDING → CANCELLED (via DELETE, but leaving for completeness)
 * 
 * Confirmed status is set only by successful payment verification (backend internal).
 * 
 * @param {number} id - Booking ID
 * @param {Object} data - Status update data
 * @param {string} data.status - New status ('rejected', 'cancelled', etc.)
 * @returns {Promise<Object>} Updated booking
 */
export async function updateBookingStatus(id, data) {
    return request(`/api/bookings/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

/**
 * DELETE /api/bookings/{id}/
 * Cancel a booking.
 * 
 * Renter can cancel only PENDING bookings.
 * Admin can cancel with restrictions.
 * 
 * @param {number} id - Booking ID
 * @returns {Promise<void>} 204 No Content on success
 */
export async function cancelBooking(id) {
    return request(`/api/bookings/${id}/`, { method: 'DELETE' })
}

export async function deleteBooking(id) {
    return request(`/api/bookings/${id}/`, { method: 'DELETE' })
}

/**
 * GET /api/bookings/?status=pending&property_id={id}
 * List rental requests for an owner's property.
 * 
 * Returns PENDING bookings for properties managed by the authenticated owner.
 * Only owners/managers can use this.
 * 
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} List of PENDING bookings
 */
export async function getOwnerRentalRequests(filters = {}) {
    return listBookings({
        status: 'pending',
        ...filters,
    })
}

/**
 * GET /api/bookings/
 * List confirmed bookings for an owner.
 * 
 * Owner can see all their confirmed bookings.
 * 
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} List of confirmed bookings
 */
export async function getOwnerConfirmedBookings(filters = {}) {
    return listBookings({
        status: 'confirmed',
        ...filters,
    })
}

/**
 * Approve a booking (owner action).
 *
 * Owner/company manager (or admin) approves a PENDING booking, transitioning it
 * to APPROVED (awaiting payment). Payment is NOT available until approved.
 * Only a successful verified payment (services.confirm_booking_from_payment)
 * later moves the booking from APPROVED to CONFIRMED — never React or this
 * endpoint. The backend enforces authorization and that only PENDING bookings
 * can be approved.
 *
 * @param {number} id - Booking ID
 * @returns {Promise<Object>} Updated booking (status = approved)
 */
export async function approveBooking(id) {
    return updateBookingStatus(id, { status: 'approved' })
}

/**
 * Reject a booking (owner action).
 *
 * Only PENDING bookings can be rejected.
 * The backend serializer accepts only the `status` field, so no extra
 * fields (e.g. reason) are sent.
 *
 * @param {number} id - Booking ID
 * @returns {Promise<Object>} Updated booking
 */
export async function rejectBooking(id) {
    return updateBookingStatus(id, { status: 'rejected' })
}

// ─── ADMIN BOOKING OPERATIONS ─────────────────────────────────────────────

/**
 * GET /api/bookings/
 * List all bookings (admin). Supports server-side filtering.
 *
 * @param {Object} filters
 * @param {string} filters.status - booking status
 * @param {string} filters.listing_type - 'house' | 'car'
 * @param {string} filters.rental_type - 'fixed_term' | 'month_to_month'
 * @param {number} filters.property - property ID
 * @param {number} filters.renter - renter user ID
 * @param {number} filters.owner - recipient owner user ID
 * @param {string} filters.start_date_from - YYYY-MM-DD
 * @param {string} filters.start_date_to - YYYY-MM-DD
 * @param {string} filters.end_date_from - YYYY-MM-DD
 * @param {string} filters.end_date_to - YYYY-MM-DD
 * @param {string} filters.search - booking reference search (case-insensitive)
 * @returns {Promise<Array|Object>} Bookings (array or paginated object)
 */
export async function getAdminBookings(filters = {}) {
    return listBookings(filters)
}

/**
 * GET /api/bookings/{id}/audit/
 * Retrieve the chronological audit history for a booking (admin).
 *
 * @param {number} id - Booking ID
 * @returns {Promise<Array>} Audit events
 */
export async function getBookingAudit(id) {
    return request(`/api/bookings/${id}/audit/`, { method: 'GET' })
}

/**
 * POST /api/bookings/{id}/admin/cancel/
 * Admin-only cancellation. Requires a reason.
 *
 * @param {number} id - Booking ID
 * @param {string} reason - Mandatory reason for the action
 * @returns {Promise<Object>} { detail, status }
 */
export async function adminCancelBooking(id, reason) {
    return request(`/api/bookings/${id}/admin/cancel/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    })
}

/**
 * POST /api/bookings/{id}/admin/expire/
 * Admin-only expiry. Requires a reason.
 *
 * @param {number} id - Booking ID
 * @param {string} reason - Mandatory reason
 * @returns {Promise<Object>} { detail, status }
 */
export async function adminExpireBooking(id, reason) {
    return request(`/api/bookings/${id}/admin/expire/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    })
}

/**
 * POST /api/bookings/{id}/admin/complete/
 * Admin-only completion. Requires a reason.
 *
 * @param {number} id - Booking ID
 * @param {string} reason - Mandatory reason
 * @returns {Promise<Object>} { detail, status }
 */
export async function adminCompleteBooking(id, reason) {
    return request(`/api/bookings/${id}/admin/complete/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    })
}

/**
 * GET /api/bookings/admin/reports/
 * Admin-only booking statistics (server-side aggregation).
 *
 * @param {Object} filters - Optional date/listing filters
 * @returns {Promise<Object>} Report data
 */
export async function getAdminBookingReports(filters = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value)
        }
    })

    const query = params.toString()
    const endpoint = query ? `/api/bookings/admin/reports/?${query}` : '/api/bookings/admin/reports/'
    return request(endpoint, { method: 'GET' })
}

/**
 * Check if a property/vehicle has any blocking bookings for a date range.
 * 
 * This is called before creating a booking to show real-time availability.
 * Backend will also validate during booking creation.
 * 
 * @param {number} propertyId - Property ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD) or null
 * @returns {Promise<boolean>} True if dates are available
 */
export async function checkAvailability(propertyId, startDate, endDate) {
    try {
        // Attempt to create a booking; if it fails due to overlap, return false
        // This is a client-side check only; backend will be authoritative
        const bookings = await listBookings({
            property: propertyId,
            status: 'pending,confirmed',
        })

        // Simple overlap check
        const start = new Date(startDate)
        const end = endDate ? new Date(endDate) : new Date('9999-12-31')

        for (const booking of bookings.results || []) {
            const bookingStart = new Date(booking.start_date)
            const bookingEnd = booking.end_date ? new Date(booking.end_date) : new Date('9999-12-31')

            // Check for overlap: start_a < end_b AND start_b < end_a
            if (start < bookingEnd && bookingStart < end) {
                return false
            }
        }

        return true
    } catch (error) {
        // On error, assume unavailable (safe default)
        return false
    }
}
