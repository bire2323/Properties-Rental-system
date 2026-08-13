import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize image input (string or object) into an absolute URL or null.
 * If the backend returns an absolute URL it is returned unchanged.
 * If a relative path is returned, the API base is prepended.
 */
export function getImageUrl(img) {
  if (!img) return null
  if (typeof img === 'string') {
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    return `${base}${img}`
  }

  if (typeof img === 'object' && img.image) return getImageUrl(img.image)

  return null
}
