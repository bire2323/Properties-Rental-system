import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
    AlertCircle,
    CalendarDays,
    ChevronRight,
    Filter,
    Inbox,
    Paperclip,
    RefreshCw,
    RotateCcw,
    Search,
    SlidersHorizontal,
    User,
    X,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import AdminBookingDrawer, { PAYMENT_STATUS_OPTIONS, paymentStatusLabel, paymentStatusTone } from './components/AdminBookingDrawer'
import { getAdminBookings } from '../../api/bookingApi'
import { getAllProperties } from '../../api/admin/adminApi'
import {
    formatAmount,
    formatCreatedDate,
    formatDisplayDate,
    formatListingType,
    formatRentalType,
    resolveDocumentUrl,
} from '../../lib/bookingDisplay'

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'expired', label: 'Expired' },
]


const RENTAL_OPTIONS = [
    { value: '', label: 'All rental types' },
    { value: 'fixed_term', label: 'Fixed term' },
    { value: 'month_to_month', label: 'Month to month' },
]

const LISTING_OPTIONS = [
    { value: '', label: 'All listing types' },
    { value: 'house', label: 'House' },
    { value: 'car', label: 'Vehicle' },
]


function TableSkeleton({ isDark }) {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-14 animate-pulse rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`} />
            ))}
        </div>
    )
}


export default function AdminBookings() {
    const reduceMotion = useReducedMotion()
    const { isDark } = useTheme()
    const initialBookingCount = 5
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [bookings, setBookings] = useState([])
    const [visibleBookingCount, setVisibleBookingCount] = useState(initialBookingCount)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selected, setSelected] = useState(null)
    const [properties, setProperties] = useState([])
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        listing_type: '',
        rental_type: '',
        property: '',
        renter: '',
        owner: '',
        payment_status: '',
        start_date_from: '',
        start_date_to: '',
        end_date_from: '',
        end_date_to: '',
    })

    const loadBookings = useCallback(async (filterArgs) => {
        setLoading(true)
        setError(null)
        try {
            const data = await getAdminBookings(filterArgs)
            const results = Array.isArray(data) ? data : data.results || []
            setBookings(results)
            setVisibleBookingCount(initialBookingCount)
        } catch (err) {
            setError(err.message || 'Unable to load bookings.')
            setBookings([])
        } finally {
            setLoading(false)
        }
    }, [])

    const refresh = useCallback(() => {
        const active = {}
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '' && value !== undefined && value !== null) {
                active[key] = value
            }
        })
        loadBookings(active)
    }, [filters, loadBookings])

    useEffect(() => {
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        getAllProperties().then((data) => {
            const results = Array.isArray(data) ? data : data.results || []
            setProperties(results)
        }).catch(() => { })
    }, [])

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setSelected(null)
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [])

    const applyFilters = () => {
        setFilterDrawerOpen(false)
        refresh()
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            listing_type: '',
            rental_type: '',
            property: '',
            renter: '',
            owner: '',
            payment_status: '',
            start_date_from: '',
            start_date_to: '',
            end_date_from: '',
            end_date_to: '',
        })
    }

    const activeFilterCount = Object.values(filters).filter((v) => v !== '' && v !== undefined && v !== null).length

    const propertyOptions = properties.map((p) => ({
        value: String(p.id),
        label: p.property_name || p.title || `Property #${p.id}`,
    }))

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="min-w-0 flex-1 overflow-x-hidden">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Bookings</h1>
                            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Manage and audit all booking activity across the platform.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {loading ? 'Loading…' : `${bookings.length} booking${bookings.length === 1 ? '' : 's'}`}
                            </span>
                            <button
                                type="button"
                                onClick={refresh}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Search + filter bar */}
                    <div className={`rounded-xl border shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className="p-6">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="relative w-full xl:max-w-md">
                                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                                        onKeyDown={(e) => { if (e.key === 'Enter') applyFilters() }}
                                        placeholder="Search booking reference..."
                                        className={`w-full rounded-lg border px-3 py-2.5 pl-10 pr-11 text-sm outline-none transition ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-slate-600' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-300'}`}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={applyFilters}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <Filter className="h-4 w-4" />
                                        Apply
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterDrawerOpen(true)}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${activeFilterCount > 1 ? 'bg-[#C99B43] text-white border-[#C99B43]' : isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Filters
                                        {activeFilterCount > 1 && (
                                            <span className="rounded-full bg-white/20 px-1.5 text-[10px] font-bold">{activeFilterCount}</span>
                                        )}
                                    </button>
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40`}
                                        >
                                            <X className="h-4 w-4" />
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Status quick filter (desktop) */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => {
                                            setFilters((f) => ({ ...f, status: filters.status === o.value ? '' : o.value }))
                                            setTimeout(refresh, 0)
                                        }}
                                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${filters.status === o.value
                                            ? 'bg-[#C99B43] text-white shadow-sm'
                                            : isDark
                                                ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && <div className="mt-6"><TableSkeleton isDark={isDark} /></div>}

                    {/* Error */}
                    {error && (
                        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/40">
                            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                            <h3 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-200">Unable to load bookings</h3>
                            <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
                            <button
                                type="button"
                                onClick={refresh}
                                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && bookings.length === 0 && (
                        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
                            <Inbox className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No bookings found</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {activeFilterCount > 0 ? 'No bookings match the current filters.' : 'There are no bookings yet.'}
                            </p>
                            {activeFilterCount > 0 && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                                >
                                    <X className="h-4 w-4" />
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Desktop table */}
                    {!loading && !error && bookings.length > 0 && (
                        <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 xl:block">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className={`border-b text-xs uppercase tracking-wider ${isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                                        <tr>
                                            <th className="w-12 px-4 py-4 text-center text-[10px] font-bold text-slate-400">#</th>
                                            <th className="px-6 py-4 font-semibold">Reference / Property</th>
                                            <th className="px-6 py-4 font-semibold">Renter</th>
                                            <th className="px-6 py-4 font-semibold">Owner</th>
                                            <th className="px-6 py-4 font-semibold">Type</th>
                                            <th className="px-6 py-4 font-semibold">Dates</th>
                                            <th className="px-6 py-4 font-semibold">Amount</th>
                                            <th className="px-6 py-4 font-semibold">Booking</th>
                                            <th className="px-6 py-4 font-semibold">Payment</th>
                                            <th className="px-6 py-4 font-semibold">Created</th>
                                            <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                        {bookings.slice(0, visibleBookingCount).map((booking, idx) => (
                                            <tr key={booking.id} className={`transition ${isDark ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50/70'}`}>
                                                <td className="px-4 py-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500">{idx + 1}</td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => setSelected(booking)} className="text-left">
                                                        <p className="font-mono text-[11px] text-slate-400">{booking.booking_reference}</p>
                                                        <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">{booking.property_name}</p>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-slate-700 dark:text-slate-300">{booking.renter_name || '—'}</p>
                                                    <p className="text-xs text-slate-400">{booking.renter_email || ''}</p>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                    {booking.property_owner_email || booking.recipient_owner_email || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-slate-600 dark:text-slate-300">{formatListingType(booking.listing_type)}</span>
                                                    <p className="text-xs text-slate-400">{formatRentalType(booking.rental_type)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                    <p>{formatDisplayDate(booking.start_date)}</p>
                                                    <p className="text-xs text-slate-400">{booking.end_date ? formatDisplayDate(booking.end_date) : 'Ongoing'}</p>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                                    {formatAmount(booking.total_amount, booking.currency)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <BookingStatusBadge status={booking.status} size="sm" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {booking.latest_payment_status ? (
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${paymentStatusTone(booking.latest_payment_status)}`}>
                                                            {paymentStatusLabel(booking.latest_payment_status)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">None</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {formatCreatedDate(booking.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelected(booking)}
                                                            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-[#C99B43] transition hover:bg-[#C99B43]/10"
                                                        >
                                                            View
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Mobile / tablet cards */}
                    {!loading && !error && bookings.length > 0 && (
                        <div className="mt-6 grid gap-4 xl:hidden lg:grid-cols-2">
                            {bookings.slice(0, visibleBookingCount).map((booking, i) => (
                                <motion.article
                                    key={booking.id}
                                    initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: reduceMotion ? 0 : Math.min(i * 0.03, 0.3) }}
                                    className={`flex flex-col overflow-hidden rounded-3xl border shadow-sm ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{i + 1}</span>
                                                    <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                                                        {booking.property_name}
                                                    </p>
                                                </div>
                                                <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">
                                                    {booking.booking_reference}
                                                </p>
                                            </div>
                                            <BookingStatusBadge status={booking.status} size="sm" />
                                        </div>

                                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <User className="h-4 w-4 text-[#c99b43]" />
                                            <span className="truncate">{booking.renter_email || 'Renter'}</span>
                                        </div>

                                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <CalendarDays className="h-4 w-4 text-[#c99b43]" />
                                            {formatDisplayDate(booking.start_date)}
                                            {booking.end_date ? ` → ${formatDisplayDate(booking.end_date)}` : ' (ongoing)'}
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-400">Amount</p>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {formatAmount(booking.total_amount, booking.currency)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Payment</p>
                                                {booking.latest_payment_status ? (
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${paymentStatusTone(booking.latest_payment_status)}`}>
                                                        {paymentStatusLabel(booking.latest_payment_status)}
                                                    </span>
                                                ) : (
                                                    <p className="text-sm text-slate-400">None</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-2 border-t px-5 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(booking)}
                                            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                                        >
                                            View details
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    )}

                    {!loading && !error && bookings.length > initialBookingCount && (
                        <div className="mt-4 flex justify-center gap-3">
                            {visibleBookingCount > initialBookingCount && (
                                <button
                                    type="button"
                                    onClick={() => setVisibleBookingCount(initialBookingCount)}
                                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                >
                                    View less
                                </button>
                            )}
                            {visibleBookingCount < bookings.length && (
                                <button
                                    type="button"
                                    onClick={() => setVisibleBookingCount((count) => Math.min(count + initialBookingCount, bookings.length))}
                                    className="rounded-lg bg-[#c99b43] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                                >
                                    View more
                                </button>
                            )}
                        </div>
                    )}

                    {/* Details drawer */}
                    <AdminBookingDrawer
                        booking={selected}
                        onClose={() => setSelected(null)}
                        onRefresh={refresh}
                    />

                    {/* Filter drawer (mobile/tablet) */}
                    <AnimatePresence>
                        {filterDrawerOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setFilterDrawerOpen(false)}
                                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                                    className="fixed inset-x-0 bottom-0 top-auto z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-950 lg:inset-y-0 lg:left-0 lg:right-auto lg:top-0 lg:h-full lg:w-[26rem] lg:max-h-full lg:translate-x-0 lg:rounded-none"
                                >
                                    <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h2>
                                        <button
                                            type="button"
                                            onClick={() => setFilterDrawerOpen(false)}
                                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                            aria-label="Close filters"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <FilterField label="Booking status">
                                            <select
                                                value={filters.status}
                                                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                            >
                                                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </FilterField>

                                        <FilterField label="Listing type">
                                            <select
                                                value={filters.listing_type}
                                                onChange={(e) => setFilters((f) => ({ ...f, listing_type: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                            >
                                                {LISTING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </FilterField>

                                        <FilterField label="Rental type">
                                            <select
                                                value={filters.rental_type}
                                                onChange={(e) => setFilters((f) => ({ ...f, rental_type: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                            >
                                                {RENTAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </FilterField>

                                        <FilterField label="Payment status">
                                            <select
                                                value={filters.payment_status}
                                                onChange={(e) => setFilters((f) => ({ ...f, payment_status: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                            >
                                                {PAYMENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </FilterField>

                                        <FilterField label="Property">
                                            <select
                                                value={filters.property}
                                                onChange={(e) => setFilters((f) => ({ ...f, property: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                                            >
                                                <option value="">All properties</option>
                                                {propertyOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </FilterField>

                                        <FilterField label="Renter ID">
                                            <input
                                                type="text"
                                                value={filters.renter}
                                                onChange={(e) => setFilters((f) => ({ ...f, renter: e.target.value }))}
                                                placeholder="Renter user ID"
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
                                            />
                                        </FilterField>

                                        <FilterField label="Owner ID">
                                            <input
                                                type="text"
                                                value={filters.owner}
                                                onChange={(e) => setFilters((f) => ({ ...f, owner: e.target.value }))}
                                                placeholder="Owner user ID"
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
                                            />
                                        </FilterField>

                                        <FilterField label="Start date from">
                                            <input
                                                type="date"
                                                value={filters.start_date_from}
                                                onChange={(e) => setFilters((f) => ({ ...f, start_date_from: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
                                            />
                                        </FilterField>

                                        <FilterField label="Start date to">
                                            <input
                                                type="date"
                                                value={filters.start_date_to}
                                                onChange={(e) => setFilters((f) => ({ ...f, start_date_to: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
                                            />
                                        </FilterField>

                                        <FilterField label="End date from">
                                            <input
                                                type="date"
                                                value={filters.end_date_from}
                                                onChange={(e) => setFilters((f) => ({ ...f, end_date_from: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
                                            />
                                        </FilterField>

                                        <FilterField label="End date to">
                                            <input
                                                type="date"
                                                value={filters.end_date_to}
                                                onChange={(e) => setFilters((f) => ({ ...f, end_date_to: e.target.value }))}
                                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
                                            />
                                        </FilterField>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            onClick={applyFilters}
                                            className="flex-1 rounded-xl bg-[#C99B43] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                                        >
                                            Apply filters
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}

function FilterField({ label, children }) {
    return (
        <div>
            <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider ${'text-slate-500'}`}>
                {label}
            </label>
            {children}
        </div>
    )
}
