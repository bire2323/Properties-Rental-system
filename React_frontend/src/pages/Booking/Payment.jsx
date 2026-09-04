import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Lock, Loader2 } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import BookingProgress from '../../components/booking/BookingProgress'
import BookingSummary from '../../components/booking/BookingSummary'
import PaymentMethodSelector from '../../components/payment/PaymentMethodSelector'
import PaymentForm from '../../components/payment/PaymentForm'
import PaymentProcessing from '../../components/payment/PaymentProcessing'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useAuth } from '../../hooks/useAuth'
import { useBooking } from '../../context/BookingContext'
import { createPayment } from '../../api/paymentApi'
import { formatCurrency, validateBookingDetails } from '../../lib/bookingUtils'

export default function Payment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const reduceMotion = useReducedMotion()
  const {
    property,
    form,
    payment,
    pricing,
    bookingId,
    bookingStatus,
    updatePayment,
  } = useBooking()

  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    if (!property || !form.checkIn || !form.checkOut) {
      navigate(`/properties/${id}/book`, { replace: true })
      return
    }
    const validationErrors = validateBookingDetails(form)
    if (Object.keys(validationErrors).length > 0) {
      navigate(`/properties/${id}/book`, { replace: true })
    }
  }, [authLoading, isAuthenticated, property, form, navigate, id])

  const handlePay = async () => {
    if (bookingStatus !== 'approved') {
      setSubmitError('Payment is not available until the owner approves this booking request.')
      return
    }
    if (!bookingId) {
      setSubmitError('Booking reference is missing. Please open the approved booking from Your Bookings.')
      return
    }

    setErrors({})
    setSubmitError(null)
    setProcessing(true)

    try {
      const result = await createPayment({
        booking: bookingId,
        payment_method: 'chapa',
      })
      if (!result?.checkout_url) {
        throw new Error('No secure checkout link was returned.')
      }
      // Send the user to Chapa's hosted checkout. Booking confirmation only
      // happens after Django's server-side verification (webhook / callback /
      // manual verify) — never from the frontend alone.
      window.location.href = result.checkout_url
    } catch (err) {
      setSubmitError(err.message || 'Could not start payment. Please try again.')
      setProcessing(false)
    }
  }

  if (authLoading || !property) {
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

  const payButton = (
    <Button
      type="button"
      onClick={handlePay}
      disabled={processing || bookingStatus !== 'approved'}
      className="h-12 w-full rounded-2xl bg-[#c99b43] text-base font-semibold text-white hover:bg-[#b88a35] disabled:opacity-70"
    >
      {bookingStatus !== 'approved'
        ? 'Awaiting owner approval'
        : processing ? 'Redirecting to secure payment...' : `Pay ${formatCurrency(pricing?.total || 0, property.currency)}`}
    </Button>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(`/properties/${id}/book`)}
            disabled={processing}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#c99b43] disabled:opacity-50 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to booking details
          </button>
        </div>
      </section>

      <motion.main
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Secure Payment
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Choose a payment method and review your order before submitting.
            </p>
          </div>
          <BookingProgress currentStep={2} />
        </div>

        <AnimatePresence mode="wait">
          {processing ? (
            <PaymentProcessing key="processing" />
          ) : (
            <motion.div
              key="payment-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
            >
              <div className="space-y-6">
                <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-5 dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payment method</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Select how you would like to pay (UI preview only).
                  </p>
                  <div className="mt-5">
                    <PaymentMethodSelector
                      selectedMethod={payment.method}
                      onSelect={(method) => updatePayment({ method })}
                    />
                  </div>
                </Card>

                <Card className="border-slate-200/70 bg-white/95 p-5 dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payment details</h2>
                  <div className="mt-5">
                    <PaymentForm
                      method={payment.method}
                      payment={payment}
                      onChange={updatePayment}
                      errors={errors}
                    />
                  </div>
                  <div className="mt-6 flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-400">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#c99b43]" />
                    <p>
                      You will be redirected to Chapa's secure checkout to complete payment. Your booking is confirmed only after the payment is verified.
                    </p>
                  </div>
                  {submitError && (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{submitError}</p>
                  )}
                </Card>
              </div>

              <BookingSummary
                property={property}
                form={form}
                pricing={pricing}
                action={payButton}
                compact
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {!processing && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total due</p>
                <p className="text-lg font-bold text-[#c99b43]">
                  {formatCurrency(pricing?.total || 0, property.currency)}
                </p>
              </div>
              {payButton}
            </div>
          </div>
          <div className="h-24 lg:hidden" />
        </>
      )}

      <Footer />
    </div>
  )
}
