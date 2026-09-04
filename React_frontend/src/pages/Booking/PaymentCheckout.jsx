import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Loader2,
  Lock,
  RefreshCw,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useAuth } from '../../hooks/useAuth'
import { getBooking } from '../../api/bookingApi'
import { createPayment, verifyPayment } from '../../api/paymentApi'
import {
  formatAmount,
  formatDisplayDate,
  formatListingType,
  formatRentalType,
  resolveBookingImage,
} from '../../lib/bookingDisplay'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 20 // ~60s of "We're confirming your payment…"

function PaymentSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <Footer />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4 text-[#c99b43]" />
        {label}
      </span>
      <span className="text-right font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}

export default function PaymentCheckout() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const reduceMotion = useReducedMotion()

  // When the renter arrives from Chapa's hosted checkout (via /payment-result),
  // navigation state carries the transaction reference and the resolved payment
  // id. This lets us trigger authoritative verification for that specific
  // attempt instead of showing a blank/duplicate pay screen.
  const returnTxRef = location.state?.txRef || null
  const returnPaymentId = location.state?.paymentId || null

  const [booking, setBooking] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pay / retry state
  const [startingPayment, setStartingPayment] = useState(false)
  const [payError, setPayError] = useState(null)

  // Reconciliation (confirming) state — used when the user has returned from
  // Chapa and the webhook/callback may not have finished confirming.
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef(null)
  const reconciledRef = useRef(false)

  // Fetch the booking. Never sets loading state synchronously (the effect must
  // not call setState in its body); the manual retry handler sets loading true.
  const loadBooking = useCallback(
    async (silent = false) => {
      try {
        const data = await getBooking(bookingId)
        setBooking(data)
        setError(null)
        return data
      } catch (err) {
        if (!silent) {
          setError(err.message || 'Unable to load this booking.')
          setBooking(null)
        }
        return null
      } finally {
        if (!silent) setInitialLoading(false)
      }
    },
    [bookingId]
  )

  const handleRetryLoad = () => {
    setInitialLoading(true)
    loadBooking()
  }

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    getBooking(bookingId)
      .then((data) => {
        setBooking(data)
        setError(null)
      })
      .catch((err) => {
        setError(err.message || 'Unable to load this booking.')
        setBooking(null)
      })
      .finally(() => setInitialLoading(false))
  }, [authLoading, isAuthenticated, navigate, bookingId])

  const stopConfirming = () => {
    setConfirming(false)
    if (confirmRef.current) clearInterval(confirmRef.current)
    confirmRef.current = null
  }

  const startConfirming = useCallback(() => {
    stopConfirming()
    setConfirming(true)
    let attempts = 0
    confirmRef.current = setInterval(async () => {
      attempts += 1
      const latest = await loadBooking(true)
      // The backend is authoritative: once it confirms the booking (via
      // webhook/callback/verify) we stop polling and render the result.
      if (latest && (latest.status === 'confirmed' || latest.latest_payment_status === 'successful')) {
        stopConfirming()
        setBooking(latest)
        return
      }
      if (latest && latest.latest_payment_status === 'failed') {
        stopConfirming()
        setBooking(latest)
        return
      }
      if (attempts >= MAX_POLL_ATTEMPTS) {
        stopConfirming()
      }
    }, POLL_INTERVAL_MS)
  }, [loadBooking])

  useEffect(() => {
    return () => stopConfirming()
  }, [])

  // Reconcile a payment the renter just attempted at Chapa's hosted checkout.
  // When we return here via /payment-result the webhook/callback may still be
  // processing, so we trigger an authoritative server-side verification for the
  // resolved payment and then poll the backend until it reaches a terminal
  // state (confirmed/successful or failed).
  const reconcileReturningPayment = useCallback(async () => {
    if (reconciledRef.current) return
    if (!authLoading && isAuthenticated && bookingId && returnPaymentId) {
      reconciledRef.current = true
      try {
        await verifyPayment(returnPaymentId)
      } catch {
        // Verification may be temporarily unavailable or the payment already
        // reached a terminal state; either way keep polling the booking state.
      }
      startConfirming()
    }
  }, [authLoading, isAuthenticated, bookingId, returnPaymentId, startConfirming])

  useEffect(() => {
    reconcileReturningPayment()
  }, [reconcileReturningPayment])

  const handlePay = useCallback(async () => {
    if (!booking || booking.status !== 'approved') return
    if (startingPayment) return
    setPayError(null)
    setStartingPayment(true)
    try {
      const result = await createPayment({
        booking: bookingId,
        payment_method: 'chapa',
      })
      if (!result?.checkout_url) {
        throw new Error('No secure checkout link was returned.')
      }
      // Send the user to Chapa's hosted checkout. We do NOT trust a redirect
      // "success" — on return we reconcile against the backend, which confirms
      // the booking only after authoritative Chapa verification.
      startConfirming()
      window.location.href = result.checkout_url
    } catch (err) {
      setPayError(err.message || 'Could not start payment. Please try again.')
      setStartingPayment(false)
    }
  }, [booking, bookingId, startingPayment, startConfirming])

  const handleRetry = () => {
    // A FAILED attempt is terminal on the backend. Starting a new payment
    // creates a fresh PaymentTransaction (new tx_ref) rather than retrying the
    // failed one, so we call createPayment — never verifyPayment on a FAILED tx.
    setPayError(null)
    setStartingPayment(false)
    handlePay()
  }

  if (authLoading || initialLoading) {
    return <PaymentSkeleton />
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
          <div className="rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900/40 dark:bg-slate-900">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Unable to load this booking</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <Button
              onClick={handleRetryLoad}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b08838]"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <div className="mt-3">
              <Button variant="outline" onClick={() => navigate('/tenant/bookings')} className="rounded-2xl">
                Back to My Bookings
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!booking) return null

  const base = {
    image: resolveBookingImage(null, booking.listing_type),
    listingType: formatListingType(booking.listing_type),
    rentalType: formatRentalType(booking.rental_type),
    isCar: booking.listing_type === 'car',
  }

  const isConfirmed = booking.status === 'confirmed'
  const latestPayment = booking.latest_payment_status || null
  const hasPendingPayment = latestPayment === 'initiated' || latestPayment === 'pending'
  const isFailed = latestPayment === 'failed'

  const showConfirming = confirming || (booking.status === 'approved' && hasPendingPayment)
  const canPay = booking.status === 'approved' && !hasPendingPayment
  const awaitingApproval = booking.status === 'pending'

  const totalRow = [
    { label: base.isCar ? 'Rental' : 'Rent', value: formatAmount(booking.base_price, booking.currency) },
    { label: 'Security deposit', value: formatAmount(booking.security_deposit, booking.currency) },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/tenant/bookings')}
              disabled={startingPayment || showConfirming}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#c99b43] disabled:opacity-50 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Bookings
            </button>
            <BookingStatusBadge status={booking.status} size="sm" />
          </div>
        </div>
      </section>

      <motion.main
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {isConfirmed ? 'Payment complete' : 'Secure checkout'}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {confirming || showConfirming
              ? 'We are confirming your payment with our secure gateway…'
              : isConfirmed
                ? 'Your booking is confirmed. Thank you for your payment.'
                : 'Review your booking and complete payment securely.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {showConfirming ? (
            <motion.div key="confirming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ConfirmingCard
                reduceMotion={reduceMotion}
                onDone={() => {
                  stopConfirming()
                  loadBooking()
                }}
                onViewBookings={() => navigate('/tenant/bookings')}
              />
            </motion.div>
          ) : isConfirmed ? (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SuccessCard
                booking={booking}
                base={base}
                reduceMotion={reduceMotion}
                onViewBookings={() => navigate('/tenant/bookings')}
                onGoHome={() => navigate('/')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="pay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]"
            >
              <div className="space-y-6">
                <BookingOverviewCard booking={booking} base={base} waitingApproval={awaitingApproval} />
                <Card className="border-slate-200/70 bg-white/95 p-5 dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <Receipt className="h-5 w-5 text-[#c99b43]" />
                    Payment summary
                  </h2>
                  <div className="mt-5 space-y-3">
                    {totalRow.map((row) => (
                      <InfoRow key={row.label} icon={base.isCar ? Car : Home} label={row.label} value={row.value} />
                    ))}
                    <div className="border-t border-dashed border-slate-200 pt-3 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">Total</span>
                        <span className="text-lg font-bold text-[#c99b43]">
                          {formatAmount(booking.total_amount, booking.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-400">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#c99b43]" />
                    <p>
                      You will be redirected to Chapa's secure checkout to complete payment. Your booking is confirmed
                      only after the payment is verified — never from the browser alone.
                    </p>
                  </div>

                  {isFailed && (
                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>The previous payment attempt did not go through. You can try again below.</p>
                    </div>
                  )}

                  {payError && (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{payError}</p>
                  )}

                  <PayButton
                    awaitingApproval={awaitingApproval}
                    canPay={canPay}
                    isFailed={isFailed}
                    startingPayment={startingPayment}
                    booking={booking}
                    onPay={handleRetry}
                    className="mt-6 hidden lg:flex"
                  />
                </Card>
              </div>

              <div>
                <Card className="sticky top-6 border-slate-200/70 bg-white/95 p-5 dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/50">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c99b43]/10 text-[#c99b43]">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Chapa secure checkout</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        256-bit encrypted payment gateway
                      </p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Pay by card or mobile money (Telebirr).
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Your booking is confirmed automatically once the gateway verifies the payment.
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      You can review the status of your booking at any time from My Bookings.
                    </li>
                  </ul>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {!isConfirmed && !showConfirming && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total due</p>
                <p className="text-lg font-bold text-[#c99b43]">
                  {formatAmount(booking.total_amount, booking.currency)}
                </p>
              </div>
              <PayButton
                awaitingApproval={awaitingApproval}
                canPay={canPay}
                isFailed={isFailed}
                startingPayment={startingPayment}
                booking={booking}
                onPay={handleRetry}
                className="flex-1 sm:flex-none"
              />
            </div>
          </div>
          <div className="h-24 lg:hidden" />
        </>
      )}

      <Footer />
    </div>
  )
}

function PayButton({ awaitingApproval, canPay, isFailed, startingPayment, booking, onPay, className }) {
  const label = awaitingApproval
    ? 'Awaiting owner approval'
    : isFailed
      ? 'Try Payment Again'
      : startingPayment
        ? 'Redirecting to secure payment…'
        : `Pay ${formatAmount(booking.total_amount, booking.currency)}`

  return (
    <Button
      type="button"
      onClick={onPay}
      disabled={!canPay || startingPayment}
      className={`h-12 items-center justify-center gap-2 self-center rounded-2xl bg-[#c99b43] text-base font-semibold text-white hover:bg-[#b88a35] disabled:opacity-70 ${className ?? ''}`}
    >
      {startingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {label}
    </Button>
  )
}

function BookingOverviewCard({ booking, base, waitingApproval }) {
  const locationParts = [booking.property_city, booking.property_region].filter(Boolean).join(', ')
  const locationText = locationParts || booking.property_address || 'Location not specified'

  return (
    <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-5 dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Booking</h2>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row">
        <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 sm:h-36 sm:w-44">
          <img src={base.image} alt={booking.property_name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">{booking.property_name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            {base.isCar ? <Car className="h-4 w-4 text-[#c99b43]" /> : <Home className="h-4 w-4 text-[#c99b43]" />}
            {base.listingType} · {locationText}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">{booking.booking_reference}</p>

          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <InfoRow icon={CalendarDays} label="Rental type" value={base.rentalType} />
            <InfoRow icon={CalendarDays} label="Start date" value={formatDisplayDate(booking.start_date)} />
            <InfoRow
              icon={CalendarDays}
              label="End date"
              value={booking.end_date ? formatDisplayDate(booking.end_date) : 'Ongoing'}
            />
          </div>

          {waitingApproval && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Payment is not available yet. This booking is waiting for the owner to approve it. Once approved, you
                can pay here.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function ConfirmingCard({ reduceMotion, onDone, onViewBookings }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
        role="status"
        aria-live="polite"
      >
        <div className="relative flex h-16 w-16 items-center justify-center">
          {!reduceMotion && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[#c99b43]/30"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          )}
          <Loader2 className={`h-8 w-8 text-[#c99b43] ${reduceMotion ? 'animate-pulse' : 'animate-spin'}`} />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
          We're confirming your payment…
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Your payment is being verified with our secure gateway. This usually takes a few seconds. Please keep this
          page open.
        </p>
      </motion.div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={onViewBookings}
          variant="outline"
          className="inline-flex items-center gap-2 rounded-2xl"
        >
          <ArrowLeft className="h-4 w-4" />
          View My Bookings
        </Button>
        <Button
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b08838]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh status
        </Button>
      </div>
    </div>
  )
}

function SuccessCard({ booking, base, reduceMotion, onViewBookings, onGoHome }) {
  return (
    <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95 sm:p-10">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400" />
      <motion.div
        initial={{ scale: reduceMotion ? 1 : 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.15, type: 'spring', stiffness: 220, damping: 18 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40"
      >
        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
      </motion.div>

      <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        Payment confirmed
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-400">
        Your booking is confirmed. A confirmation has been recorded by the payment gateway. Thank you for your payment.
      </p>

      <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <span className="text-slate-500 dark:text-slate-400">Reference</span>
        <span>{booking.booking_reference}</span>
      </div>

      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 p-5 text-left dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-12 w-14 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
            <img src={base.image} alt={booking.property_name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{booking.property_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{base.listingType}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <InfoRow icon={CalendarDays} label="Dates" value={`${formatDisplayDate(booking.start_date)} → ${booking.end_date ? formatDisplayDate(booking.end_date) : 'Ongoing'}`} />
          <InfoRow icon={Wallet} label="Amount paid" value={formatAmount(booking.total_amount, booking.currency)} />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          onClick={onViewBookings}
          className="h-12 flex-1 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b88a35] sm:max-w-[16rem]"
        >
          View My Bookings
        </Button>
        <Button variant="outline" onClick={onGoHome} className="h-12 flex-1 rounded-2xl sm:max-w-[12rem]">
          Back to Home
        </Button>
      </div>
    </Card>
  )
}
