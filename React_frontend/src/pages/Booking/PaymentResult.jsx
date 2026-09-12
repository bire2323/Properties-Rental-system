import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useAuth } from '../../hooks/useAuth'
import { lookupPaymentByTxRef } from '../../api/paymentApi'
import { getBooking } from '../../api/bookingApi'
import { formatAmount, formatDisplayDate, formatListingType } from '../../lib/bookingDisplay'

const POLL_INTERVAL_MS = 3000
// After the fast-poll window (MAX_POLL_ATTEMPTS × POLL_INTERVAL_MS) the page
// keeps re-checking at a slower cadence instead of giving up: a delayed Chapa
// callback/webhook or a gateway that is slow for a minute must still settle
// the outcome here automatically rather than leaving the renter staring at a
// frozen "finalizing…" card.
const SLOW_POLL_INTERVAL_MS = 15000
const MAX_POLL_ATTEMPTS = 20 // ~60s of fast polling

/**
 * Chapa's hosted checkout returns the browser to CHAPA_RETURN_URL
 * (http://localhost:5173/payment-result/) with query params such as
 * ``trx_ref`` / ``tx_ref``. The browser ``status`` value is NEVER trusted —
 * it is not proof of payment.
 *
 * This page is deliberately authoritative-first: BEFORE it renders any
 * outcome it calls the backend lookup endpoint, which performs the
 * server-side Chapa verification (and confirms the booking + dispatches the
 * confirmation emails) and returns the post-verification state. The page then
 * renders the definitive result — confirmed / failed / still-processing —
 * instead of bouncing to another page that may load before verification.
 */
function extractTxRef(searchParams) {
  return (
    searchParams.get('trx_ref') ||
    searchParams.get('tx_ref') ||
    searchParams.get('ref_id') ||
    ''
  ).trim()
}

export default function PaymentResult() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [txRef] = useState(() => extractTxRef(new URLSearchParams(window.location.search)))
  // 'checking' | 'confirmed' | 'failed' | 'processing' | 'unresolved'
  const [state, setState] = useState('checking')
  const [result, setResult] = useState(null) // lookup response { booking, booking_reference, booking_status, payment_status, ... }
  const [bookingInfo, setBookingInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const attemptsRef = useRef(0)
  const cancelledRef = useRef(false)
  const stateRef = useRef('checking')

  const setStateAndRef = useCallback((next) => {
    stateRef.current = next
    setState(next)
  }, [])

  const applyLookup = useCallback(
    (data) => {
      setResult(data)
      if (data?.booking_status === 'confirmed') {
        setStateAndRef('confirmed')
        // Best-effort enrichment of the success screen (property name, amount).
        getBooking(data.booking)
          .then((booking) => {
            if (!cancelledRef.current) setBookingInfo(booking)
          })
          .catch(() => {
            if (!cancelledRef.current) setBookingInfo(null)
          })
        return
      }
      if (data?.payment_status === 'failed') {
        setStateAndRef('failed')
        return
      }
      if (['initiated', 'pending'].includes(data?.payment_status)) {
        setStateAndRef('processing')
        return
      }
      setStateAndRef('processing')
    },
    [setStateAndRef]
  )

  const triggerCheck = useCallback(async () => {
    if (!txRef) return
    attemptsRef.current += 1

    let data
    try {
      data = await lookupPaymentByTxRef(txRef)
    } catch (err) {
      if (cancelledRef.current) return
      if (stateRef.current === 'confirmed' || stateRef.current === 'failed') return
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setErrorMessage(err.message || 'Could not verify your payment with the gateway.')
        setStateAndRef('unresolved')
      } else {
        // Transient network failure — the authoritative verification call may
        // not have completed, so retry rather than showing a stale state.
        setStateAndRef('checking')
      }
      return
    }

    if (cancelledRef.current) return
    applyLookup(data)
  }, [applyLookup, setStateAndRef, txRef])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/payment-result' } })
      return
    }
    if (!txRef) {
      setErrorMessage('No payment reference was provided by the payment gateway.')
      setStateAndRef('unresolved')
      return
    }

    cancelledRef.current = false
    attemptsRef.current = 0

    // 1. Authoritative check happens first: the backend verifies with Chapa and
    //    confirms the booking (and fires the confirmation emails) before the
    //    page shows an outcome.
    triggerCheck()

    // 2. If the transaction is still processing, keep re-verifying until it
    //    settles instead of showing "pending" from an outdated snapshot. Once a
    //    definitive state is reached, stop. Poll fast for about a minute, then
    //    slow down (but never stop) so a temporarily unreachable gateway or a
    //    delayed webhook still resolves on this page without manual refreshes.
    const fastPollDeadline = Date.now() + POLL_INTERVAL_MS * MAX_POLL_ATTEMPTS
    let timer = null
    const schedulePoll = (delay) => {
      timer = setTimeout(() => {
        if (cancelledRef.current) return
        const current = stateRef.current
        if (current === 'confirmed' || current === 'failed' || current === 'unresolved') return
        triggerCheck()
        const delay = Date.now() < fastPollDeadline ? POLL_INTERVAL_MS : SLOW_POLL_INTERVAL_MS
        schedulePoll(delay)
      }, delay)
    }
    schedulePoll(POLL_INTERVAL_MS)

    return () => {
      cancelledRef.current = true
      if (timer) clearTimeout(timer)
    }
  }, [authLoading, isAuthenticated, navigate, txRef, triggerCheck, setStateAndRef])

  const isSuccess = state === 'confirmed'
  const isFailed = state === 'failed'
  const isProcessing = state === 'processing'

  const showSpinner = state === 'checking' || (isProcessing && result === null)

  const listingType = formatListingType(bookingInfo?.listing_type)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-16 sm:px-6">
        <Card className="w-full rounded-3xl border-slate-200/70 bg-white/95 p-8 text-center dark:border-slate-800 dark:bg-slate-900/95 sm:p-10">
          {showSpinner ? (
            <div className="flex flex-col items-center" role="status" aria-live="polite">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c99b43]/10">
                <Loader2 className="h-8 w-8 animate-spin text-[#c99b43]" />
              </div>
              <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                Verifying your payment…
              </h1>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                We are checking your payment with our secure gateway before showing the result. This usually takes a
                few seconds.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Your booking is confirmed only after the payment is verified by our secure gateway — never from the
                browser alone.
              </div>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">Payment confirmed</h1>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Your payment was verified and your booking is confirmed. A confirmation has been sent to your email.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <span className="text-slate-500 dark:text-slate-400">Reference</span>
                <span>{result?.booking_reference}</span>
              </div>
              {bookingInfo && (
                <div className="mt-6 w-full max-w-sm rounded-2xl border border-slate-200 p-4 text-left dark:border-slate-800">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {bookingInfo.property_name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{listingType}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400">Dates</span>
                      <span className="text-right font-medium text-slate-900 dark:text-white">
                        {formatDisplayDate(bookingInfo.start_date)}
                        {bookingInfo.end_date ? ` → ${formatDisplayDate(bookingInfo.end_date)}` : ' (ongoing)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400">Amount paid</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatAmount(bookingInfo.total_amount, bookingInfo.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => navigate('/tenant/bookings')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b08838]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  View My Bookings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 rounded-2xl"
                >
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </div>
          ) : isFailed ? (
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">Payment not successful</h1>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                The payment gateway reported that this payment did not go through. No amount was charged. You can try
                again from your booking.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => navigate('/tenant/bookings')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b08838]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again from My Bookings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 rounded-2xl"
                >
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
                <Clock className="h-9 w-9 text-amber-600 dark:text-amber-300" />
              </div>
              <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                Payment received — finalizing…
              </h1>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Your payment was received and is being confirmed with the gateway. This can take a moment. We keep
                checking and will show the result here automatically.
              </p>
              <p className="mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                To avoid paying twice, check My Bookings before starting a new payment.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => navigate('/tenant/bookings')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b08838]"
                >
                  Check My Bookings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    attemptsRef.current = 0
                    triggerCheck()
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl"
                >
                  <RefreshCw className="h-4 w-4" />
                  Check again
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c99b43]/10">
                <AlertCircle className="h-8 w-8 text-[#b98227] dark:text-[#f3c96d]" />
              </div>
              <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                Payment status could not be verified
              </h1>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                We could not confirm this payment right now.{errorMessage ? ` ${errorMessage}` : ''}
              </p>
              <p className="mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Check My Bookings before attempting another payment, so you don't pay twice.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => navigate('/tenant/bookings')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b08838]"
                >
                  Check My Bookings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    attemptsRef.current = 0
                    setErrorMessage(null)
                    setState('checking')
                    triggerCheck()
                  }}
                  className="rounded-2xl"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  )
}