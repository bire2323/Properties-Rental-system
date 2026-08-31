import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  calculateBookingPricing,
  generateBookingReference,
  mapPropertyForBooking,
} from '../lib/bookingUtils'

const BookingContext = createContext(null)

const INITIAL_FORM = {
  checkIn: '',
  checkOut: '',
  guests: 1,
  notes: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
}

const INITIAL_PAYMENT = {
  method: 'card',
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
  mobileNumber: '',
  bankReference: '',
}

export function BookingProvider({ children }) {
  const [property, setProperty] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [payment, setPayment] = useState(INITIAL_PAYMENT)
  const [bookingReference, setBookingReference] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('pending')

  const loadProperty = useCallback((apiProperty) => {
    setProperty(mapPropertyForBooking(apiProperty))
  }, [])

  const updateForm = useCallback((updates) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  const updatePayment = useCallback((updates) => {
    setPayment((prev) => ({ ...prev, ...updates }))
  }, [])

  const pricing = useMemo(() => {
    if (!property) return null
    return calculateBookingPricing({
      priceRaw: property.priceRaw,
      rentalUnit: property.rentalUnit,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      securityDeposit: property.securityDeposit,
    })
  }, [property, form.checkIn, form.checkOut])

  const finalizeMockBooking = useCallback(() => {
    const reference = generateBookingReference()
    setBookingReference(reference)
    setPaymentStatus('submitted')
    return reference
  }, [])

  const resetBooking = useCallback(() => {
    setProperty(null)
    setForm(INITIAL_FORM)
    setPayment(INITIAL_PAYMENT)
    setBookingReference('')
    setPaymentStatus('pending')
  }, [])

  const value = useMemo(
    () => ({
      property,
      form,
      payment,
      pricing,
      bookingReference,
      paymentStatus,
      loadProperty,
      updateForm,
      updatePayment,
      finalizeMockBooking,
      resetBooking,
    }),
    [
      property,
      form,
      payment,
      pricing,
      bookingReference,
      paymentStatus,
      loadProperty,
      updateForm,
      updatePayment,
      finalizeMockBooking,
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
