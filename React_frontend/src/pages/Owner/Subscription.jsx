import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Loader2,
  Lock,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import { subscriptionApi } from '../../api/subscriptionApi'
import { getAllProperties } from '../../api/property/propertyApi'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../../components/ui/toaster'
import { formatAmount } from '../../lib/bookingDisplay'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const TIER_META = {
  Free: { icon: Sparkles, tint: 'text-emerald-400', accent: 'from-emerald-400 to-teal-400', ring: 'ring-emerald-300/40 dark:ring-emerald-600/40' },
  Basic: { icon: Star, tint: 'text-slate-400', accent: 'from-slate-400 to-slate-500', ring: 'ring-slate-300/40 dark:ring-slate-600/40' },
  Premium: { icon: Crown, tint: 'text-[#c99b43]', accent: 'from-[#c99b43] to-[#e8bb6a]', ring: 'ring-[#c99b43]/40' },
  Business: { icon: Rocket, tint: 'text-emerald-500', accent: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-400/40' },
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function listingLimitLabel(plan) {
  return plan.max_listings == null ? 'Unlimited' : `${plan.max_listings}`
}

function planFeatures(plan) {
  return [
    {
      label: 'Listings',
      value: plan.max_listings == null ? 'Unlimited listings' : `${plan.max_listings} listings`,
    },
    {
      label: 'Commission discount',
      value: `${Number(plan.commission_rate_discount) || 0}% off platform fee`,
    },
    {
      label: 'Featured listings',
      value: plan.featured_listing_limit == null ? 'Unlimited featured' : `${plan.featured_listing_limit} featured`,
    },
  ]
}

function priceLabel(plan) {
  const per = plan.billing_cycle === 'yearly' ? 'year' : 'month'
  return `${formatAmount(plan.price, plan.currency)} / ${per}`
}

function ProgressBar({ value, max, className = '' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] transition-all ${pct >= 100 ? 'from-red-500 to-rose-400' : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function BenefitCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 text-[#b98227] dark:text-[#f3c96d]">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  )
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
        ))}
      </div>
    </div>
  )
}

export default function Subscription({ view = 'overview' }) {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [mySubscription, setMySubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [propertiesCount, setPropertiesCount] = useState(0)
  const [cycle, setCycle] = useState('monthly')
  const [target, setTarget] = useState('individual')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [checkoutState, setCheckoutState] = useState('idle') // idle | starting | error
  const [checkoutError, setCheckoutError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [plansData, subData] = await Promise.all([
        subscriptionApi.getPlans().catch(() => []),
        subscriptionApi.getMySubscription().catch(() => null),
      ])
      setPlans(plansData)
      setMySubscription(subData)
      if (subData?.plan) {
        setCycle(subData.plan.billing_cycle || 'monthly')
        setTarget(subData.plan.target_type || 'individual')
      }
      try {
        const data = await getAllProperties()
        const results = Array.isArray(data) ? data : data.results || []
        setPropertiesCount(results.filter((p) => p.owner_email === user?.email).length)
      } catch {
        setPropertiesCount(0)
      }
    } catch (err) {
      setError(err.message || 'Unable to load subscription data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const filteredPlans = useMemo(() => {
    return plans
      .filter((p) => p.is_active !== false && p.target_type === target && p.billing_cycle === cycle)
      .sort((a, b) => {
        const order = { Basic: 0, Premium: 1, Business: 2 }
        return (order[a.name] ?? 3) - (order[b.name] ?? 3)
      })
  }, [plans, target, cycle])

  const activePlan = mySubscription?.plan || null
  const currentPlanId = activePlan?.id || null
  const used = mySubscription ? mySubscription.listings_used ?? propertiesCount : propertiesCount
  const limit = activePlan?.max_listings ?? null
  const atLimit = limit != null && used >= limit
  const discount = Number(activePlan?.commission_rate_discount) || 0
  const featuredUsed = mySubscription?.featured_used ?? 0
  const featuredLimit = activePlan?.featured_listing_limit ?? null

  const scrollToPlans = () => {
    const el = document.getElementById('subscription-plans')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToManage = () => {
    const el = document.getElementById('subscription-manage')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const startCheckout = async () => {
    if (!selectedPlan) return
    setCheckoutState('starting')
    setCheckoutError('')
    try {
      const returnUrl = `${window.location.origin}/owner/subscriptions/result`
      const result = await subscriptionApi.subscribe({
        planId: selectedPlan.id,
        callbackUrl: `${API_BASE_URL}/api/subscriptions/verify/`,
        returnUrl,
      })
      const checkoutUrl = result?.checkout_url
      if (!checkoutUrl) {
        throw new Error('Checkout could not be initiated.')
      }
      window.location.assign(checkoutUrl)
    } catch (err) {
      setCheckoutError(err.message || 'Unable to start checkout.')
      setCheckoutState('error')
    }
  }

  const cancelAtPeriodEnd = async () => {
    setCancelling(true)
    try {
      await subscriptionApi.cancelSubscription()
      toast.success('Subscription will cancel at the end of the billing period.')
      await refresh()
    } catch (err) {
      toast.error(err.message || 'Unable to cancel subscription.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">Subscription</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading your subscription…</p>
        </header>
        <SubscriptionSkeleton />
      </div>
    )
  }

  if (error && plans.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">Subscription</h1>
        </header>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/40">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-200">Unable to load subscription data</h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
          >
            <Loader2 className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            <Wallet className="h-7 w-7 text-[#b98227] dark:text-[#f3c96d]" />
            Subscription
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {activePlan
              ? `${activePlan.name} plan · ${activePlan.billing_cycle === 'yearly' ? 'yearly' : 'monthly'} billing`
              : 'Choose a plan to list more properties and unlock savings.'}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <Loader2 className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {/* ── Your subscription hero ─────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2141] via-[#122b52] to-[#0b2141] p-6 text-white shadow-xl shadow-[#0b2141]/20 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f3c96d]">Your Subscription</p>
            {activePlan ? (
              <>
                <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  {activePlan.name} Plan
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {mySubscription?.cancel_at_period_end
                    ? `Cancels at the end of the current period (${formatDate(mySubscription.current_period_end)})`
                    : `Active until ${formatDate(mySubscription?.current_period_end)}`}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  Free plan <span className="text-[#f3c96d]">— 5 listings</span>
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Subscribe to a plan to list more properties and unlock commission discounts.
                </p>
              </>
            )}
          </div>

          <div className="w-full max-w-sm lg:w-96">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">
                {activePlan ? `${used} / ${listingLimitLabel(activePlan)} listings used` : `${used} / 5 listings used`}
              </span>
              <span className="text-[#f3c96d]">
                {activePlan && limit ? `${Math.min(100, Math.round((used / limit) * 100))}%` : used >= 5 ? '100%' : '0%'}
              </span>
            </div>
            <ProgressBar value={used} max={activePlan && limit ? limit : Math.max(5, used)} className="mt-2" />
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => scrollToPlans()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
              >
                <ArrowRight className="h-4 w-4" />
                {activePlan ? 'Change Plan' : 'Get Started'}
              </button>
              {activePlan && (
                <button
                  type="button"
                  onClick={() => scrollToManage()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Manage Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Listing limit reached warning ─────────────────────────────── */}
      {atLimit && (
        <section className="flex items-start gap-4 rounded-3xl border border-amber-300/60 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-950/40">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">Listing limit reached</h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              You've used {used} of {listingLimitLabel(activePlan)} listings. Upgrade your plan to add more properties.
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToPlans()}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Upgrade Plan
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {/* ── Benefits ──────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BenefitCard
          icon={<BadgeDollarSign className="h-5 w-5" />}
          label="Listings"
          value={activePlan ? listingLimitLabel(activePlan) : '5'}
          sub={activePlan ? `${used} currently used` : 'Free plan'} 
        />
        <BenefitCard
          icon={<TrendingDown className="h-5 w-5" />}
          label="Commission"
          value={`${discount}% discount`}
          sub="on platform fee"
        />
        <BenefitCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Featured Listings"
          value={featuredLimit == null ? 'Unlimited' : featuredLimit}
          sub={featuredLimit != null ? `${featuredUsed} currently used` : 'Included'}
        />
        <BenefitCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Billing"
          value={activePlan && activePlan.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
          sub={mySubscription?.current_period_end ? `Next: ${formatDate(mySubscription.current_period_end)}` : '—'}
        />
      </section>

      {/* ── Free / business context selector ──────────────────────────── */}
      <section id="subscription-plans" className="scroll-mt-6 space-y-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Choose the plan that fits your business</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Prices and limits come from the platform's plan database.
            </p>
          </div>
        </div>

        {/* Target type */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'individual', label: 'Individual', icon: UserRound },
            { key: 'company', label: 'Company', icon: Building2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTarget(key)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${target === key
                ? 'border-[#c99b43] bg-[#c99b43]/10 text-[#b98227] dark:text-[#f3c96d]'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Billing cycle */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-2xl border border-slate-200 p-1 dark:border-slate-800">
            {[
              { key: 'monthly', label: 'Monthly' },
              { key: 'yearly', label: 'Yearly' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCycle(key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${cycle === key
                  ? 'bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] text-white'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <TrendingDown className="h-3.5 w-3.5" />
            Save 20% on yearly
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid gap-5 lg:grid-cols-3">
          {filteredPlans.map((plan) => {
            const meta = TIER_META[plan.name] || TIER_META.Premium
            const Icon = meta.icon
            const isCurrent = plan.id === currentPlanId
            return (
              <motion.div
                key={plan.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm ring-1 ${meta.ring} dark:bg-slate-900/60 ${isCurrent ? 'border-[#c99b43]' : 'border-slate-200 dark:border-slate-800'}`}
              >
                {plan.name === 'Premium' && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                    <Star className="h-3 w-3 fill-current" />
                    Popular
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accent} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description || 'Platform subscription plan'}</p>
                  </div>
                </div>

                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {formatAmount(plan.price, plan.currency)}
                  <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                    / {plan.billing_cycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </p>

                <ul className="mt-5 space-y-2.5">
                  {planFeatures(plan).map((feature) => (
                    <li key={feature.label} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{feature.value}</span>
                        <span className="text-slate-400"> · {feature.label}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelectedPlan(plan)}
                  className={`mt-6 w-full rounded-2xl px-5 py-3 text-sm font-semibold transition ${isCurrent
                    ? 'cursor-default bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    : 'bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] text-white shadow-md hover:brightness-105'
                    }`}
                >
                  {isCurrent ? 'Current Plan' : 'Choose'}
                </button>
              </motion.div>
            )
          })}
        </div>

        {filteredPlans.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No plans available for {target} {cycle} billing. Try another combination.
          </div>
        )}
      </section>

      {/* ── Manage subscription ───────────────────────────────────────── */}
      {activePlan && (
        <ManageSection
          subscription={mySubscription}
          plan={activePlan}
          used={used}
          featuredUsed={featuredUsed}
          onChangePlan={() => scrollToPlans()}
          onCancel={cancelAtPeriodEnd}
          cancelling={cancelling}
        />
      )}

      {/* ── Checkout confirmation modal ───────────────────────────────── */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={() => { if (checkoutState !== 'starting') setSelectedPlan(null) }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm Your Plan</h3>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  disabled={checkoutState === 'starting'}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">
                      {selectedPlan.name} Plan <span className="text-slate-400">· {selectedPlan.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{target === 'company' ? 'Company' : 'Individual'} subscription</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {planFeatures(selectedPlan).map((feature) => (
                    <li key={feature.label} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {feature.value}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>Subscription</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatAmount(selectedPlan.price, selectedPlan.currency)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                    <span>Total</span>
                    <span>{formatAmount(selectedPlan.price, selectedPlan.currency)}</span>
                  </div>
                </div>

                {checkoutState === 'error' && (
                  <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{checkoutError}</p>
                )}

                <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                  Secured by Chapa — you'll be redirected to complete payment.
                </div>

                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={checkoutState === 'starting'}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:opacity-60"
                >
                  {checkoutState === 'starting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting checkout…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Continue to Payment
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ManageSection({ subscription, plan, used, featuredUsed, onChangePlan, onCancel, cancelling }) {
  const features = planFeatures(plan)
  const rows = [
    { label: 'Listings', value: `${used} / ${listingLimitLabel(plan)}` },
    { label: 'Featured listings', value: `${featuredUsed} / ${plan.featured_listing_limit == null ? 'Unlimited' : plan.featured_listing_limit}` },
    { label: 'Commission discount', value: `${Number(plan.commission_rate_discount) || 0}%` },
  ]
  return (
    <section id="subscription-manage" className="scroll-mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Wallet className="h-5 w-5 text-[#b98227] dark:text-[#f3c96d]" />
          Subscription management
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {subscription?.status === 'trialing' ? 'Trialing' : 'Active'}
        </span>
      </div>

      <div className="grid gap-6 px-6 py-5 lg:grid-cols-2">
        <div className="space-y-3 text-sm">
          <Row label="Started" value={formatDate(subscription?.current_period_start)} />
          <Row label="Renews" value={formatDate(subscription?.current_period_end)} />
          <Row label="Billing" value={plan.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'} />
          {features.map((f) => (
            <Row key={f.label} label={f.label} value={f.value} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subscription?.cancel_at_period_end
              ? `This subscription is set to cancel at the end of the current billing period (${formatDate(subscription.current_period_end)}). You can reactivate it by changing plans below.`
              : `Your plan renews automatically on ${formatDate(subscription?.current_period_end)}.`}
          </p>
          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onChangePlan}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
            >
              <ArrowRight className="h-4 w-4" />
              Change Plan
            </button>
            {!subscription?.cancel_at_period_end && (
              <button
                type="button"
                onClick={onCancel}
                disabled={cancelling}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Cancel at Period End
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-6 mb-5 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
        Listing limits are enforced by the platform's server. This page only reflects your current plan and usage.
      </div>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}