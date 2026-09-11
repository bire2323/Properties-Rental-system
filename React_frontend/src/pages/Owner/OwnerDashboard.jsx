import { useEffect, useMemo, useState } from 'react'
import {
    ArrowRight, Building2, CalendarCheck, DollarSign, Home,
    Plus, Sparkles, Inbox, TrendingUp, ChevronRight, LayoutGrid,
    Clock, CheckCircle2, XCircle, Zap, Wallet, ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getAllProperties } from '../../api/property/propertyApi'
import { listBookings } from '../../api/bookingApi'
import { subscriptionApi } from '../../api/subscriptionApi'
import StatCard from './components/StatCard'
import PropertyGrid from './components/PropertyGrid'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import { formatAmount, formatDisplayDate, formatRentalType } from '../../lib/bookingDisplay'

const DRAFT_STORAGE_KEY = 'property_add_draft'

function getInitials(user) {
    if (!user) return '?'
    const f = user.first_name?.[0] ?? ''
    const l = user.last_name?.[0] ?? ''
    return (f + l).toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
}

function QuickAction({ icon, label, sub, onClick, primary }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ${primary
                    ? 'bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] text-white shadow-md shadow-amber-200/40 hover:shadow-lg hover:shadow-amber-300/50 hover:-translate-y-0.5 dark:shadow-amber-900/30'
                    : 'border border-slate-200/80 bg-slate-50/80 text-slate-800 hover:border-[#c99b43]/40 hover:bg-amber-50/60 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-[#c99b43]/40 dark:hover:bg-amber-950/30'
                }`}
        >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${primary ? 'bg-white/20' : 'bg-white dark:bg-slate-800 shadow-sm'
                }`}>
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug">{label}</span>
                {sub && (
                    <span className={`mt-0.5 block text-xs ${primary ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                        {sub}
                    </span>
                )}
            </span>
            <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${primary ? 'text-white/70' : 'text-slate-400'}`} />
        </button>
    )
}

function SubscriptionBanner({ subscription, propertiesCount, onManage, onUpgrade }) {
    const freePlan = !subscription?.plan
    const name = subscription?.plan?.name || 'Free'
    const showActive = subscription?.status === 'active' || subscription?.status === 'trialing'
    const limit = subscription?.plan?.max_listings
    const used = propertiesCount ?? 0
    const pct = limit == null ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100))
    const textClass = showActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c99b43]'
    const periodEnd = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null

    return (
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-200/70 bg-white/70 p-5 sm:p-6 shadow-sm backdrop-blur-sm dark:border-amber-900/30 dark:bg-slate-900/60">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#c99b43]/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md ${showActive ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-[#c99b43] to-[#e8bb6a]'}`}>
                        {showActive ? <ShieldCheck className="h-6 w-6 text-white" /> : <Sparkles className="h-6 w-6 text-white" />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{name} Plan</p>
                            {freePlan ? (
                                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    Basic
                                </span>
                            ) : (
                                <span className={`rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${textClass} dark:bg-emerald-950/50`}>
                                    {showActive ? 'Active' : subscription?.status || 'Inactive'}
                                </span>
                            )}
                        </div>
                        {freePlan ? (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Post up to 5 listings for free · Upgrade to unlock more
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {limit == null ? 'Unlimited listings' : `${used}/${limit} listings used`}
                                {periodEnd ? ` · Renews ${periodEnd}` : ''}
                            </p>
                        )}
                        {!freePlan && limit != null && (
                            <div className="mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                                <div className={`h-full rounded-full ${showActive ? 'bg-emerald-500' : 'bg-[#c99b43]'}`} style={{ width: `${pct}%` }} />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onManage}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#c99b43]/40 px-4 py-2.5 text-sm font-semibold text-[#b98227] transition hover:bg-[#c99b43]/5 dark:text-[#f3c96d]"
                    >
                        <Wallet className="h-4 w-4" />
                        {freePlan ? 'View Plans' : 'Manage'}
                    </button>
                    {!freePlan && (
                        <button
                            type="button"
                            onClick={onUpgrade}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c99b43] to-[#e8bb6a] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-300/30 transition-all hover:-translate-y-0.5 dark:shadow-amber-900/30"
                        >
                            <Zap className="h-4 w-4" />
                            Upgrade
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}

export default function OwnerDashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [bookings, setBookings] = useState([])
    const [bookingsLoading, setBookingsLoading] = useState(true)
    const [subscription, setSubscription] = useState(null)
    const [subscriptionLoading, setSubscriptionLoading] = useState(true)

    useEffect(() => {
        async function loadSubscription() {
            try {
                const sub = await subscriptionApi.getMySubscription()
                setSubscription(sub)
            } catch {
                setSubscription(null)
            } finally {
                setSubscriptionLoading(false)
            }
        }
        loadSubscription()
    }, [])

    useEffect(() => {
        async function loadProperties() {
            setLoading(true)
            setError(null)
            try {
                const data = await getAllProperties()
                const results = Array.isArray(data) ? data : data.results || []
                setProperties(results)
            } catch (err) {
                setError(err.message || 'Unable to load dashboard data.')
            } finally {
                setLoading(false)
            }
        }
        loadProperties()
    }, [])

    useEffect(() => {
        async function loadBookings() {
            try {
                const data = await listBookings()
                const results = Array.isArray(data) ? data : data.results || []
                setBookings(results)
            } catch {
                setBookings([])
            } finally {
                setBookingsLoading(false)
            }
        }
        loadBookings()
    }, [])

    const ownerProperties = useMemo(
        () => properties.filter((p) => p.owner_email === user?.email),
        [properties, user]
    )

    const pendingBookings = useMemo(() => bookings.filter((b) => b.status === 'pending'), [bookings])
    const approvedBookings = useMemo(() => bookings.filter((b) => b.status === 'approved'), [bookings])
    const recentBookings = useMemo(() => bookings.slice(0, 4), [bookings])

    const totalProperties = ownerProperties.length
    const availableProperties = ownerProperties.filter((p) => p.status === 'active').length
    const rentedProperties = ownerProperties.filter((p) => p.status === 'rented').length
    const rentalValue = ownerProperties.reduce((s, p) => s + parseFloat(p.price || 0), 0)

    const recentProperties = ownerProperties.slice(0, 3)

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    const name = user?.first_name || 'there'

    return (
        <div className="space-y-6 sm:space-y-8">

            {/* HERO BANNER */}
            <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-200/60 bg-gradient-to-br from-[#fdf6e3] via-white to-[#eef4fb] p-6 sm:p-8 shadow-md dark:border-amber-900/30 dark:from-[#1a1608] dark:via-slate-950 dark:to-[#0d1520]">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#c99b43]/10 blur-3xl dark:bg-[#c99b43]/5" />
                <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-500/5" />
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-[#c99b43]/0 via-[#c99b43] to-[#c99b43]/0" />

                <img
                    src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=80"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 top-4 h-36 w-36 rounded-3xl object-cover opacity-20 blur-[0.5px] sm:h-48 sm:w-48 lg:right-6 lg:h-56 lg:w-56 lg:opacity-25"
                />

                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c99b43] to-[#e8bb6a] text-white text-lg font-bold shadow-lg shadow-amber-300/30 dark:shadow-amber-900/40">
                            {getInitials(user)}
                            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-950" />
                        </div>

                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c99b43]">
                                {greeting}
                            </p>
                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                {name} <span className="text-[#c99b43]">✦</span>
                            </h2>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                Manage your properties, bookings, and rental activity from one beautiful place.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 xl:flex-nowrap xl:flex-col xl:min-w-[200px]">
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties/add')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c99b43] to-[#e2af5b] px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-300/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-400/50 dark:shadow-amber-900/30 active:translate-y-0"
                        >
                            <Plus className="h-4 w-4" />
                            Add Property
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 backdrop-blur-sm transition-all duration-200 hover:border-[#c99b43]/40 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-[#c99b43]/40"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            View Properties
                        </button>
                    </div>
                </div>
            </section>

            {!subscriptionLoading && (
                <SubscriptionBanner
                    subscription={subscription}
                    propertiesCount={totalProperties}
                    onManage={() => navigate('/owner/subscriptions')}
                    onUpgrade={() => navigate('/owner/subscriptions')}
                />
            )}

            {/* STAT CARDS */}
            <section>
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="rounded-2xl sm:rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
                        <p className="font-semibold">Unable to load dashboard data.</p>
                        <p className="mt-2">{error}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        <StatCard
                            icon={<Home className="h-5 w-5" />}
                            label="Total"
                            value={totalProperties}
                            description="Properties posted"
                            accent="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#92400e] dark:from-[#451a03] dark:to-[#78350f] dark:text-[#fcd34d]"
                        />
                        <StatCard
                            icon={<Building2 className="h-5 w-5" />}
                            label="Available"
                            value={availableProperties}
                            description="Ready for bookings"
                            accent="bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] text-[#065f46] dark:from-[#022c22] dark:to-[#064e3b] dark:text-[#6ee7b7]"
                        />
                        <StatCard
                            icon={<CalendarCheck className="h-5 w-5" />}
                            label="Rented"
                            value={rentedProperties}
                            description="Currently occupied"
                            accent="bg-gradient-to-br from-[#ede9fe] to-[#ddd6fe] text-[#4c1d95] dark:from-[#2e1065] dark:to-[#3b0764] dark:text-[#c4b5fd]"
                        />
                        <StatCard
                            icon={<TrendingUp className="h-5 w-5" />}
                            label="Value"
                            value={`ETB ${rentalValue.toLocaleString()}`}
                            description="Est. monthly rents"
                            accent="bg-gradient-to-br from-[#fef9c3] to-[#fef08a] text-[#854d0e] dark:from-[#422006] dark:to-[#713f12] dark:text-[#fde047]"
                        />
                    </div>
                )}
            </section>

            {/* PENDING BOOKING BANNER */}
            {!bookingsLoading && pendingBookings.length > 0 && (
                <button
                    type="button"
                    onClick={() => navigate('/owner/bookings')}
                    className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-300/70 bg-gradient-to-r from-amber-50 to-orange-50 p-5 text-left transition-all duration-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/60 dark:border-amber-800/50 dark:from-amber-950/50 dark:to-orange-950/40 dark:hover:shadow-amber-950/40"
                >
                    <span className="absolute right-16 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-amber-400 opacity-60">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    </span>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-900/50 dark:text-amber-200">
                        <Inbox className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-amber-900 dark:text-amber-100">
                            {pendingBookings.length} booking{pendingBookings.length > 1 ? 's' : ''} waiting for your review
                        </span>
                        <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-400">
                            Tap to approve or reject them.
                        </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-amber-500 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
            )}

            {/* MAIN GRID */}
            <section className="grid gap-5 xl:grid-cols-[1fr_320px]">

                {/* Property Overview */}
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">Property Overview</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your most recently added properties</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties')}
                            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-[#c99b43] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-amber-950/30 dark:hover:text-[#c99b43]"
                        >
                            View all
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="mt-6"><LoadingSkeleton /></div>
                    ) : !ownerProperties.length ? (
                        <div className="mt-6">
                            <EmptyState
                                title="No properties yet"
                                description="You haven't added any properties to your account."
                                action={
                                    <button
                                        type="button"
                                        onClick={() => navigate('/owner/properties/add')}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#c99b43] to-[#e2af5b] px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-300/40 transition hover:-translate-y-0.5 hover:shadow-lg dark:shadow-amber-900/30"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Property
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="mt-6">
                            <PropertyGrid properties={recentProperties} />
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">Quick Actions</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump to important workflows</p>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
                            <Zap className="h-4 w-4 text-[#c99b43]" />
                        </span>
                    </div>

                    <div className="mt-5 space-y-3">
                        <QuickAction
                            primary
                            icon={<Plus className="h-4 w-4 text-white" />}
                            label="Add a new property"
                            sub="List your property or vehicle"
                            onClick={() => navigate('/owner/properties/add')}
                        />
                        <QuickAction
                            icon={<Inbox className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                            label="Review booking requests"
                            sub={pendingBookings.length > 0 ? `${pendingBookings.length} pending` : 'All caught up'}
                            onClick={() => navigate('/owner/bookings')}
                        />
                        <QuickAction
                            icon={<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                            label="View payments"
                            sub="Track your earnings"
                            onClick={() => navigate('/owner/payments')}
                        />
                        <QuickAction
                            icon={<LayoutGrid className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
                            label="Manage properties"
                            sub={`${totalProperties} total listings`}
                            onClick={() => navigate('/owner/properties')}
                        />
                    </div>

                    {!bookingsLoading && (
                        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Booking Summary
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{pendingBookings.length}</p>
                                    <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Pending</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{approvedBookings.length}</p>
                                    <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Approved</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{bookings.length}</p>
                                    <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* RECENT BOOKINGS */}
            {!bookingsLoading && bookings.length > 0 && (
                <section className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">Recent Bookings</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest requests on your listings</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/bookings')}
                            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-[#c99b43] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-amber-950/30 dark:hover:text-[#c99b43]"
                        >
                            View all
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                        {recentBookings.map((booking) => (
                            <li key={booking.id}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/owner/bookings')}
                                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-left transition-all duration-200 hover:border-[#c99b43]/30 hover:bg-amber-50/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-[#c99b43]/30 dark:hover:bg-amber-950/20"
                                >
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105 ${booking.status === 'approved'
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                            : booking.status === 'rejected'
                                                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                                        }`}>
                                        {booking.status === 'approved'
                                            ? <CheckCircle2 className="h-5 w-5" />
                                            : booking.status === 'rejected'
                                                ? <XCircle className="h-5 w-5" />
                                                : <Clock className="h-5 w-5" />
                                        }
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                            {booking.property_name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                            {formatRentalType(booking.rental_type)} · {formatDisplayDate(booking.start_date)}
                                            {booking.end_date ? ` -> ${formatDisplayDate(booking.end_date)}` : ' (ongoing)'}
                                        </p>
                                        <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">
                                            {booking.renter_email || 'Renter'}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {formatAmount(booking.total_amount, booking.currency)}
                                        </span>
                                        <BookingStatusBadge status={booking.status} size="sm" />
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    )
}
