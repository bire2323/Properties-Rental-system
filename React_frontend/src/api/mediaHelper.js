const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Resolve media URLs from the backend
 * Handles both absolute and relative URLs
 */
export function resolveMediaUrl(value) {
    if (!value) return null
    if (typeof value !== 'string') return value
    if (value.startsWith('http://') || value.startsWith('https://')) return value
    if (value.startsWith('/')) return `${API_BASE_URL}${value}`
    return `${API_BASE_URL}/${value}`
}

/**
 * Extract image URL from property image object
 * Handles both PropertyImage objects and string URLs
 */
export function getImageUrl(imageData) {
    if (!imageData) return null
    if (typeof imageData === 'string') return resolveMediaUrl(imageData)
    if (imageData.image) return resolveMediaUrl(imageData.image)
    return null
}
