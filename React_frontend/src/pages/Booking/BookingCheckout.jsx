import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import BookingProgress from '../../components/booking/BookingProgress'
import BookingForm from '../../components/booking/BookingForm'
import BookingSummary from '../../components/booking/BookingSummary'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { toast } from '../../components/ui/toaster'
import { getPropertyById } from '../../api/property/propertyApi'
import { getProfile } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import { useBooking } from '../../context/BookingContext'
import { getImageUrl } from '@/lib/utils'
import {
  buildBookingPayload,
  buildBookingFormData,
  formatCurrency,
  getMaxDateOfBirth,
  isAdultDateOfBirth,
  isValidEthiopianPhone,
  RENTAL_TYPES,
  validateBookingDetails,
} from '../../lib/bookingUtils'

/**
 * Convert a remote image URL to a File object for multipart form upload.
 */
async function urlToFile(url, fileName) {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const mimeType = blob.type || (fileName.endsWith('.png') ? 'image/png' : 'image/jpeg')
    const file = new File([blob], fileName, { type: mimeType })
    file.isSavedFayda = true
    return file
  } catch (err) {
    console.warn('Could not load saved Fayda image as file:', err)
    return null
  }
}

/**
 * Convert a Django REST Framework booking error into form field keys the
 * BookingForm understands, preserving the backend's exact messages verbatim.
 *
 * Backend field keys -> frontend BookingForm keys:
 *   start_date  -> checkIn (car) / moveInDate (house)
 *   end_date    -> checkOut (car) / general alert (house has no end-date field)
 *   rental_type -> rentalType (house) / general alert (cars are always fixed-term)
 *   property, non_field_errors, detail, unknown -> general alert
 *
 * Every backend-provided message is surfaced; a generic fallback is used only
 * when the backend supplied no useful validation message at all.
 */
function mapBackendErrorsToFields(err, listingType) {
  const isCar = listingType === 'car'
  const result = {}

  // Backend applicant_details field key -> BookingForm field key.
  const applicantFieldMap = {
    contact_name: 'contactName',
    contact_phone: 'contactPhone',
    contact_email: 'contactEmail',
    date_of_birth: 'dateOfBirth',
    gender: 'gender',
    id_type: 'idType',
    id_number: 'idNumber',
    emergency_name: 'emergencyName',
    emergency_phone: 'emergencyPhone',
    emergency_relationship: 'emergencyRelationship',
    number_of_tenants: 'numberOfTenants',
    pickup_time: 'pickupTime',
    return_time: 'returnTime',
    pickup_purpose: 'pickupPurpose',
    information_confirmed: 'informationConfirmed',
    terms_accepted: 'termsAccepted',
    documents: 'idDocuments',
  }

  const fieldKeyFor = (backendKey) => {
    if (backendKey === 'start_date') return isCar ? 'checkIn' : 'moveInDate'
    if (backendKey === 'end_date') return isCar ? 'checkOut' : null
    if (backendKey === 'rental_type') return isCar ? null : 'rentalType'
    return null
  }

  const firstMessage = (value) => {
    if (value == null) return null
    if (Array.isArray(value)) {
      const first = value.find((v) => typeof v === 'string' && v.length > 0)
      return first || null
    }
    return typeof value === 'string' ? value : null
  }

  const fieldErrors = (err && err.fieldErrors) || {}
  for (const [backendKey, messages] of Object.entries(fieldErrors)) {
    const message = firstMessage(messages)
    if (!message) continue

    // Nested applicant errors are keyed like `applicant_details.contact_name`.
    if (backendKey.startsWith('applicant_details.')) {
      const inner = backendKey.slice('applicant_details.'.length)
      const mappedApplicantKey = applicantFieldMap[inner]
      if (mappedApplicantKey) {
        result[mappedApplicantKey] = message
      } else {
        result.general = result.general || message
      }
      continue
    }

    const mappedKey = fieldKeyFor(backendKey)
    if (mappedKey) {
      result[mappedKey] = message
    } else {
      result.general = result.general || message
    }
  }

  const nonFieldMessage = (err && err.nonFieldErrors && err.nonFieldErrors[0]) || null
  if (nonFieldMessage) result.general = result.general || nonFieldMessage

  const responseDetail =
    err && err.response && typeof err.response === 'object'
      ? firstMessage(err.response.detail)
      : null
  if (responseDetail) result.general = result.general || responseDetail

  // When the backend gave us nothing structured, fall back to its message or a
  // generic copy only as a last resort.
  if (Object.keys(result).length === 0 && err && err.message) {
    result.general = err.message
  }

  return result
}

/**
 * Show a responsive error toast with the backend's exact message(s).
 *
 * The primary (most relevant) message is the toast title. If the submission
 * produced more than one distinct issue, the rest are listed in the toast
 * description so nothing is hidden. Uses the shared app Toaster (sonner).
 */
function notifyBookingError(backendErrors) {
  const messages = []

  if (backendErrors.general) messages.push(backendErrors.general)
  for (const [key, value] of Object.entries(backendErrors)) {
    if (key === 'general') continue
    if (typeof value === 'string' && value) messages.push(value)
  }

  const unique = [...new Set(messages)]
  const primary = unique[0] || 'Unable to create booking. Please try again.'
  const remaining = unique.slice(1)

  toast.error(primary, {
    description:
      remaining.length > 0 ? remaining.join('\n') : undefined,
    duration: 6000,
  })
}

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

  const [savedFaydaDocs, setSavedFaydaDocs] = useState({ front: null, back: null })
  const [isProfileAutoFilled, setIsProfileAutoFilled] = useState(false)
  const profileLoadedRef = useRef(false)

  const hasValidDocuments = Boolean(
    (form.idDocuments && form.idDocuments.length >= 2) ||
    (form.idDocuments && form.idDocuments.length >= 1 && (savedFaydaDocs.front || savedFaydaDocs.back)) ||
    (savedFaydaDocs.front && savedFaydaDocs.back) ||
    (user?.profile?.id_front_image && user?.profile?.id_back_image)
  )

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: `/properties/${id}/book` } })
    }
  }, [authLoading, isAuthenticated, navigate, id])

  useEffect(() => {
    if (!user || profileLoadedRef.current) return
    profileLoadedRef.current = true

    async function loadTenantSavedInformation() {
      try {
        const res = await getProfile().catch(() => null)
        const profileData = res?.user || res || user
        const profileObj = profileData?.profile || user?.profile || {}

        const firstName = profileData.first_name || user.first_name || ''
        const lastName = profileData.last_name || user.last_name || ''
        const fullName = [firstName, lastName].filter(Boolean).join(' ')
        const email = profileData.email || user.email || ''
        const phone = profileData.phone_number || profileObj.phone_number || user.phone_number || ''
        const dob = profileData.date_of_birth || profileObj.date_of_birth || user.date_of_birth || ''
        const nationalId = profileData.national_id_number || profileObj.national_id_number || user.national_id_number || ''

        const rawFront = profileData.id_front_image || profileObj.id_front_image || user.id_front_image
        const rawBack = profileData.id_back_image || profileObj.id_back_image || user.id_back_image
        const frontUrl = rawFront ? getImageUrl(rawFront) : null
        const backUrl = rawBack ? getImageUrl(rawBack) : null

        const savedEmergency = (() => {
          try {
            return JSON.parse(localStorage.getItem('tenant_emergency_contact') || '{}')
          } catch {
            return {}
          }
        })()
        const savedGender = localStorage.getItem('tenant_gender') || ''

        const updates = {}
        if (fullName) updates.contactName = fullName
        if (email) updates.contactEmail = email
        if (phone) updates.contactPhone = phone
        if (dob) updates.dateOfBirth = typeof dob === 'string' ? dob.split('T')[0] : ''
        if (nationalId) {
          updates.idNumber = nationalId
          updates.idType = 'national_id'
        }
        if (savedGender && !form.gender) updates.gender = savedGender
        if (savedEmergency?.name && !form.emergencyName) updates.emergencyName = savedEmergency.name
        if (savedEmergency?.phone && !form.emergencyPhone) updates.emergencyPhone = savedEmergency.phone
        if (savedEmergency?.relationship && !form.emergencyRelationship) updates.emergencyRelationship = savedEmergency.relationship

        if (frontUrl || backUrl) {
          setSavedFaydaDocs({ front: frontUrl, back: backUrl })
        }

        // Convert saved Fayda images to File objects if form doesn't already have documents
        if ((frontUrl || backUrl) && (!form.idDocuments || form.idDocuments.length === 0)) {
          const loadedFiles = []
          if (frontUrl) {
            const f = await urlToFile(frontUrl, 'Fayda_National_ID_Front.jpg')
            if (f) {
              f.faydaSide = 'Front'
              loadedFiles.push(f)
            }
          }
          if (backUrl) {
            const b = await urlToFile(backUrl, 'Fayda_National_ID_Back.jpg')
            if (b) {
              b.faydaSide = 'Back'
              loadedFiles.push(b)
            }
          }
          if (loadedFiles.length > 0) {
            updates.idDocuments = loadedFiles
          }
        }

        updateForm(updates)
        if (fullName || phone || nationalId || frontUrl || dob) {
          setIsProfileAutoFilled(true)
        }
      } catch (err) {
        console.error('Failed to load saved tenant information for booking:', err)
      }
    }

    loadTenantSavedInformation()
  }, [user, updateForm])

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
    const hasSavedFayda = Boolean(savedFaydaDocs?.front && savedFaydaDocs?.back)
    const hasValidDocuments =
      (form.idDocuments && form.idDocuments.length >= 2) ||
      hasSavedFayda ||
      (form.idDocuments && form.idDocuments.length > 0 && (savedFaydaDocs?.front || savedFaydaDocs?.back))

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
      ...(!hasValidDocuments ? { idDocuments: 'Please upload at least 2 ID images (or attach saved Fayda ID).' } : {}),
      ...(!form.emergencyName.trim() ? { emergencyName: 'Emergency contact name is required.' } : {}),
      ...(!/^[A-Za-z][A-Za-z\s.'-]*$/.test(form.emergencyName.trim()) ? { emergencyName: 'Numbers are not allowed in emergency contact name.' } : {}),
      ...(!form.emergencyPhone.trim() ? { emergencyPhone: 'Emergency contact phone is required.' } : {}),
      ...(!isValidEthiopianPhone(form.emergencyPhone) ? { emergencyPhone: 'Use a valid Ethiopian mobile number starting with +251, 09 or 07.' } : {}),
      ...(!form.emergencyRelationship.trim() ? { emergencyRelationship: 'Relationship is required.' } : {}),
      ...(!form.informationConfirmed || !form.termsAccepted ? { terms: 'Confirm your information and accept the rental terms.' } : {}),
    }

    if (form.emergencyName && form.emergencyPhone) {
      try {
        localStorage.setItem(
          'tenant_emergency_contact',
          JSON.stringify({
            name: form.emergencyName,
            phone: form.emergencyPhone,
            relationship: form.emergencyRelationship || '',
          })
        )
      } catch {}
    }
    if (form.gender) {
      try {
        localStorage.setItem('tenant_gender', form.gender)
      } catch {}
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

      // When identity documents are attached, submit via multipart so the
      // files travel with the booking request. Otherwise a JSON payload is
      // sufficient (applicant details are still included).
      const formData = buildBookingFormData({ property, form })
      const bookingPayload = formData || payload

      const booking = await submitBooking(bookingPayload)

      navigate(`/properties/${id}/book/confirmation`, { state: { booking } })
    } catch (err) {
      // Surface the backend's exact validation messages. Field-level errors
      // map to the nearest BookingForm field; everything else (non-field,
      // detail, property-level, unknown) is shown in the top-level alert so
      // no backend message is ever lost or replaced with a generic fallback.
      const backendErrors = mapBackendErrorsToFields(err, property.listingType)

      if (Object.keys(backendErrors).length === 0) {
        backendErrors.general = 'Unable to create booking. Please try again.'
      }

      setErrors(backendErrors)

      // Also surface the exact message in a responsive toast so the user sees
      // the backend's wording even if they've scrolled away from the form.
      notifyBookingError(backendErrors)
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
    if (!hasValidDocuments) issues.push(`ID documents (${form.idDocuments?.length || 0}/2)`)

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

  // Map the single-page form's actual completion into the 5-step progress
  // indicator (Customer -> Identification -> Rental Details -> Review -> Confirm)
  // so the indicator always reflects the page's real stage instead of a fixed
  // placeholder number.
  const hasCustomerSection = !!(
    form.contactName?.trim() &&
    form.contactPhone?.trim() &&
    form.contactEmail?.trim()
  )
  const hasIdentificationSection = !!(
    form.dateOfBirth &&
    form.gender &&
    form.idType &&
    form.idNumber?.trim() &&
    hasValidDocuments
  )
  const rentalSectionComplete = property?.listingType === 'car'
    ? !!(
        form.checkIn &&
        form.checkOut &&
        form.pickupTime &&
        form.returnTime &&
        form.pickupPurpose
      )
    : !!(
        form.moveInDate &&
        Number(form.rentalDuration) >= 1 &&
        Number(form.numberOfTenants) >= 1 &&
        form.rentalType
      )
  const hasReviewSection = !!(
    form.emergencyName?.trim() &&
    form.emergencyPhone?.trim() &&
    form.emergencyRelationship?.trim()
  )
  const confirmationsComplete = !!(form.informationConfirmed && form.termsAccepted)
  const formStep = !hasCustomerSection
    ? 1
    : !hasIdentificationSection
      ? 2
      : !rentalSectionComplete
        ? 3
        : !hasReviewSection || !confirmationsComplete
          ? 4
          : 5

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
          <BookingProgress currentStep={formStep} />

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
              isProfileAutoFilled={isProfileAutoFilled}
              savedFaydaDocs={savedFaydaDocs}
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
