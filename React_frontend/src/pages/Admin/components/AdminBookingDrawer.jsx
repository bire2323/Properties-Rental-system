import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
    AlertCircle,
    FileText,
    History,
    Loader2,
    Receipt,
    Wallet,
    X,
} from 'lucide-react'
import { useTheme } from '../../../hooks/useTheme'
import BookingStatusBadge from '../../../components/booking/BookingStatusBadge'
import {
    getBookingAudit,
    adminCancelBooking,
    adminExpireBooking,
    adminCompleteBooking,
    deleteBooking,
} from '../../../api/bookingApi'
import {
    formatAmount,
    formatCreatedDate,
    formatDisplayDate,
    formatListingType,
    formatRentalType,
    resolveDocumentUrl,
} from '../../../lib/bookingDisplay'
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

function AdminBookingDrawer({
    booking,
    onClose,
    onRefresh,
    initialAction = null,
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

    useEffect(() => {
        if (!booking || !initialAction) return
        const preset = availableActions.find((a) => a.key === initialAction)
        if (!preset) return
        setAction(preset)
        setReason('')
        setActionError(null)
        setConfirmOpen(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [booking, initialAction])

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
        list.push({ key: 'delete', label: 'Delete booking' })
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
            } else if (action.key === 'delete') {
                await deleteBooking(booking.id)
                setConfirmOpen(false)
                setAction(null)
                onClose()
                await onRefresh()
                return
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

    const renderDocuments = () => {
        const app = booking?.applicant_details || null
        const docs = app && Array.isArray(app.documents) ? app.documents : []
        if (docs.length === 0) {
            return (
                <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded with this booking.</p>
            )
        }
        return docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {doc.original_filename || `Document ${doc.id}`}
                    </p>
                    <p className="text-xs text-slate-400">{doc.document_type || 'identity'}</p>
                </div>
                <a
                    href={resolveDocumentUrl(doc.document_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#c99b43]/10 px-2.5 py-1.5 text-xs font-semibold text-[#b98227] transition hover:bg-[#c99b43]/20 dark:text-[#f3c96d]"
                >
                    View
                </a>
            </div>
        ))
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

                            {/* Documents */}
                            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                    <FileText className="h-4 w-4 text-[#c99b43]" />
                                    Applicant documents
                                </h4>
                                <div className="mt-3 space-y-2">
                                    {renderDocuments(booking)}
                                </div>
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
                                        {action.key === 'delete'
                                            ? `Are you sure you want to permanently delete booking ${booking.booking_reference}? This cannot be undone.`
                                            : `You are about to ${action.label.toLowerCase()}: ${booking.booking_reference}. This will change the booking status permanently.`}
                                    </p>

                                    {action.key !== 'delete' && (
                                        <>
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
                                        </>
                                    )}

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
                                            disabled={submitting || (action.key !== 'delete' && reason.trim().length < 3)}
                                            onClick={performAction}
                                            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${action.key === 'delete' || action.key === 'cancel'
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

export { PAYMENT_STATUS_OPTIONS }
export default AdminBookingDrawer
