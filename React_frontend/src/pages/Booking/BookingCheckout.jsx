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
import { formatCurrency, validateBookingDetails } from '../../lib/bookingUtils'

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
    finalizeMockBooking,
  } = useBooking()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

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

  const handleContinue = () => {
    const validationErrors = {
      ...validateBookingDetails(form),
      ...(!form.contactName.trim() ? { contactName: 'Full name is required.' } : {}),
      ...(!form.contactPhone.trim() ? { contactPhone: 'Phone number is required.' } : {}),
      ...(!form.contactEmail.trim() ? { contactEmail: 'Email is required.' } : {}),
      ...(!form.dateOfBirth ? { dateOfBirth: 'Date of birth is required.' } : {}),
      ...(!form.gender ? { gender: 'Select a gender.' } : {}),
      ...(!form.idType ? { idType: 'Select an ID type.' } : {}),
      ...(!form.idNumber.trim() ? { idNumber: 'ID number is required.' } : {}),
      ...(form.idDocuments.length < 2 ? { idDocuments: 'Please upload at least 2 ID images.' } : {}),
      ...(!form.emergencyName.trim() ? { emergencyName: 'Emergency contact name is required.' } : {}),
      ...(!form.emergencyPhone.trim() ? { emergencyPhone: 'Emergency contact phone is required.' } : {}),
      ...(!form.emergencyRelationship.trim() ? { emergencyRelationship: 'Relationship is required.' } : {}),
      ...(!form.informationConfirmed || !form.termsAccepted ? { terms: 'Confirm your information and accept the rental terms.' } : {}),
    }
    if (property.listingType === 'car') {
      Object.assign(validationErrors, {
        ...(!form.pickupTime ? { pickupTime: 'Pickup time is required.' } : {}),
        ...(!form.returnTime ? { returnTime: 'Return time is required.' } : {}),
        ...(!form.pickupPurpose ? { pickupPurpose: 'Select a rental purpose.' } : {}),
      })
    } else {
      Object.assign(validationErrors, {
        ...(!form.rentalDuration || Number(form.rentalDuration) < 1 ? { rentalDuration: 'Enter a valid rental duration.' } : {}),
        ...(!form.numberOfTenants || Number(form.numberOfTenants) < 1 ? { numberOfTenants: 'Enter the number of tenants.' } : {}),
        ...(!form.moveInDate ? { moveInDate: 'Move-in date is required.' } : {}),
      })
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    if (!pricing || pricing.nights <= 0) {
      setErrors({ general: 'Please select valid check-in and check-out dates.' })
      return
    }
    setErrors({})
    finalizeMockBooking()
    navigate(`/properties/${id}/book/payment`)
  }

  const continueButton = (
    <Button
      type="button"
      onClick={handleContinue}
      disabled={!pricing || pricing.nights <= 0}
      className="h-12 w-full rounded-2xl bg-[#c99b43] text-base font-semibold text-white hover:bg-[#b88a35]"
    >
      Confirm Booking
    </Button>
  )

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
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />
            <BookingForm
              form={form}
              errors={errors}
              onChange={updateForm}
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
      <Footer />
    </div>
  )
}
