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
 * On error, throws an Error with:
 * - message: user-friendly error message
 * - response: full error response object (for field-level errors)
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
            payload?.non_field_errors?.[0] ||
            payload?.message ||
            payload?.error ||
            'Request failed.'

        const error = new Error(message)
        error.response = payload
        throw error
    }

    return payload
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
 * This is a helper that wraps updateBookingStatus for clarity.
 * In the current backend, approval is implicit (owner just waits for payment).
 * This function can be used when an explicit approval endpoint is added.
 * 
 * @param {number} id - Booking ID
 * @returns {Promise<Object>} Updated booking
 */
export async function approveBooking(id) {
    // If backend supports explicit approval:
    // return updateBookingStatus(id, { status: 'approved' })

    // For now, this is a no-op; approval happens when owner is ready
    // and renter proceeds to payment
    return getBooking(id)
}

/**
 * Reject a booking (owner action).
 * 
 * Only PENDING bookings can be rejected.
 * 
 * @param {number} id - Booking ID
 * @param {string} reason - Optional rejection reason
 * @returns {Promise<Object>} Updated booking
 */
export async function rejectBooking(id, reason = '') {
    return updateBookingStatus(id, {
        status: 'rejected',
        ...(reason && { reason }),
    })
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
