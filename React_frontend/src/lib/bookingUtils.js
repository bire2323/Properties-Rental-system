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
  const listingType = property.listing_type || property.property_type || 'house'
  const detail = listingType === 'car' ? (property.car_detail || {}) : (property.house_detail || {})
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
    listingType,
    propertyType: property.property_type || (listingType === 'car' ? 'Vehicle' : 'House'),
    detail,
    ownerName: property.company?.name || property.owner_email || 'Listing owner',
    brand: property.car_detail?.brand || '',
    model: property.car_detail?.model || '',
    year: property.car_detail?.year || '',
    plateNumber: property.car_detail?.plate_number || property.car_detail?.plateNumber || '',
    vehicleType: [property.car_detail?.brand, property.car_detail?.model].filter(Boolean).join(' '),
    fuelType: property.car_detail?.fuel_type || '',
    seatingCapacity: property.car_detail?.seating_capacity || '',
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
export function calculateBookingPricing({ priceRaw, rentalUnit, checkIn, checkOut, securityDeposit = 0, listingType = 'house', rentalDuration = 3, durationUnit = 'year' }) {
  if (listingType === 'house') {
    const durationValue = Math.max(1, Number(rentalDuration) || 3)
    const unitLabel = (durationUnit || 'year').toLowerCase()
    const multiplier = 3
    const rentalSubtotal = priceRaw * multiplier
    const total = rentalSubtotal + securityDeposit

    return {
      nights: 0,
      units: durationValue,
      unitLabel,
      rentalSubtotal,
      serviceFee: 0,
      securityDeposit,
      total,
    }
  }

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

  let units
  let unitLabel

  units = nights
  unitLabel = 'day'

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
  const total = rentalSubtotal + securityDeposit

  return {
    nights,
    units,
    unitLabel,
    rentalSubtotal,
    serviceFee: 0,
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

export function getMaxDateOfBirth() {
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() - 18)
  maxDate.setHours(0, 0, 0, 0)
  return maxDate.toISOString().slice(0, 10)
}

export function isValidEthiopianPhone(phone = '') {
  const normalized = phone.trim()
  if (!normalized) return false

  const localPattern = /^(09\d{8}|07\d{8})$/
  const intlPattern = /^\+251\s?(9\d{8}|7\d{8})$/

  return localPattern.test(normalized) || intlPattern.test(normalized)
}

export function isAdultDateOfBirth(dateValue) {
  if (!dateValue) return false

  const birthDate = parseDateValue(dateValue)
  if (!birthDate) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const minimumAgeDate = new Date(today)
  minimumAgeDate.setFullYear(today.getFullYear() - 18)

  return birthDate <= minimumAgeDate
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
