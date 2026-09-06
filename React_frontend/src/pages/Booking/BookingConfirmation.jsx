import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Clock, Home, Send } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import BookingLifecycle from '../../components/booking/BookingLifecycle'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import BookingSummary from '../../components/booking/BookingSummary'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useAuth } from '../../hooks/useAuth'
import { useBooking } from '../../context/BookingContext'

const NEXT_STEPS = [
  'The owner receives and reviews your booking request, including your identity documents.',
  'The owner approves (or declines) your request.',
  'We notify you the moment it is approved — your payment unlocks.',
  'You complete payment securely with Chapa (cards or Telebirr).',
  'The payment is verified and your booking is confirmed.',
]

export default function BookingConfirmation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const reduceMotion = useReducedMotion()
  const {
    property,
    form,
    pricing,
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
        className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />

          <motion.div
            initial={{ scale: reduceMotion ? 1 : 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.15, type: 'spring', stiffness: 220, damping: 18 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#c99b43]/10"
          >
            <Send className="h-9 w-9 text-[#b98227] dark:text-[#f3c96d]" />
          </motion.div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Booking request submitted
          </h1>

          <div className="mt-4 inline-flex justify-center">
            <BookingStatusBadge status="pending" />
          </div>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-400">
            Your request has been sent to the owner for approval. No payment is taken now — you'll
            be able to pay securely with Chapa as soon as the owner approves your request.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <span className="text-slate-500 dark:text-slate-400">Reference</span>
            <span>{bookingReference}</span>
          </div>
        </Card>

        <div className="mt-6">
          <BookingLifecycle status="pending" />
        </div>

        <div className="mt-6 grid gap-6">
          <Card className="border-slate-200/70 bg-white/95 p-6 dark:border-slate-800 dark:bg-slate-900/95">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Clock className="h-5 w-5 text-[#c99b43]" />
              What happens next
            </h2>
            <ol className="mt-4 space-y-4">
              {NEXT_STEPS.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c99b43]/10 text-xs font-bold text-[#b98227] dark:text-[#f3c96d]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 leading-6">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <BookingSummary
            property={property}
            form={form}
            pricing={pricing}
            status="pending"
            sticky={false}
          />

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              What would you like to do?
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  navigate('/tenant/bookings')
                  setTimeout(resetBooking, 0)
                }}
                className="h-12 flex-1 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b88a35]"
              >
                View My Booking
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
                  navigate('/')
                  setTimeout(resetBooking, 0)
                }}
                className="h-12 flex-1 rounded-2xl"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </motion.main>

      <Footer />
    </div>
  )
}