const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * Submit the "Become Owner" form using native fetch API
 * @param {FormData} formData - Contains all fields: city, country, address, date_of_birth, phone_number, profile_image (file), agree_to_terms, agree_to_verification
 * @returns {Promise} Response object
 */
export const becomeOwner = async (formData) => {
    // ✅ No need to get token from localStorage – cookies are sent automatically
    // ✅ No need to set Authorization header – cookies handle authentication

    const response = await fetch(`${API_BASE_URL}/api/accounts/become-owner/`, {
        method: 'POST',
        credentials: 'include', // 👈 CRITICAL: Send HTTP‑only cookies
        body: formData,
        // ⚠️ Do NOT set 'Content-Type' header – browser handles it for FormData
    })

    // Parse response
    const data = await response.json()

    // If response is not OK, throw error with the data
    if (!response.ok) {
        throw {
            status: response.status,
            data: data,
            message: data.message || data.error || 'Something went wrong',
        }
    }

    return data
}