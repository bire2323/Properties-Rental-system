const envSiteUrl = import.meta.env?.VITE_SITE_URL

export const SITE_NAME = 'GetSpace'

export const SITE_URL =
  envSiteUrl && !/^https?:\/\/localhost/.test(envSiteUrl) && !/^http:\/\/127\.0\.0\.1/.test(envSiteUrl)
    ? envSiteUrl.replace(/\/+$/, '')
    : 'https://getspace-v1.vercel.app'

export const DEFAULT_DESCRIPTION =
  'Find homes, apartments, and rental properties with GetSpace. Search properties by location, price, property type, and more.'

export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200'

export function withSiteName(title) {
  return `${title} | ${SITE_NAME}`
}

export function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return SITE_URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}