import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Home, CalendarDays, ArrowRight } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import BookingProgress from '../../components/booking/BookingProgress'
import PriceBreakdown from '../../components/booking/PriceBreakdown'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useAuth } from '../../hooks/useAuth'
import { useBooking } from '../../context/BookingContext'
import { formatDisplayDate } from '../../lib/bookingUtils'

export default function BookingConfirmation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const reduceMotion = useReducedMotion()
  const {
    property,
    form,
    pricing,
    payment,
    bookingReference,
    resetBooking,
  } = useBooking()

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    if (!property || !bookingReference) {
      navigate(`/properties/${id}/book`, { replace: true })
    }
  }, [authLoading, isAuthenticated, property, bookingReference, navigate, id])

  if (authLoading || !property || !bookingReference) {
    return null
  }

  const paymentLabel = {
    card: 'Card payment (mock)',
    mobile: 'Mobile payment (mock)',
    bank: 'Bank transfer (mock)',
    later: 'Pay later request',
  }[payment.method] || 'Payment submitted'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
        className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mb-8">
          <BookingProgress currentStep={3} />
        </div>

        <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />

          <motion.div
            initial={{ scale: reduceMotion ? 1 : 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.15, type: 'spring', stiffness: 220, damping: 18 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </motion.div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Booking Request Submitted!
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-400">
            Your booking request has been submitted successfully. You will be notified when the booking status is updated by the property owner.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <span className="text-slate-500 dark:text-slate-400">Reference</span>
            <span>{bookingReference}</span>
          </div>
        </Card>

        <div className="mt-8 grid gap-6">
          <Card className="border-slate-200/70 bg-white/95 p-6 dark:border-slate-800 dark:bg-slate-900/95">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Booking summary</h2>
            <div className="mt-4 flex gap-4">
              <img
                src={property.image}
                alt={property.title}
                className="h-24 w-28 rounded-2xl object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'
                }}
              />
              <div className="min-w-0 text-left">
                <p className="font-semibold text-slate-900 dark:text-white">{property.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{property.location}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CalendarDays className="h-4 w-4 text-[#c99b43]" />
                  {formatDisplayDate(form.checkIn)} → {formatDisplayDate(form.checkOut)}
                </div>
              </div>
            </div>
            <div className="mt-5">
              <PriceBreakdown property={property} pricing={pricing} />
            </div>
          </Card>

          <Card className="border-slate-200/70 bg-white/95 p-6 dark:border-slate-800 dark:bg-slate-900/95">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">What happens next?</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#c99b43]" />
                The owner will review your booking request.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#c99b43]" />
                Payment status: <span className="font-medium text-slate-900 dark:text-white">{paymentLabel}</span>
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#c99b43]" />
                You can track updates from My Bookings once backend integration is available.
              </li>
            </ul>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => {
                resetBooking()
                navigate('/tenant/bookings')
              }}
              className="h-12 flex-1 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b88a35]"
            >
              View My Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/properties/${id}`)}
              className="h-12 flex-1 rounded-2xl"
            >
              View Property
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetBooking()
                navigate('/')
              }}
              className="h-12 flex-1 rounded-2xl"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </motion.main>

      <Footer />
    </div>
  )
}
