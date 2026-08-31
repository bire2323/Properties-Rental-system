import { getImageUrl } from './utils'

/** Mock service fee rate — replace with backend value later. */
export const SERVICE_FEE_RATE = 0.05

/**
 * Maps a property API response into a booking-friendly snapshot.
 * Keeps UI components decoupled from raw API shape.
 */
export function mapPropertyForBooking(property) {
  const images = property.images || []
  const mainImage = images[0]?.image || images[0]?.image_url || ''
  const location = [property.city, property.region, property.kebele]
    .filter(Boolean)
    .join(', ') || property.address || 'Location unspecified'

  return {
    id: property.id,
    title: property.property_name || property.title || 'Property',
    location,
    image: getImageUrl(mainImage) || mainImage,
    priceRaw: parseFloat(property.price) || 0,
    rentalUnit: property.rental_unit || 'monthly',
    securityDeposit: parseFloat(property.security_deposit) || 0,
    listingType: property.listing_type || property.property_type || 'house',
    currency: property.currency || 'ETB',
  }
}

export function parseDateValue(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDisplayDate(value) {
  const date = parseDateValue(value)
  if (!date) return '—'
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function calculateNights(checkIn, checkOut) {
  const start = parseDateValue(checkIn)
  const end = parseDateValue(checkOut)
  if (!start || !end || end <= start) return 0
  const diffMs = end.getTime() - start.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Frontend-only pricing logic — structured for easy backend replacement.
 */
export function calculateBookingPricing({ priceRaw, rentalUnit, checkIn, checkOut, securityDeposit = 0 }) {
  const nights = calculateNights(checkIn, checkOut)
  if (nights <= 0) {
    return {
      nights: 0,
      units: 0,
      unitLabel: rentalUnit,
      rentalSubtotal: 0,
      serviceFee: 0,
      securityDeposit,
      total: securityDeposit,
    }
  }

  let units = nights
  let unitLabel = 'night'

  switch (rentalUnit) {
    case 'weekly':
      units = Math.max(1, Math.ceil(nights / 7))
      unitLabel = 'week'
      break
    case 'monthly':
      units = Math.max(1, Math.ceil(nights / 30))
      unitLabel = 'month'
      break
    case 'daily':
    default:
      units = nights
      unitLabel = 'day'
      break
  }

  const rentalSubtotal = priceRaw * units
  const serviceFee = Math.round(rentalSubtotal * SERVICE_FEE_RATE)
  const total = rentalSubtotal + serviceFee + securityDeposit

  return {
    nights,
    units,
    unitLabel,
    rentalSubtotal,
    serviceFee,
    securityDeposit,
    total,
  }
}

export function formatCurrency(amount, currency = 'ETB') {
  const value = Number(amount) || 0
  return `${currency} ${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function generateBookingReference() {
  const segment = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `NX-BK-${segment}`
}

export function getMinCheckInDate() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString().slice(0, 10)
}

export function validateBookingDetails({ checkIn, checkOut, guests }) {
  const errors = {}
  const start = parseDateValue(checkIn)
  const end = parseDateValue(checkOut)
  const minDate = getMinCheckInDate()

  if (!checkIn) errors.checkIn = 'Check-in date is required.'
  if (!checkOut) errors.checkOut = 'Check-out date is required.'
  if (checkIn && checkIn < minDate) errors.checkIn = 'Check-in cannot be in the past.'
  if (start && end && end <= start) errors.checkOut = 'Check-out must be after check-in.'
  if (!guests || Number(guests) < 1) errors.guests = 'At least 1 guest is required.'

  return errors
}
