import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createBooking as apiCreateBooking, getBooking as apiGetBooking } from '../api/bookingApi'
import {
  calculateBookingPricing,
  mapPropertyForBooking,
} from '../lib/bookingUtils'

const BookingContext = createContext(null)

const INITIAL_FORM = {
  checkIn: '',
  checkOut: '',
  pickupTime: '',
  returnTime: '',
  guests: 1,
  notes: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  dateOfBirth: '',
  gender: '',
  idType: 'national_id',
  idNumber: '',
  idDocuments: [],
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: '',
  rentalType: 'fixed_term',
  moveInDate: '',
  rentalDuration: 3,
  durationUnit: 'month',
  numberOfTenants: 1,
  rentalPurpose: 'residential',
  pickupPurpose: 'personal',
  termsAccepted: false,
  informationConfirmed: false,
}

const INITIAL_PAYMENT = {
  method: 'chapa',
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
  mobileNumber: '',
  bankReference: '',
}

export function BookingProvider({ children }) {
  // Property and form data
  const [property, setProperty] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [payment, setPayment] = useState(INITIAL_PAYMENT)

  // Backend booking state
  const [booking, setBooking] = useState(null)
  const [bookingId, setBookingId] = useState(null)
  const [bookingReference, setBookingReference] = useState('')
  const [bookingStatus, setBookingStatus] = useState(null)  // PENDING, CONFIRMED, REJECTED, CANCELLED, etc.
  const [backendPricing, setBackendPricing] = useState(null)  // Authoritative pricing from backend

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)  // For payment transaction status

  const loadProperty = useCallback((apiProperty) => {
    setProperty(mapPropertyForBooking(apiProperty))
  }, [])

  const updateForm = useCallback((updates) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  const updatePayment = useCallback((updates) => {
    setPayment((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * Calculate estimated pricing for display only.
   * This is NOT authoritative - backend calculates the real amount.
   * Used only to show user an estimate before submission.
   */
  const estimatedPricing = useMemo(() => {
    if (!property) return null

    // For cars: use checkIn/checkOut; for houses: use moveInDate with rentalDuration
    const isHouse = property.listingType !== 'car'

    return calculateBookingPricing({
      priceRaw: property.priceRaw,
      rentalUnit: property.rentalUnit,
      checkIn: isHouse ? form.moveInDate : form.checkIn,
      checkOut: isHouse ? null : form.checkOut,
      securityDeposit: property.securityDeposit,
      listingType: property.listingType,
      rentalDuration: form.rentalDuration,
      durationUnit: form.durationUnit,
    })
  }, [property, form.checkIn, form.checkOut, form.moveInDate, form.rentalDuration, form.durationUnit])

  /**
   * Return backend pricing if available (authoritative), otherwise estimated pricing.
   * Frontend should use this to display the actual amount the user will pay.
   */
  const pricing = useMemo(() => {
    // If we have a backend booking with pricing, use it
    if (backendPricing) {
      return {
        nights: backendPricing.nights || 0,
        units: backendPricing.units || 1,
        unitLabel: backendPricing.unitLabel || 'unit',
        rentalSubtotal: parseFloat(backendPricing.base_price || 0),
        serviceFee: parseFloat(backendPricing.platform_fee_amount || 0),
        securityDeposit: parseFloat(backendPricing.security_deposit || 0),
        total: parseFloat(backendPricing.total_amount || 0),
        commission: parseFloat(backendPricing.platform_commission_rate || 0),
        ownerPayout: parseFloat(backendPricing.owner_payout_amount || 0),
        currency: backendPricing.currency || 'ETB',
      }
    }
    // Otherwise return estimated pricing (will be overridden when booking is created)
    return estimatedPricing
  }, [backendPricing, estimatedPricing])

  /**
   * Submit a booking to the backend.
   * This creates the actual booking and returns the backend response with pricing.
   */
  const submitBooking = useCallback(async (propertyId, rentalType, startDate, endDate) => {
    try {
      setIsLoading(true)
      setError(null)

      const bookingData = {
        property: propertyId,
        start_date: startDate,
        ...(endDate && { end_date: endDate }),
        ...(rentalType && { rental_type: rentalType }),
      }

      const response = await apiCreateBooking(bookingData)

      // Store backend booking data
      setBooking(response)
      setBookingId(response.id)
      setBookingReference(response.booking_reference)
      setBookingStatus(response.status)  // Should be PENDING
      setBackendPricing(response)  // Store all pricing data from backend

      return response
    } catch (err) {
      const message = err.message || 'Failed to create booking'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Fetch a booking from the backend to get its current status.
   * Useful for polling approval status.
   */
  const fetchBooking = useCallback(async (id) => {
    try {
      setIsLoading(true)
      const response = await apiGetBooking(id)

      setBooking(response)
      setBookingId(response.id)
      setBookingReference(response.booking_reference)
      setBookingStatus(response.status)
      setBackendPricing(response)  // Update pricing in case it changed

      return response
    } catch (err) {
      setError(err.message || 'Failed to fetch booking')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Start polling for booking approval status.
   * Renter checks if owner has approved the booking.
   */
  const startApprovalPolling = useCallback((bookingId, interval = 3000) => {
    const pollInterval = setInterval(async () => {
      try {
        const booking = await fetchBooking(bookingId)
        // Stop polling once booking is confirmed or rejected
        if (booking.status !== 'pending') {
          clearInterval(pollInterval)
        }
      } catch (err) {
        // Silently fail; user can manually refresh
      }
    }, interval)

    return () => clearInterval(pollInterval)
  }, [fetchBooking])

  const resetBooking = useCallback(() => {
    setProperty(null)
    setForm(INITIAL_FORM)
    setPayment(INITIAL_PAYMENT)
    setBooking(null)
    setBookingId(null)
    setBookingReference('')
    setBookingStatus(null)
    setBackendPricing(null)
    setIsLoading(false)
    setError(null)
    setPaymentStatus(null)
  }, [])

  const value = useMemo(
    () => ({
      // Property and form data
      property,
      form,
      payment,

      // Pricing (backend authoritative when available)
      pricing,
      estimatedPricing,

      // Backend booking state
      booking,
      bookingId,
      bookingReference,
      bookingStatus,
      backendPricing,

      // UI state
      isLoading,
      error,
      paymentStatus,

      // Actions
      loadProperty,
      updateForm,
      updatePayment,
      submitBooking,       // Real API call to create booking
      fetchBooking,        // Fetch booking status from backend
      startApprovalPolling, // Poll for owner approval
      resetBooking,
    }),
    [
      property,
      form,
      payment,
      pricing,
      estimatedPricing,
      booking,
      booking,
      bookingId,
      bookingReference,
      bookingStatus,
      backendPricing,
      isLoading,
      error,
      paymentStatus,
      loadProperty,
      updateForm,
      updatePayment,
      submitBooking,
      fetchBooking,
      startApprovalPolling,
      resetBooking,
    ]
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}


export function useBooking() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider')
  }
  return context
}
