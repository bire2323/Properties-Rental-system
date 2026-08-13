const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * Submit the "Become Owner" form using native fetch API
 * @param {FormData} formData - Contains all fields: city, country, address, date_of_birth, phone_number, profile_image (file), agree_to_terms, agree_to_verification
 * @returns {Promise} Response object
 */
export const becomeOwner = async (formData) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token')

    // Build headers
    const headers = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    // ⚠️ Do NOT set 'Content-Type' header manually when sending FormData
    // The browser will automatically set it with the correct boundary

    const response = await fetch(`${API_BASE_URL}/accounts/become-owner/`, {
        method: 'POST',
        headers: headers,
        body: formData,
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