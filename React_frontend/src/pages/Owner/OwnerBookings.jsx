import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  FileClock,
  Home,
  Inbox,
  Loader2,
  RefreshCw,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from 'lucide-react'
import { listBookings, rejectBooking, approveBooking } from '../../api/bookingApi'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import {
  canOwnerReview,
  formatAmount,
  formatCreatedDate,
  formatDisplayDate,
  formatListingType,
  formatRentalType,
  getStatusMeta,
  resolveBookingImage,
} from '../../lib/bookingDisplay'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'completed', label: 'Completed' },
  { key: 'expired', label: 'Expired' },
]

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
      ))}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900 dark:text-white">{value || '—'}</span>
    </div>
  )
}

export default function OwnerBookings() {
  const reduceMotion = useReducedMotion()
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [actionId, setActionId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listBookings()
      const results = Array.isArray(data) ? data : data.results || []
      setBookings(results)
    } catch (err) {
      setError(err.message || 'Unable to load booking requests.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  const handleReject = async (booking) => {
    if (!canOwnerReview(booking.status)) return
    if (!window.confirm(`Reject booking ${booking.booking_reference}?`)) return
    setActionId(booking.id)
    setFeedback(null)
    try {
      const updated = await rejectBooking(booking.id)
      applyUpdate(updated)
      setFeedback({ type: 'success', message: 'Booking rejected.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Unable to reject booking.' })
    } finally {
      setActionId(null)
    }
  }

  const handleApprove = async (booking) => {
    if (!canOwnerReview(booking.status)) return
    setActionId(booking.id)
    setFeedback(null)
    try {
      const updated = await approveBooking(booking.id)
      applyUpdate(updated)
      setFeedback({ type: 'success', message: 'Booking approved.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Unable to approve booking.' })
    } finally {
      setActionId(null)
    }
  }

  const applyUpdate = (updated) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)))
    if (selected?.id === updated.id) {
      setSelected((prev) => (prev ? { ...prev, ...updated } : prev))
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">Bookings</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {loading
              ? 'Loading booking requests…'
              : pendingCount > 0
                ? `${pendingCount} pending booking${pendingCount > 1 ? 's' : ''} waiting for your review.`
                : 'Manage booking requests for the properties and vehicles you manage.'}
          </p>
        </div>
        {!loading && !error && bookings.length > 0 && (
          <button
            type="button"
            onClick={loadBookings}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </section>

      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Status filters */}
      {!loading && !error && bookings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? bookings.length : bookings.filter((b) => b.status === f.key).length
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-[#c99b43] text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Loading */}
      {loading && <TableSkeleton />}

      {/* Error */}
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/40">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-200">Unable to load booking requests</h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={loadBookings}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <Inbox className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No booking requests yet</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Bookings for the properties and vehicles you manage will appear here.
          </p>
        </div>
      )}

      {/* No matches for active filter */}
      {!loading && !error && bookings.length > 0 && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-950">
          <FileClock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No {filter} bookings</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">There are no bookings matching this status.</p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 xl:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Renter / Property</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Dates</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Payout</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-4">
                      <button type="button" onClick={() => setSelected(booking)} className="text-left">
                        <p className="font-semibold text-slate-900 dark:text-white">{booking.property_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{booking.renter_email || '—'}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{booking.booking_reference}</p>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        {booking.listing_type === 'car' ? (
                          <Car className="h-4 w-4 text-[#c99b43]" />
                        ) : (
                          <Home className="h-4 w-4 text-[#c99b43]" />
                        )}
                        {formatRentalType(booking.rental_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <p>{formatDisplayDate(booking.start_date)}</p>
                      <p className="text-xs text-slate-400">{booking.end_date ? formatDisplayDate(booking.end_date) : 'Ongoing'}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {formatAmount(booking.total_amount, booking.currency)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {formatAmount(booking.owner_payout_amount, booking.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <BookingStatusBadge status={booking.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(booking)}
                          className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                        >
                          View
                        </button>
                        {canOwnerReview(booking.status) && (
                          <>
                            <button
                              type="button"
                              disabled={actionId === booking.id}
                              onClick={() => handleApprove(booking)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {actionId === booking.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ThumbsUp className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionId === booking.id}
                              onClick={() => handleReject(booking)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/40"
                            >
                              {actionId === booking.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ThumbsDown className="h-3.5 w-3.5" />
                              )}
                              Reject
                            </button>
                          </>
                        )}
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
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 xl:hidden lg:grid-cols-2">
          {filtered.map((booking, i) => (
            <motion.article
              key={booking.id}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : Math.min(i * 0.04, 0.3) }}
              className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-start gap-4 p-5">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                  <img
                    src={resolveBookingImage(null, booking.listing_type)}
                    alt={booking.property_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = booking.listing_type === 'car'
                        ? 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=70&w=640'
                        : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=70&w=640'
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
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

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatDisplayDate(booking.start_date)}
                      {booking.end_date ? ` → ${formatDisplayDate(booking.end_date)}` : ' (ongoing)'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Total</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatAmount(booking.total_amount, booking.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Payout</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatAmount(booking.owner_payout_amount, booking.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setSelected(booking)}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  View details
                  <ChevronRight className="h-4 w-4" />
                </button>
                {canOwnerReview(booking.status) && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled={actionId === booking.id}
                      onClick={() => handleApprove(booking)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actionId === booking.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-3.5 w-3.5" />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={actionId === booking.id}
                      onClick={() => handleReject(booking)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/40"
                    >
                      {actionId === booking.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-3.5 w-3.5" />
                      )}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* Details drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="fixed inset-x-0 bottom-0 top-auto z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:h-full lg:w-[28rem] lg:max-h-full lg:translate-x-0 lg:rounded-none"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Booking details</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                    {selected.booking_reference}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-16 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                    <img
                      src={resolveBookingImage(null, selected.listing_type)}
                      alt={selected.property_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                      {selected.property_name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatListingType(selected.listing_type)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {getStatusMeta(selected.status).label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getStatusMeta(selected.status).text}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <User className="h-4 w-4 text-[#c99b43]" />
                    {selected.renter_email || 'Renter'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Rental type</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {formatRentalType(selected.rental_type)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Listing type</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {formatListingType(selected.listing_type)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Start date</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {formatDisplayDate(selected.start_date)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">End date</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {selected.end_date ? formatDisplayDate(selected.end_date) : 'Ongoing'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Price breakdown</h3>
                  <div className="mt-4 space-y-3">
                    <DetailRow label="Base price" value={formatAmount(selected.base_price, selected.currency)} />
                    <DetailRow
                      label="Security deposit"
                      value={formatAmount(selected.security_deposit, selected.currency)}
                    />
                    <DetailRow
                      label="Platform fee"
                      value={formatAmount(selected.platform_fee_amount, selected.currency)}
                    />
                    <DetailRow
                      label="Owner payout"
                      value={formatAmount(selected.owner_payout_amount, selected.currency)}
                    />
                    <div className="my-1 border-t border-dashed border-slate-200 dark:border-slate-800" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Total</span>
                      <span className="text-lg font-bold text-[#c99b43]">
                        {formatAmount(selected.total_amount, selected.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <DetailRow label="Created" value={formatCreatedDate(selected.created_at)} />
                  <DetailRow label="Commission rate" value={`${selected.platform_commission_rate ?? '0'}%`} />
                </div>

                {canOwnerReview(selected.status) && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={actionId === selected.id}
                      onClick={() => handleApprove(selected)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actionId === selected.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={actionId === selected.id}
                      onClick={() => handleReject(selected)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/40"
                    >
                      {actionId === selected.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
