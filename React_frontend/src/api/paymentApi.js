/**
 * Payment API Client
 * 
 * Encapsulates payment transaction operations.
 * Integrates with payment providers (Chapa, Telebirr, etc.).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Generic request helper — mirrors the pattern in other API clients.
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
        throw new Error(message)
    }

    return payload
}

// ─── PAYMENT OPERATIONS ────────────────────────────────────────────────────

/**
 * POST /api/payments/
 * Create a payment transaction for a booking.
 * 
 * This initiates payment and returns redirect information if using
 * an external payment provider (Chapa, Telebirr, etc.).
 * 
 * The amount must equal booking.total_amount.
 * Backend will verify the amount matches.
 * 
 * @param {Object} data - Payment data
 * @param {number} data.booking - Booking ID
 * @param {string} data.payment_method - 'chapa', 'telebirr', 'cbe_birr', 'cash', 'other'
 * @param {number} data.amount - Amount to pay (must match booking.total_amount)
 * @returns {Promise<Object>} Payment transaction with redirect URL if applicable
 */
export async function createPayment(data) {
    // Note: This endpoint may not exist yet in the backend.
    // When implemented, it should:
    // 1. Validate booking exists and is in correct state
    // 2. Validate amount matches booking.total_amount
    // 3. Create PaymentTransaction (status='initiated')
    // 4. For Chapa/Telebirr: return redirect URL to payment provider
    // 5. Return transaction reference and redirect URL

    return request('/api/payments/', {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

/**
 * GET /api/payments/{id}/
 * Retrieve a payment transaction.
 * 
 * Shows current status and details.
 * User can only view their own payments.
 * 
 * @param {number} id - Payment transaction ID
 * @returns {Promise<Object>} Payment transaction details
 */
export async function getPayment(id) {
    return request(`/api/payments/${id}/`, { method: 'GET' })
}

/**
 * GET /api/payments/
 * List payment transactions for the authenticated user.
 * 
 * Renters see their payment transactions.
 * Owners see payments for their bookings.
 * Admins see all payments.
 * 
 * @param {Object} filters - Optional query filters
 * @param {number} filters.booking - Filter by booking ID
 * @param {string} filters.status - Filter by status (initiated, pending, successful, failed, etc.)
 * @returns {Promise<Object>} Paginated list of payments
 */
export async function listPayments(filters = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value)
        }
    })

    const query = params.toString()
    const endpoint = query ? `/api/payments/?${query}` : '/api/payments/'

    return request(endpoint, { method: 'GET' })
}

/**
 * GET /api/payments/lookup/?tx_ref=...
 * Resolve a booking from a Chapa transaction reference.
 *
 * Called when the renter returns to /payment-result after Chapa's hosted
 * checkout. The backend only reads its own DB state — it does NOT verify with
 * Chapa and does NOT confirm anything, so the Chapa browser return "status" is
 * never trusted. The authoritative confirmation happens via the webhook /
 * callback / verify flow.
 *
 * @param {string} txRef - Chapa transaction reference (tx_ref / trx_ref)
 * @returns {Promise<Object>} { booking, booking_reference, booking_status, tx_ref, payment_id, payment_status }
 */
export async function lookupPaymentByTxRef(txRef) {
    return request(`/api/payments/lookup/?tx_ref=${encodeURIComponent(txRef)}`, { method: 'GET' })
}

/**
 * POST /api/payments/{id}/verify/
 * Verify a payment after provider callback.
 * 
 * Called when payment provider redirects back to the app.
 * Backend will:
 * 1. Query payment provider for transaction status
 * 2. Update PaymentTransaction.status
 * 3. If successful, confirm the booking
 * 4. Return updated payment and booking status
 * 
 * @param {number} id - Payment transaction ID
 * @param {Object} data - Verification data (provider callback params)
 * @returns {Promise<Object>} Updated payment transaction
 */
export async function verifyPayment(id, data = {}) {
    return request(`/api/payments/${id}/verify/`, {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

/**
 * GET /api/payments/{id}/status/
 * Check payment status without verifying.
 * 
 * Useful for polling payment status.
 * Frontend can call this periodically while waiting for payment confirmation.
 * 
 * @param {number} id - Payment transaction ID
 * @returns {Promise<Object>} Payment status
 */
export async function checkPaymentStatus(id) {
    return request(`/api/payments/${id}/status/`, { method: 'GET' })
}

/**
 * POST /api/payments/{id}/retry/
 * Retry a failed payment.
 * 
 * Only available if the booking is still in a state that allows retry.
 * Returns new redirect URL to payment provider.
 * 
 * @param {number} id - Payment transaction ID
 * @returns {Promise<Object>} Retry payment transaction
 */
export async function retryPayment(id) {
    return request(`/api/payments/${id}/retry/`, {
        method: 'POST',
        body: JSON.stringify({}),
    })
}

/**
 * Get payment status for a specific booking.
 * 
 * Helper function to fetch the latest payment for a booking.
 * 
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object|null>} Latest payment transaction or null if none
 */
export async function getBookingPaymentStatus(bookingId) {
    try {
        const result = await listPayments({
            booking: bookingId,
            ordering: '-created_at',
        })

        return result.results?.[0] || null
    } catch (error) {
        console.error('Failed to fetch payment status:', error)
        return null
    }
}

/**
 * Initialize Chapa payment (if using Chapa provider).
 * 
 * Helper to prepare Chapa-specific payment data.
 * Actual integration depends on backend Chapa client.
 * 
 * @param {Object} bookingData - Booking information
 * @param {string} bookingData.booking_reference - Booking reference
 * @param {number} bookingData.total_amount - Amount to pay
 * @param {string} bookingData.currency - Currency code
 * @param {string} bookingData.renter_email - Renter email
 * @returns {Promise<Object>} Chapa payment initialization
 */
export async function initiateChapaPayment(bookingData) {
    return createPayment({
        booking: bookingData.id,
        payment_method: 'chapa',
        amount: bookingData.total_amount,
    })
}

/**
 * Initialize Telebirr payment (if using Telebirr provider).
 * 
 * Helper to prepare Telebirr-specific payment data.
 * 
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Object>} Telebirr payment initialization
 */
export async function initiateTelebirrPayment(bookingData) {
    return createPayment({
        booking: bookingData.id,
        payment_method: 'telebirr',
        amount: bookingData.total_amount,
    })
}

/**
 * Webhook handler for payment provider callbacks.
 * 
 * Called by payment provider (Chapa, Telebirr) when payment status changes.
 * This should be a backend endpoint, but documented here for reference.
 * 
 * POST /api/payments/webhook/
 * {
 *   provider: 'chapa' | 'telebirr',
 *   transaction_ref: '...',
 *   status: 'success' | 'failed',
 *   timestamp: '...',
 *   signature: '...'  (HMAC verification)
 * }
 * 
 * Backend should:
 * 1. Verify HMAC signature
 * 2. Find PaymentTransaction by provider_reference
 * 3. Update status
 * 4. If successful, confirm booking
 * 5. Return 200 OK
 */
export const WEBHOOK_ENDPOINT = '/api/payments/webhook/'
