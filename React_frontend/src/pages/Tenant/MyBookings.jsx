import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  Building2 as BuildingGlyph,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  DollarSign as DollarIcon,
  FileClock,
  Home,
  Loader2,
  Percent as PercentIcon,
  CreditCard,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShieldCheck as ShieldIcon,
  User,
  X,
} from 'lucide-react'
import { listBookings, cancelBooking } from '../../api/bookingApi'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import {
  canRenterCancel,
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

function BookingCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-4">
        <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="h-10 w-full rounded-2xl bg-slate-100 dark:bg-slate-800" />
    </div>
  )
}

function DetailsRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4 text-[#c99b43]" />
        {label}
      </div>
      <div className="text-right text-sm font-medium text-slate-900 dark:text-white">{value}</div>
    </div>
  )
}

export default function MyBookings() {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listBookings()
      const results = Array.isArray(data) ? data : data.results || []
      setBookings(results)
    } catch (err) {
      setError(err.message || 'Unable to load your bookings.')
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

  const filtered = useVisibleFiltered(bookings, filter)

  const handleCancel = async (booking) => {
    if (!canRenterCancel(booking.status)) return
    if (!window.confirm(`Cancel booking ${booking.booking_reference}? This cannot be undone.`)) return

    setCancellingId(booking.id)
    setFeedback(null)
    try {
      await cancelBooking(booking.id)
      // DELETE returns 204 and sets the booking to CANCELLED on the backend.
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b))
      )
      if (selected?.id === booking.id) {
        setSelected((prev) => (prev ? { ...prev, status: 'cancelled' } : prev))
      }
      setFeedback({ type: 'success', message: 'Booking cancelled.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Unable to cancel booking.' })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">My Bookings</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {loading
              ? 'Loading your bookings…'
              : pendingCount > 0
                ? `${pendingCount} booking${pendingCount > 1 ? 's' : ''} waiting for owner approval.`
                : 'Track the status of your bookings and rental requests.'}
          </p>
        </div>
        {!loading && !error && bookings.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="booking-status-filter">Filter bookings by status</label>
            <select
              id="booking-status-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              {FILTERS.map((statusFilter) => {
                const count = statusFilter.key === 'all'
                  ? bookings.length
                  : bookings.filter((booking) => booking.status === statusFilter.key).length
                return (
                  <option key={statusFilter.key} value={statusFilter.key}>
                    {statusFilter.label} ({count})
                  </option>
                )
              })}
            </select>
            <button
              type="button"
              onClick={loadBookings}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        )}
      </section>

      {feedback && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${feedback.type === 'success'
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
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active
                    ? 'bg-[#c99b43] text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/40">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-200">Unable to load your bookings</h3>
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

      {/* Empty state */}
      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No bookings yet</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You haven't made any bookings yet. Explore properties or vehicles to make your first booking.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/properties"
              className="rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
            >
              Explore Properties
            </a>
            <a
              href="/vehicles"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Explore Vehicles
            </a>
          </div>
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

      {/* Booking cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((booking, i) => (
            <motion.article
              key={booking.id}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : Math.min(i * 0.04, 0.3) }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
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
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{i + 1}</span>
                          <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                            {booking.property_name}
                          </p>
                        </div>
                      <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">{booking.booking_reference}</p>
                    </div>
                    <BookingStatusBadge status={booking.status} size="sm" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      {booking.listing_type === 'car' ? (
                        <Car className="h-4 w-4 text-[#c99b43]" />
                      ) : (
                        <Home className="h-4 w-4 text-[#c99b43]" />
                      )}
                      {formatListingType(booking.listing_type)}
                    </span>
                    <span>{formatRentalType(booking.rental_type)}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatDisplayDate(booking.start_date)}
                      {booking.end_date ? ` → ${formatDisplayDate(booking.end_date)}` : ' (ongoing)'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatAmount(booking.total_amount, booking.currency)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Created {formatCreatedDate(booking.created_at)}
                    </span>
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
                {booking.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => navigate(`/bookings/${booking.id}/payment`)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#c99b43] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                  >
                    <CreditCard className="h-4 w-4" />
                    Pay
                  </button>
                )}
                {canRenterCancel(booking.status) && (
                  <button
                    type="button"
                    disabled={cancellingId === booking.id}
                    onClick={() => handleCancel(booking)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/40"
                  >
                    {cancellingId === booking.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Cancel
                  </button>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* Details dialog */}
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

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{getStatusMeta(selected.status).label}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getStatusMeta(selected.status).text}</p>
                  </div>
                  <BookingStatusBadge status={selected.status} size="sm" />
                </div>

                <div className="space-y-3">
                  <DetailsRow icon={CalendarDays} label="Rental type" value={formatRentalType(selected.rental_type)} />
                  <DetailsRow icon={CalendarDays} label="Start date" value={formatDisplayDate(selected.start_date)} />
                  <DetailsRow
                    icon={CalendarDays}
                    label="End date"
                    value={selected.end_date ? formatDisplayDate(selected.end_date) : 'Ongoing'}
                  />
                  <DetailsRow icon={FileClock} label="Created" value={formatCreatedDate(selected.created_at)} />
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Receipt className="h-4 w-4 text-[#c99b43]" />
                    Price breakdown
                  </h3>
                  <div className="mt-4 space-y-3">
                    <DetailsRow icon={DollarIcon} label="Rent" value={formatAmount(selected.base_price, selected.currency)} />
                    <DetailsRow
                      icon={ShieldIcon}
                      label="Security deposit"
                      value={formatAmount(selected.security_deposit, selected.currency)}
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
                  <DetailsRow icon={User} label="Renter" value={selected.renter_name || '—'} />
                  {selected.recipient_company && (
                    <DetailsRow icon={BuildingGlyph} label="Recipient company" value={selected.recipient_company} />
                  )}
                  {selected.rental_type && (
                    <DetailsRow icon={User} label="Recipient type" value={formatRentalType(selected.rental_type)} />
                  )}
                </div>

                {canRenterCancel(selected.status) && (
                  <button
                    type="button"
                    disabled={cancellingId === selected.id}
                    onClick={() => handleCancel(selected)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/40"
                  >
                    {cancellingId === selected.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Cancel this booking
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function useVisibleFiltered(bookings, filter) {
  if (filter === 'all') return bookings
  return bookings.filter((b) => b.status === filter)
}
