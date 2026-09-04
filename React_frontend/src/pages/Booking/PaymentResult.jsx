import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useAuth } from '../../hooks/useAuth'
import { lookupPaymentByTxRef } from '../../api/paymentApi'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 20

/**
 * Public fallback return page for Chapa's hosted checkout.
 *
 * Chapa redirects the user's browser back to CHAPA_RETURN_URL with query params
 * such as ``trx_ref`` / ``tx_ref`` / ``ref_id`` and a ``status`` value. That
 * browser ``status`` is NEVER trusted — it is not proof of payment. This page
 * only resolves the corresponding booking from the local backend and hands off
 * to /bookings/:bookingId/payment, where PaymentCheckout performs the real
 * reconciliation against the authoritative backend state.
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
  const [state, setState] = useState('resolving') // 'resolving' | 'confirming' | 'unresolved'
  const [errorMessage, setErrorMessage] = useState(null)

  const handleTryAgain = useCallback(() => {
    if (!txRef) return
    setState('resolving')
    setErrorMessage(null)
    lookupPaymentByTxRef(txRef)
      .then((data) =>
        navigate(`/bookings/${data.booking}/payment`, { state: { txRef, paymentId: data.payment_id } })
      )
      .catch((err) => {
        setErrorMessage(err.message || 'Could not identify the payment.')
        setState('unresolved')
      })
  }, [txRef, navigate])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/payment-result' } })
      return
    }

    if (!txRef) {
      setState('unresolved')
      return
    }

    let cancelled = false
    let attempts = 0

    const tryLookup = async () => {
      try {
        const data = await lookupPaymentByTxRef(txRef)
        if (cancelled) return
        // Resolved — hand off to PaymentCheckout, which reconciles the payment
        // authoritatively and renders the confirming/success/failed states.
        navigate(`/bookings/${data.booking}/payment`, { state: { txRef, paymentId: data.payment_id } })
      } catch (err) {
        if (cancelled) return
        // 401/403 handled by auth guard and error display; anything else may be
        // a transient failure while the backend callback/webhook is still
        // processing, so we poll briefly before giving up.
        attempts += 1
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setErrorMessage(err.message || 'Could not identify the payment.')
          setState('unresolved')
        } else {
          setState('confirming')
        }
      }
    }

    tryLookup()
    const interval = setInterval(tryLookup, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [authLoading, isAuthenticated, navigate, txRef])

  const confirming = state === 'confirming'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-16 sm:px-6">
        <Card className="w-full rounded-3xl border-slate-200/70 bg-white/95 p-8 text-center dark:border-slate-800 dark:bg-slate-900/95 sm:p-10">
          {state === 'resolving' || confirming ? (
            <div className="flex flex-col items-center" role="status" aria-live="polite">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c99b43]/10">
                <Loader2 className="h-8 w-8 animate-spin text-[#c99b43]" />
              </div>
              <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                We're confirming your payment…
              </h1>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Your payment is being verified with our secure gateway. This usually takes a few seconds. Please keep
                this page open.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Your booking is confirmed only after the payment is verified by our secure gateway — never from the
                browser alone.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h1 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">Unable to identify payment</h1>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                We could not match this payment attempt to a booking.
                {errorMessage ? ` ${errorMessage}` : ''}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleTryAgain}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] text-white hover:bg-[#b08838]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/tenant/bookings')}
                  className="rounded-2xl"
                >
                  Go to My Bookings
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
