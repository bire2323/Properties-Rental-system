import { getImageUrl } from './utils'

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
})

/**
 * Shared presentation metadata for each booking status.
 * Badge + lifecycle helper text used across owner and tenant dashboards.
 *
 * Colour semantics: amber/gold = waiting or requires an action, green =
 * approved/confirmed/success, red = rejected, neutral = cancelled/expired.
 */
export const BOOKING_STATUS_META = Object.freeze({
  [BOOKING_STATUS.PENDING]: {
    label: 'Pending',
    text: 'Awaiting owner approval',
    dot: 'bg-amber-400',
    badge:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  },
  [BOOKING_STATUS.APPROVED]: {
    label: 'Approved',
    text: 'Approved — payment required',
    dot: 'bg-[#c99b43]',
    badge:
      'bg-[#c99b43]/10 text-[#b98227] dark:bg-[#c99b43]/15 dark:text-[#f3c96d]',
  },
  [BOOKING_STATUS.CONFIRMED]: {
    label: 'Confirmed',
    text: 'Payment verified — booking confirmed',
    dot: 'bg-emerald-400',
    badge:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  [BOOKING_STATUS.REJECTED]: {
    label: 'Rejected',
    text: 'Request declined by owner',
    dot: 'bg-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  },
  [BOOKING_STATUS.CANCELLED]: {
    label: 'Cancelled',
    text: 'Booking cancelled',
    dot: 'bg-slate-400',
    badge:
      'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  [BOOKING_STATUS.COMPLETED]: {
    label: 'Completed',
    text: 'Booking completed',
    dot: 'bg-blue-400',
    badge:
      'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
  },
  [BOOKING_STATUS.EXPIRED]: {
    label: 'Expired',
    text: 'Request expired before approval',
    dot: 'bg-slate-400',
    badge:
      'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
})

export function getStatusMeta(status) {
  return (
    BOOKING_STATUS_META[status] || {
      label: String(status || 'Unknown').toUpperCase(),
      text: 'Unknown status',
      dot: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
    }
  )
}

/**
 * The single source of truth for the renter's "next step" copy shown next to
 * each booking status (My Bookings cards, payment page, booking summary).
 */
export function getStatusNextStep(status) {
  const steps = {
    [BOOKING_STATUS.PENDING]: 'No payment required yet — awaiting owner approval.',
    [BOOKING_STATUS.APPROVED]: 'Payment required — complete your secure payment.',
    [BOOKING_STATUS.CONFIRMED]: 'Payment verified — your booking is confirmed.',
    [BOOKING_STATUS.REJECTED]: 'The owner was unable to approve this request.',
    [BOOKING_STATUS.CANCELLED]: 'This booking was cancelled.',
    [BOOKING_STATUS.COMPLETED]: 'This booking has been completed.',
    [BOOKING_STATUS.EXPIRED]: 'This request expired before it was approved.',
  }
  return steps[status] || `Status: ${String(status || 'Unknown').toUpperCase()}`
}

/**
 * Renter can cancel PENDING or APPROVED (pre-payment) bookings (backend enforced via DELETE).
 */
export function canRenterCancel(status) {
  return status === BOOKING_STATUS.PENDING || status === BOOKING_STATUS.APPROVED
}

/**
 * Owner can review (approve/reject) only PENDING bookings.
 */
export function canOwnerReview(status) {
  return status === BOOKING_STATUS.PENDING
}

export function formatRentalType(rentalType) {
  if (rentalType === 'month_to_month') return 'Month to month'
  if (rentalType === 'fixed_term') return 'Fixed term'
  return String(rentalType || '—').replace(/_/g, ' ')
}

export function formatListingType(listingType) {
  if (listingType === 'car') return 'Vehicle'
  if (listingType === 'house') return 'House'
  return String(listingType || 'Listing').replace(/_/g, ' ')
}

export function formatDisplayDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatCreatedDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatAmount(value, currency = 'ETB') {
  const amount = Number(value) || 0
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Resolve an identity-document URL returned by the booking serializer.
 * The serializer builds document_url as an ABSOLUTE URL when a request
 * context is present (request.build_absolute_uri), so it is rendered as-is.
 * Only when a relative path slips through (requests serialized without a
 * request context) is the API base prepended.
 */
export function resolveDocumentUrl(value) {
  if (!value) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value
  return `${DEFAULT_API_BASE_URL}${value}`
}

/**
 * A safe placeholder image used when the booking serializer does not
 * include a property image (it currently only returns property id/name/type).
 */
export function listingPlaceholderImage(listingType) {
  if (listingType === 'car') {
    return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=640&q=70'
  }
  return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=640&q=70'
}

/**
 * Normalize a raw image (string or { image }) to an absolute URL, falling
 * back to the placeholder for the listing type when unavailable.
 */
export function resolveBookingImage(rawImage, listingType) {
  const url = getImageUrl(rawImage)
  return url || listingPlaceholderImage(listingType)
}
