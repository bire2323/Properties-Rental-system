import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import BookingProgress from '../../components/booking/BookingProgress'
import BookingForm from '../../components/booking/BookingForm'
import BookingSummary from '../../components/booking/BookingSummary'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { getPropertyById } from '../../api/property/propertyApi'
import { useAuth } from '../../hooks/useAuth'
import { useBooking } from '../../context/BookingContext'
import {
  buildBookingPayload,
  formatCurrency,
  getMaxDateOfBirth,
  isAdultDateOfBirth,
  isValidEthiopianPhone,
  RENTAL_TYPES,
  validateBookingDetails,
} from '../../lib/bookingUtils'

export default function BookingCheckout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const reduceMotion = useReducedMotion()
  const {
    property,
    form,
    pricing,
    loadProperty,
    updateForm,
    submitBooking,
    isLoading: isSubmittingBooking,
  } = useBooking()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: `/properties/${id}/book` } })
    }
  }, [authLoading, isAuthenticated, navigate, id])

  useEffect(() => {
    if (user && !form.contactEmail) {
      updateForm({
        contactName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        contactEmail: user.email || '',
        contactPhone: user.phone_number || '',
      })
    }
  }, [user, form.contactEmail, updateForm])

  useEffect(() => {
    let cancelled = false

    async function fetchProperty() {
      if (!id) {
        setError('Property ID is missing.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getPropertyById(id)
        if (!cancelled) {
          loadProperty(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load property.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchProperty()
    return () => {
      cancelled = true
    }
  }, [id, loadProperty])

  const getFieldValidationErrors = (nextForm = form) => {
    const fieldErrors = {}
    const namePattern = /^[A-Za-z][A-Za-z\s.'-]*$/
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (nextForm.contactName && !namePattern.test(nextForm.contactName.trim())) {
      fieldErrors.contactName = 'Numbers are not allowed in name.'
    }
    if (nextForm.contactPhone && !isValidEthiopianPhone(nextForm.contactPhone)) {
      fieldErrors.contactPhone = 'Use a valid Ethiopian mobile number starting with +251, 09 or 07.'
    }
    if (nextForm.contactEmail && !emailPattern.test(nextForm.contactEmail.trim())) {
      fieldErrors.contactEmail = 'Please enter a valid email address.'
    }
    if (nextForm.dateOfBirth && !isAdultDateOfBirth(nextForm.dateOfBirth)) {
      fieldErrors.dateOfBirth = 'You must be at least 18 years old.'
    }
    if (nextForm.emergencyName && !namePattern.test(nextForm.emergencyName.trim())) {
      fieldErrors.emergencyName = 'Numbers are not allowed in emergency contact name.'
    }
    if (nextForm.emergencyPhone && !isValidEthiopianPhone(nextForm.emergencyPhone)) {
      fieldErrors.emergencyPhone = 'Use a valid Ethiopian mobile number starting with +251, 09 or 07.'
    }

    return fieldErrors
  }

  const handleFormChange = (updates) => {
    const nextForm = { ...form, ...updates }
    updateForm(updates)

    setErrors((prev) => {
      const nextErrors = { ...prev }
      Object.keys(updates).forEach((key) => {
        if (key in nextErrors) delete nextErrors[key]
      })

      const fieldErrors = getFieldValidationErrors(nextForm)
      return { ...nextErrors, ...fieldErrors }
    })
  }

  const handleContinue = async () => {
    const validationErrors = {
      ...(property.listingType === 'car' ? validateBookingDetails(form) : {}),
      ...(!form.contactName.trim() ? { contactName: 'Full name is required.' } : {}),
      ...(!/^[A-Za-z][A-Za-z\s.'-]*$/.test(form.contactName.trim()) ? { contactName: 'Numbers are not allowed in name.' } : {}),
      ...(!form.contactPhone.trim() ? { contactPhone: 'Phone number is required.' } : {}),
      ...(!isValidEthiopianPhone(form.contactPhone) ? { contactPhone: 'Use a valid Ethiopian mobile number starting with +251, 09 or 07.' } : {}),
      ...(!form.contactEmail.trim() ? { contactEmail: 'Email is required.' } : {}),
      ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim()) ? { contactEmail: 'Please enter a valid email address.' } : {}),
      ...(!form.dateOfBirth ? { dateOfBirth: 'Date of birth is required.' } : {}),
      ...(!isAdultDateOfBirth(form.dateOfBirth) ? { dateOfBirth: 'You must be at least 18 years old.' } : {}),
      ...(!form.gender ? { gender: 'Select a gender.' } : {}),
      ...(!form.idType ? { idType: 'Select an ID type.' } : {}),
      ...(!form.idNumber.trim() ? { idNumber: 'ID number is required.' } : {}),
      ...(form.idDocuments.length < 2 ? { idDocuments: 'Please upload at least 2 ID images.' } : {}),
      ...(!form.emergencyName.trim() ? { emergencyName: 'Emergency contact name is required.' } : {}),
      ...(!/^[A-Za-z][A-Za-z\s.'-]*$/.test(form.emergencyName.trim()) ? { emergencyName: 'Numbers are not allowed in emergency contact name.' } : {}),
      ...(!form.emergencyPhone.trim() ? { emergencyPhone: 'Emergency contact phone is required.' } : {}),
      ...(!isValidEthiopianPhone(form.emergencyPhone) ? { emergencyPhone: 'Use a valid Ethiopian mobile number starting with +251, 09 or 07.' } : {}),
      ...(!form.emergencyRelationship.trim() ? { emergencyRelationship: 'Relationship is required.' } : {}),
      ...(!form.informationConfirmed || !form.termsAccepted ? { terms: 'Confirm your information and accept the rental terms.' } : {}),
    }

    if (property.listingType === 'car') {
      Object.assign(validationErrors, {
        ...(!form.checkIn ? { checkIn: 'Pickup date is required.' } : {}),
        ...(!form.checkOut ? { checkOut: 'Return date is required.' } : {}),
        ...(!form.pickupTime ? { pickupTime: 'Pickup time is required.' } : {}),
        ...(!form.returnTime ? { returnTime: 'Return time is required.' } : {}),
        ...(!form.pickupPurpose ? { pickupPurpose: 'Select a rental purpose.' } : {}),
      })
      if (form.checkIn && form.checkOut && new Date(form.checkOut) <= new Date(form.checkIn)) {
        validationErrors.checkOut = 'Return date must be after pickup date.'
      }
    } else {
      Object.assign(validationErrors, {
        ...(!form.moveInDate ? { moveInDate: 'Move-in date is required.' } : {}),
        ...(!form.rentalDuration || Number(form.rentalDuration) < 1 ? { rentalDuration: 'Enter a valid rental duration.' } : {}),
        ...(!form.numberOfTenants || Number(form.numberOfTenants) < 1 ? { numberOfTenants: 'Enter the number of tenants.' } : {}),
      })
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload = buildBookingPayload({ property, form })
    if (!payload || !payload.start_date || !payload.property) {
      setErrors({ general: 'Please complete the required booking details before submitting.' })
      return
    }

    if (!pricing || (property.listingType === 'car' ? pricing.nights <= 0 : pricing.total <= 0)) {
      setErrors({ general: property.listingType === 'car' ? 'Please select valid check-in and check-out dates.' : 'Please enter a valid house rental duration.' })
      return
    }

    try {
      setSubmitting(true)
      setErrors({})

      const booking = await submitBooking(
        payload.property,
        payload.rental_type,
        payload.start_date,
        payload.end_date,
      )

      navigate(`/properties/${id}/book/confirmation`, { state: { booking } })
    } catch (err) {
      // Handle backend validation errors (e.g., { start_date: "...", property: "..." })
      // or a simple error message
      let backendErrors = {}

      if (typeof err.response === 'object' && err.response) {
        // If error has structured response with field errors
        Object.entries(err.response).forEach(([key, value]) => {
          // value might be an array of messages or a single string
          backendErrors[key] = Array.isArray(value) ? value[0] : value
        })
      } else if (err?.message) {
        // Fallback to generic error message
        backendErrors.general = err.message
      } else {
        backendErrors.general = 'Unable to create booking. Please try again.'
      }

      setErrors(backendErrors)
    } finally {
      setSubmitting(false)
    }
  }

  const getFormReadinessErrors = () => {
    const issues = []

    // Contact info
    if (!form.contactName?.trim()) issues.push('Full name')
    if (!form.contactPhone?.trim()) issues.push('Phone number')
    if (!form.contactEmail?.trim()) issues.push('Email')

    // ID
    if (!form.dateOfBirth) issues.push('Date of birth')
    if (!form.gender) issues.push('Gender')
    if (!form.idType) issues.push('ID type')
    if (!form.idNumber?.trim()) issues.push('ID number')
    if (form.idDocuments.length < 2) issues.push(`ID documents (${form.idDocuments.length}/2)`)

    // Emergency
    if (!form.emergencyName?.trim()) issues.push('Emergency contact name')
    if (!form.emergencyPhone?.trim()) issues.push('Emergency contact phone')
    if (!form.emergencyRelationship?.trim()) issues.push('Emergency relationship')

    // Confirmation
    if (!form.informationConfirmed) issues.push('Information confirmation checkbox')
    if (!form.termsAccepted) issues.push('Terms acceptance checkbox')

    // Property-specific
    if (property?.listingType === 'car') {
      if (!form.checkIn) issues.push('Pickup date')
      if (!form.checkOut) issues.push('Return date')
      if (!form.pickupTime) issues.push('Pickup time')
      if (!form.returnTime) issues.push('Return time')
      if (!form.pickupPurpose) issues.push('Rental purpose')
      if (form.checkIn && form.checkOut && new Date(form.checkOut) <= new Date(form.checkIn)) {
        issues.push('Return date must be after pickup date')
      }
    } else {
      if (!form.moveInDate) issues.push('Move-in date')
      if (!form.rentalDuration || Number(form.rentalDuration) < 1) issues.push('Rental duration')
      if (!form.durationUnit) issues.push('Duration unit')
      if (!form.numberOfTenants || Number(form.numberOfTenants) < 1) issues.push('Number of tenants')
      if (!form.rentalType) issues.push('Rental type')
    }

    return issues
  }

  const isBookingFormReady = () => {
    return getFormReadinessErrors().length === 0
  }

  const continueButton = (() => {
    const readinessErrors = getFormReadinessErrors()
    const isPricingValid = pricing && pricing.total > 0
    const isReady = readinessErrors.length === 0 && isPricingValid

    let buttonText = 'Confirm Booking'
    let buttonTooltip = null

    if (isSubmittingBooking || submitting) {
      buttonText = 'Creating booking...'
    } else if (!isPricingValid) {
      buttonText = '⚠️ Complete rental details'
      buttonTooltip = 'Fill in all rental dates and duration'
    } else if (readinessErrors.length > 0) {
      buttonText = `⚠️ Complete ${readinessErrors.length} field${readinessErrors.length > 1 ? 's' : ''}`
      buttonTooltip = readinessErrors.slice(0, 3).join(', ') + (readinessErrors.length > 3 ? '...' : '')
    }

    return (
      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleContinue}
          disabled={!isReady || isSubmittingBooking || submitting}
          title={buttonTooltip}
          className="h-12 w-full rounded-2xl bg-[#c99b43] text-base font-semibold text-white hover:bg-[#b88a35] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {buttonText}
        </Button>
        {buttonTooltip && (
          <p className="text-xs text-red-400 dark:text-red-300">{buttonTooltip}</p>
        )}
      </div>
    )
  })()

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#c99b43]" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Property not found.'}</p>
          <Button onClick={() => navigate('/properties')} className="mt-4">
            Back to Properties
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(`/properties/${id}`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#c99b43] dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to property
          </button>
        </div>
      </section>

      <motion.main
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35 }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {property.listingType === 'car' ? 'Book Your Vehicle' : 'Book Your New Home'}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Review the selected {property.listingType === 'car' ? 'vehicle rental' : 'home rental'} details before confirming.
            </p>
          </div>
          <BookingProgress currentStep={1} />

          {/* Debug: Show missing fields */}
          {getFormReadinessErrors().length > 0 && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/40 dark:bg-yellow-950/40">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                Complete these fields to enable booking:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                {getFormReadinessErrors().map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Pricing validation */}
          {pricing && pricing.total <= 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/40">
              <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                ⚠️ Pricing not calculated. Ensure all rental details are filled in.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />
            <BookingForm
              form={form}
              errors={errors}
              onChange={handleFormChange}
              user={user}
              property={property}
            />
          </Card>

          <div className="space-y-4">
            <BookingSummary
              property={property}
              form={form}
              pricing={pricing}
              action={continueButton}
            />
          </div>
        </div>
      </motion.main>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-lg font-bold text-[#c99b43]">
              {formatCurrency(pricing?.total || property.securityDeposit, property.currency)}
            </p>
          </div>
          {continueButton}
        </div>
      </div>

      <div className="h-24 lg:hidden" />
      {/* <Footer /> */}
    </div>
  )
}
