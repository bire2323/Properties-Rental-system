import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { subscriptionApi } from '../../api/subscriptionApi'
import { useAuth } from '../../hooks/useAuth'
import { formatAmount } from '../../lib/bookingDisplay'

const MAX_ATTEMPTS = 6
const POLL_INTERVAL_MS = 3000

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function FeatureList({ plan }) {
  const items = [
    plan.max_listings == null ? 'Unlimited listings' : `${plan.max_listings} listings`,
    plan.featured_listing_limit == null ? 'Unlimited featured listings' : `${plan.featured_listing_limit} featured listings`,
    `${Number(plan.commission_rate_discount) || 0}% commission discount`,
  ]
  return (
    <ul className="mt-6 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function SubscriptionResult() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const txRef = searchParams.get('tx_ref') || searchParams.get('trx_ref') || ''

  const [state, setState] = useState('checking') // checking | activated | failed | resolved
  const [subscription, setSubscription] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState('')
  const attemptsRef = useRef(0)
  const timerRef = useRef(null)
  const runningRef = useRef(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!txRef) {
      setState('resolved')
      setMessage('No transaction reference was provided. Your subscription may still be activating.')
      return
    }

    const verifyOnce = async () => {
      if (runningRef.current) return
      runningRef.current = true
      try {
        const result = await subscriptionApi.verifySubscription(txRef)
        if (result?.status === 'success') {
          const sub = await subscriptionApi.getMySubscription().catch(() => null)
          setSubscription(sub || { plan: null })
          setState('activated')
          return
        }
        attemptsRef.current += 1
        setAttempts(attemptsRef.current)
        if (attemptsRef.current < MAX_ATTEMPTS) {
          timerRef.current = setTimeout(verifyOnce, POLL_INTERVAL_MS)
        } else {
          setState('failed')
          setMessage('We could not verify your payment. Please try again from your subscription page.')
        }
      } catch (err) {
        attemptsRef.current += 1
        setAttempts(attemptsRef.current)
        const text = err.message || 'Verification failed.'
        if (attemptsRef.current < MAX_ATTEMPTS && !/not (found|eligible)/i.test(text)) {
          timerRef.current = setTimeout(verifyOnce, POLL_INTERVAL_MS)
        } else {
          setState('failed')
          setMessage(text)
        }
      } finally {
        runningRef.current = false
      }
    }

    verifyOnce()
    return () => clearTimeout(timerRef.current)
  }, [user, txRef])

  const retry = () => {
    attemptsRef.current = 0
    setAttempts(0)
    setMessage('')
    setState('checking')
    const verifyOnce = async () => {
      try {
        const result = await subscriptionApi.verifySubscription(txRef)
        if (result?.status === 'success') {
          const sub = await subscriptionApi.getMySubscription().catch(() => null)
          setSubscription(sub || { plan: null })
          setState('activated')
          return
        }
        setState('failed')
        setMessage('Payment was not successful.')
      } catch (err) {
        setState('failed')
        setMessage(err.message || 'Verification failed.')
      }
    }
    verifyOnce()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header band */}
        <div className="bg-gradient-to-br from-[#0b2141] via-[#122b52] to-[#0b2141] px-8 py-10 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c99b43]/30 bg-[#c99b43]/15">
            <Wallet className="h-8 w-8 text-[#f3c96d]" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">
            {state === 'checking' && 'Verifying your payment…'}
            {state === 'activated' && 'Subscription Activated'}
            {state === 'failed' && 'Payment could not be confirmed'}
            {state === 'resolved' && 'Subscription'}
          </h1>
        </div>

        <div className="px-8 py-7">
          {state === 'checking' && (
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#c99b43]" />
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {attempts > 0
                  ? 'Still confirming with the payment provider…'
                  : 'Contacting the server to verify your Chapa payment.'}
              </p>
              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] transition-all"
                  style={{ width: `${Math.min(100, (attempts / MAX_ATTEMPTS) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {state === 'activated' && (
            <div className="text-center">
              <BadgeCheck className="mx-auto h-14 w-14 text-emerald-500" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {subscription?.plan?.name || 'Premium'} Plan
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your subscription is now active.</p>
              {subscription?.plan && <FeatureList plan={subscription.plan} />}
              {subscription?.current_period_end && (
                <p className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Valid until {formatDate(subscription.current_period_end)}
                </p>
              )}
              <button
                type="button"
                onClick={() => navigate('/owner/subscriptions')}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
              >
                <ArrowRight className="h-4 w-4" />
                Go to Dashboard
              </button>
            </div>
          )}

          {(state === 'failed' || state === 'resolved') && (
            <div className="text-center">
              <AlertTriangle className="mx-auto h-14 w-14 text-amber-500" />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{message}</p>
              <div className="mt-6 flex flex-col gap-3">
                {txRef && (
                  <button
                    type="button"
                    onClick={retry}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c99b43]/40 px-5 py-3 text-sm font-semibold text-[#b98227] transition hover:bg-[#c99b43]/5 dark:text-[#f3c96d]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Check again
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/owner/subscriptions')}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                >
                  <Sparkles className="h-4 w-4" />
                  Back to Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}