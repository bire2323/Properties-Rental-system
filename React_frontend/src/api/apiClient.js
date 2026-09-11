/**
 * Shared API fetch client.
 *
 * Every API module routes its requests through `apiFetch`, which:
 *  - attaches HttpOnly cookies (`credentials: 'include'`)
 *  - sets `Content-Type: application/json` unless the body is FormData or
 *    a multipart header was already provided
 *  - on 401 refreshes the access cookie via POST /api/accounts/token/refresh/
 *    and retries the original request once
 *  - converts unreachable-backend errors (browser "Failed to fetch") into a
 *    friendly "Unable to connect" message so callers never surface raw network
 *    errors to the user
 *
 * Concurrent 401s share a single in-flight refresh (deduplicated), so a burst
 * of requests (e.g. parallel dashboard calls after a stale access cookie)
 * triggers exactly one refresh round-trip. The refresh endpoint never refreshes
 * itself, so it cannot recurse.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const CONNECT_ERROR_MESSAGE =
    'Unable to connect to the server. Please check your internet connection and try again.'

let refreshInFlight = null

function buildHeaders(options) {
    const headers = { ...(options.headers || {}) }
    if (!(options.body instanceof FormData) && headers['Content-Type'] !== 'multipart/form-data') {
        headers['Content-Type'] = 'application/json'
    }
    return headers
}

function refreshCookie() {
    if (!refreshInFlight) {
        refreshInFlight = fetch(`${API_BASE_URL}/api/accounts/token/refresh/`, {
            method: 'POST',
            credentials: 'include',
        }).finally(() => {
            refreshInFlight = null
        })
    }
    return refreshInFlight
}

function fetchOnce(endpoint, options) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: buildHeaders(options),
        ...options,
    }).catch((error) => {
        // Browser fetch rejects with a bare "Failed to fetch" when the backend
        // is unreachable. Surface a human-friendly message instead. Aborts are
        // passed through so callers can still detect intentional cancellations.
        if (error && error.name === 'AbortError') {
            throw error
        }
        throw new Error(CONNECT_ERROR_MESSAGE, { cause: error })
    })
}

/**
 * Perform a request with automatic session refresh.
 *
 * @param {string} endpoint - API path starting with '/api/...'
 * @param {Object} options - fetch options (method, headers, body, ...)
 * @param {Object} config
 * @param {boolean} [config.noRefresh=false] - Skip the 401 refresh/retry.
 *   Must be true for the refresh endpoint itself.
 * @returns {Promise<Response>} The final Response (original 401 is preserved
 *   when refresh fails, so callers can surface auth errors cleanly).
 */
export async function apiFetch(endpoint, options = {}, config = {}) {
    const { noRefresh = false } = config
    let response = await fetchOnce(endpoint, options)

    if (response.status === 401 && !noRefresh) {
        try {
            const refreshResponse = await refreshCookie()
            if (refreshResponse.ok) {
                response = await fetchOnce(endpoint, options)
            }
        } catch {
            // Refresh failed — keep the original 401 so the caller can handle it.
        }
    }

    return response
}