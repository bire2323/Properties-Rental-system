import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
    AlertCircle,
    CalendarDays,
    ChevronRight,
    Filter,
    History,
    Inbox,
    Loader2,
    Receipt,
    RefreshCw,
    RotateCcw,
    Search,
    SlidersHorizontal,
    User,
    Wallet,
    X,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import {
    getAdminBookings,
    getBookingAudit,
    adminCancelBooking,
    adminExpireBooking,
    adminCompleteBooking,
} from '../../api/bookingApi'
import { getAllProperties } from '../../api/admin/adminApi'
import {
    formatAmount,
    formatCreatedDate,
    formatDisplayDate,
    formatListingType,
    formatRentalType,
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

const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: 'All payments' },
    { value: 'initiated', label: 'Initiated' },
    { value: 'pending', label: 'Pending' },
    { value: 'successful', label: 'Successful' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'partially_refunded', label: 'Partially Refunded' },
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

export function paymentStatusLabel(status) {
    return PAYMENT_STATUS_OPTIONS.find((o) => o.value === status)?.label || status || 'No payment'
}

export function paymentStatusTone(status) {
    switch (status) {
        case 'successful': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
        case 'pending':
        case 'initiated': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
        case 'failed':
        case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-200'
        case 'refunded':
        case 'partially_refunded': return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
        default: return 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
    }
}

function TableSkeleton({ isDark }) {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-14 animate-pulse rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`} />
            ))}
        </div>
    )
}

function AdminBookingDrawer({
    booking,
    onClose,
    onRefresh,
}) {
    const reduceMotion = useReducedMotion()
    const { isDark } = useTheme()
    const [audit, setAudit] = useState(null)
    const [auditLoading, setAuditLoading] = useState(true)
    const [action, setAction] = useState(null)
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [actionError, setActionError] = useState(null)

    const loadAudit = useCallback(async () => {
        if (!booking) return
        setAuditLoading(true)
        try {
            const data = await getBookingAudit(booking.id)
            setAudit(Array.isArray(data) ? data : [])
        } catch {
            setAudit([])
        } finally {
            setAuditLoading(false)
        }
    }, [booking])

    useEffect(() => {
        loadAudit()
    }, [loadAudit])

    const availableActions = useMemo(() => {
        const list = []
        if (['pending', 'approved', 'confirmed'].includes(booking?.status)) {
            list.push({ key: 'cancel', label: 'Cancel booking' })
        }
        if (['pending', 'approved'].includes(booking?.status)) {
            list.push({ key: 'expire', label: 'Mark as expired' })
        }
        if (['approved', 'confirmed'].includes(booking?.status)) {
            list.push({ key: 'complete', label: 'Mark as completed' })
        }
        return list
    }, [booking?.status])

    const performAction = async () => {
        if (!action) return
        setSubmitting(true)
        setActionError(null)
        try {
            if (action.key === 'cancel') {
                await adminCancelBooking(booking.id, reason)
            } else if (action.key === 'expire') {
                await adminExpireBooking(booking.id, reason)
            } else if (action.key === 'complete') {
                await adminCompleteBooking(booking.id, reason)
            }
            setConfirmOpen(false)
            setAction(null)
            setReason('')
            await loadAudit()
            onRefresh()
        } catch (err) {
            setActionError(err.message || 'The action could not be completed.')
        } finally {
            setSubmitting(false)
        }
    }

    const renderPayment = () => {
        const hasPayment = booking?.latest_payment_status
        return (
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Wallet className="h-4 w-4 text-[#c99b43]" />
                    Payment
                </h4>
                {hasPayment ? (
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${paymentStatusTone(booking.latest_payment_status)}`}>
                                {paymentStatusLabel(booking.latest_payment_status)}
                            </span>
                        </div>
                        <DetailRow label="Method" value={booking.latest_payment_method_display || '—'} />
                        <DetailRow label="Reference" value={booking.latest_payment_reference || '—'} />
                        <DetailRow label="Attempts" value={booking.payment_attempt_count ?? 0} />
                        <DetailRow
                            label="Paid at"
                            value={booking.latest_payment_created_at ? formatCreatedDate(booking.latest_payment_created_at) : '—'}
                        />
                    </div>
                ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No payment recorded for this booking.</p>
                )}
            </div>
        )
    }

    return (
        <AnimatePresence>
            {booking && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                        transition={{ duration: reduceMotion ? 0 : 0.25 }}
                        className="fixed inset-x-0 bottom-0 top-auto z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:h-full lg:w-[30rem] lg:max-h-full lg:translate-x-0 lg:rounded-none"
                    >
                        <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 backdrop-blur ${isDark ? 'border-slate-800 bg-slate-950/95' : 'border-slate-200 bg-white/95'}`}>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Booking details</p>
                                <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                                    {booking.booking_reference}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-6 p-6">
                            {/* Status banner */}
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatListingType(booking.listing_type)}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{booking.property_name}</p>
                                </div>
                                <BookingStatusBadge status={booking.status} size="sm" />
                            </div>

                            {/* Booking info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Booking</h4>
                                <DetailRow label="Reference" value={booking.booking_reference} />
                                <DetailRow label="Status" value={booking.status} />
                                <DetailRow label="Rental type" value={formatRentalType(booking.rental_type)} />
                                <DetailRow label="Start date" value={formatDisplayDate(booking.start_date)} />
                                <DetailRow label="End date" value={booking.end_date ? formatDisplayDate(booking.end_date) : 'Ongoing'} />
                                <DetailRow label="Created" value={formatCreatedDate(booking.created_at)} />
                            </div>

                            {/* Property */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Property</h4>
                                <DetailRow label="Name" value={booking.property_name} />
                                <DetailRow label="Listing type" value={formatListingType(booking.listing_type)} />
                                <DetailRow label="Location" value={booking.property_address || '—'} />
                                <DetailRow label="City" value={booking.property_city || '—'} />
                                <DetailRow label="Region" value={booking.property_region || '—'} />
                            </div>

                            {/* Renter */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Renter</h4>
                                <DetailRow label="Name" value={booking.renter_name || '—'} />
                                <DetailRow label="Email" value={booking.renter_email || '—'} />
                            </div>

                            {/* Owner / recipient */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Owner / Recipient</h4>
                                <DetailRow label="Owner email" value={booking.property_owner_email || '—'} />
                                <DetailRow label="Company" value={booking.property_company_name || booking.recipient_company_name || '—'} />
                                <DetailRow label="Recipient owner" value={booking.recipient_owner_email || '—'} />
                            </div>

                            {/* Financial */}
                            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                    <Receipt className="h-4 w-4 text-[#c99b43]" />
                                    Financial
                                </h4>
                                <div className="mt-4 space-y-3">
                                    <DetailRow label="Base price" value={formatAmount(booking.base_price, booking.currency)} />
                                    <DetailRow label="Security deposit" value={formatAmount(booking.security_deposit, booking.currency)} />
                                    <DetailRow label="Platform fee" value={formatAmount(booking.platform_fee_amount, booking.currency)} />
                                    <DetailRow label="Owner payout" value={formatAmount(booking.owner_payout_amount, booking.currency)} />
                                    <div className="my-1 border-t border-dashed border-slate-200 dark:border-slate-800" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Total</span>
                                        <span className="text-lg font-bold text-[#c99b43]">
                                            {formatAmount(booking.total_amount, booking.currency)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment (real data only) */}
                            {renderPayment()}

                            {/* Audit */}
                            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                    <History className="h-4 w-4 text-[#c99b43]" />
                                    Audit history
                                </h4>
                                <div className="mt-4 space-y-3">
                                    {auditLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading audit trail…
                                        </div>
                                    ) : audit && audit.length > 0 ? (
                                        audit.map((event) => (
                                            <div key={event.id} className="flex items-start gap-3">
                                                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-900 capitalize dark:text-white">
                                                        {String(event.action || '').replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                        {event.actor_name || event.actor_email || 'System'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {event.previous_status || '—'} → {event.new_status || '—'}
                                                        {event.reason ? ` · ${event.reason}` : ''}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                                        {formatCreatedDate(event.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">No audit events recorded.</p>
                                    )}
                                </div>
                            </div>

                            {/* Admin actions */}
                            {availableActions.length > 0 && (
                                <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Admin actions</h4>
                                    {availableActions.map((a) => (
                                        <button
                                            key={a.key}
                                            type="button"
                                            onClick={() => {
                                                setAction(a)
                                                setReason('')
                                                setActionError(null)
                                                setConfirmOpen(true)
                                            }}
                                            className={`w-full rounded-2xl border px-5 py-3 text-sm font-semibold transition ${a.key === 'cancel'
                                                    ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40'
                                                    : a.key === 'complete'
                                                        ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-950/40'
                                                        : 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-950/40'
                                                }`}
                                        >
                                            {a.label}
                                        </button>
                                    ))}
                                    <p className="text-xs text-slate-400">
                                        Admin actions are exceptions and require a reason. The backend remains authoritative.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Confirm action dialog */}
                    <AnimatePresence>
                        {confirmOpen && action && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => !submitting && setConfirmOpen(false)}
                                    className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
                                    className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-950"
                                >
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {action.label}
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        You are about to {action.label.toLowerCase()}: {booking.booking_reference}. This will change the booking status permanently.
                                    </p>

                                    <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="Provide a mandatory reason for this action..."
                                        className={`mt-2 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-[#C99B43]/20 ${isDark ? 'border-slate-700 bg-slate-900 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
                                    />

                                    {actionError && (
                                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{actionError}</span>
                                        </div>
                                    )}

                                    <div className="mt-5 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => { setConfirmOpen(false); setActionError(null) }}
                                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={submitting || reason.trim().length < 3}
                                            onClick={performAction}
                                            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${action.key === 'cancel'
                                                    ? 'bg-red-600 hover:bg-red-700'
                                                    : action.key === 'complete'
                                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                                        : 'bg-amber-600 hover:bg-amber-700'
                                                }`}
                                        >
                                            {submitting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Confirm'
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    )
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
            <span className="break-words text-right text-sm font-medium text-slate-900 dark:text-white">{value || '—'}</span>
        </div>
    )
}

export default function AdminBookings() {
    const reduceMotion = useReducedMotion()
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [bookings, setBookings] = useState([])
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
                                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                            filters.status === o.value
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
                                        {bookings.map((booking) => (
                                            <tr key={booking.id} className={`transition ${isDark ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50/70'}`}>
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
                            {bookings.map((booking, i) => (
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
                                                <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                                                    {booking.property_name}
                                                </p>
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
