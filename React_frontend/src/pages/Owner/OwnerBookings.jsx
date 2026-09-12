import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  CalendarDays,
  Car,
  ChevronRight,
  FileClock,
  Home,
  Inbox,
  Loader2,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { rejectBooking, approveBooking, listBookings } from '../../api/bookingApi'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import { toast } from '../../components/ui/toaster'
import {
  canOwnerReview,
  formatAmount,
  formatCreatedDate,
  formatDisplayDate,
  formatListingType,
  formatRentalType,
  getStatusMeta,
  resolveBookingImage,
  resolveDocumentUrl,
} from '../../lib/bookingDisplay'
import { formatPaymentMethod, getPaymentStatusMeta } from '../../lib/paymentDisplay'

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

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#b98227] dark:text-[#f3c96d]">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function maskIdNumber(value) {
  const str = String(value || '')
  if (str.length <= 4) return str
  return '*'.repeat(str.length - 4) + str.slice(-4)
}

function ApplicantDetailsSection({ booking }) {
  const [revealId, setRevealId] = useState(false)
  const app = booking?.applicant_details || null

  if (!app) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Applicant information unavailable for this booking.
      </div>
    )
  }

  const isCar = booking.listing_type === 'car'

  const documents = Array.isArray(app.documents) ? app.documents : []

  return (
    <div className="space-y-4">
      <Section title="Applicant &amp; Contact">
        <DetailRow label="Full name" value={app.contact_name} />
        <DetailRow label="Phone" value={app.contact_phone} />
        <DetailRow label="Email" value={app.contact_email} />
        <DetailRow label="Date of birth" value={app.date_of_birth || '—'} />
        <DetailRow label="Gender" value={app.gender ? app.gender.charAt(0).toUpperCase() + app.gender.slice(1) : ''} />
        <DetailRow label="Number of tenants" value={app.number_of_tenants != null ? app.number_of_tenants : '—'} />
      </Section>

      <Section title="Identity Verification">
        <DetailRow label="ID type" value={app.id_type ? app.id_type.replace(/_/g, ' ').toUpperCase() : ''} />
        <div className="flex items-start justify-between gap-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">ID number</span>
          <span className="text-right text-sm font-medium text-slate-900 dark:text-white">
            {revealId ? app.id_number : maskIdNumber(app.id_number)}
          </span>
        </div>
        {app.id_number && (
          <button
            type="button"
            onClick={() => setRevealId((v) => !v)}
            className="text-xs font-semibold text-[#c99b43] hover:underline"
          >
            {revealId ? 'Hide ID number' : 'Reveal ID number'}
          </button>
        )}
        {documents.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Documents ({documents.length})</p>
            <div className="space-y-2">
              {documents.map((doc) => (
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
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Emergency Contact">
        <DetailRow label="Name" value={app.emergency_name} />
        <DetailRow label="Phone" value={app.emergency_phone} />
        <DetailRow label="Relationship" value={app.emergency_relationship} />
      </Section>

      {isCar && (
        <Section title="Vehicle Rental Information">
          <DetailRow label="Pickup time" value={app.pickup_time} />
          <DetailRow label="Return time" value={app.return_time} />
          <DetailRow label="Rental purpose" value={app.pickup_purpose} />
        </Section>
      )}

      <Section title="Consent &amp; Terms">
        <DetailRow label="Information confirmed" value={app.information_confirmed ? 'Yes' : 'No'} />
        <DetailRow label="Terms accepted" value={app.terms_accepted ? 'Yes' : 'No'} />
      </Section>
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

  const [openMenuId, setOpenMenuId] = useState(null)

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
    try {
      const updated = await rejectBooking(booking.id)
      applyUpdate(updated)
      toast.success(`Booking ${booking.booking_reference} rejected.`)
    } catch (err) {
      toast.error(err.message || 'Unable to reject booking.')
    } finally {
      setActionId(null)
    }
  }

  const handleApprove = async (booking) => {
    if (!canOwnerReview(booking.status)) return
    if (!window.confirm(`Approve booking ${booking.booking_reference}?`)) return
    setActionId(booking.id)
    try {
      const updated = await approveBooking(booking.id)
      applyUpdate(updated)
      toast.success(`Booking ${booking.booking_reference} approved.`)
    } catch (err) {
      toast.error(err.message || 'Unable to approve booking.')
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
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter bookings by status"
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#c99b43] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
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
                  <th className="w-12 px-4 py-4 text-center text-[10px] font-bold text-slate-400">#</th>
                  <th className="px-6 py-4 font-semibold">Renter / Property</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Dates</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Payout</th>
                  <th className="px-6 py-4 font-semibold">Payment</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((booking, idx) => (
                  <tr key={booking.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <td className="px-4 py-4 text-center text-xs font-bold text-slate-400 dark:text-slate-500">{idx + 1}</td>
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
                      {booking.latest_payment_status ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusMeta(booking.latest_payment_status).tone}`}>
                          {getPaymentStatusMeta(booking.latest_payment_status).label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <BookingStatusBadge status={booking.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative flex items-center justify-end gap-1.5">
                        {canOwnerReview(booking.status) && (
                          <>
                            <button
                              type="button"
                              disabled={actionId === booking.id}
                              onClick={() => handleApprove(booking)}
                              title={`Approve ${booking.booking_reference}`}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600/10 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionId === booking.id}
                              onClick={() => handleReject(booking)}
                              title={`Reject ${booking.booking_reference}`}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600/10 px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-600 hover:text-white disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={actionId === booking.id}
                          onClick={() => setOpenMenuId((current) => current === booking.id ? null : booking.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                          aria-label={`Actions for ${booking.booking_reference}`}
                        >
                          {actionId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                        </button>
                        {openMenuId === booking.id && (
                          <div className="absolute right-0 top-11 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <button type="button" onClick={() => { setOpenMenuId(null); setSelected(booking) }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">View</button>
                          </div>
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
              <div className="flex items-start gap-4 p-4">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                  <img
                    src={resolveBookingImage(booking.property_image, booking.listing_type)}
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
                        <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                          {booking.property_name}
                        </p>
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">
                        {booking.booking_reference}
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} size="sm" />
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <User className="h-4 w-4 text-[#c99b43]" />
                    <span className="truncate">{booking.renter_email || 'Renter'}</span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatDisplayDate(booking.start_date)}
                      {booking.end_date ? ` → ${formatDisplayDate(booking.end_date)}` : ' (ongoing)'}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Total</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatAmount(booking.total_amount, booking.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Payout</p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatAmount(booking.owner_payout_amount, booking.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    {booking.latest_payment_status ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusMeta(booking.latest_payment_status).tone}`}>
                        <Wallet className="h-3 w-3" />
                        Payment {getPaymentStatusMeta(booking.latest_payment_status).label}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">No payment recorded</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setSelected(booking)}
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  View details
                  <ChevronRight className="h-4 w-4" />
                </button>
                {canOwnerReview(booking.status) && (
                  <>
                    <button
                      type="button"
                      disabled={actionId === booking.id}
                      onClick={() => handleApprove(booking)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={actionId === booking.id}
                      onClick={() => handleReject(booking)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/40"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Reject
                    </button>
                  </>
                )}
                <div className="ml-auto relative">
                  <button
                    type="button"
                    disabled={actionId === booking.id}
                    onClick={() => setOpenMenuId((current) => current === booking.id ? null : booking.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                    aria-label={`Actions for ${booking.booking_reference}`}
                  >
                    {actionId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                  </button>
                  {openMenuId === booking.id && (
                    <div className="absolute bottom-11 right-0 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      <button type="button" onClick={() => { setOpenMenuId(null); setSelected(booking) }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">View</button>
                    </div>
                  )}
                </div>
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
                      src={resolveBookingImage(selected.property_image, selected.listing_type)}
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

                <ApplicantDetailsSection booking={selected} />

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Price &amp; earnings</h3>
                  <div className="mt-4 space-y-3">
                    <DetailRow label="Rent" value={formatAmount(selected.base_price, selected.currency)} />
                    <DetailRow
                      label="Security deposit"
                      value={formatAmount(selected.security_deposit, selected.currency)}
                    />
                    <DetailRow
                      label={`Platform fee (${selected.platform_commission_rate ?? 0}%)`}
                      value={`-${formatAmount(selected.platform_fee_amount, selected.currency)}`}
                    />
                    <div className="my-1 border-t border-dashed border-slate-200 dark:border-slate-800" />
                    <DetailRow
                      label="Your payout"
                      value={formatAmount(selected.owner_payout_amount, selected.currency)}
                    />
                    <div className="my-1" />
                    <DetailRow
                      label="Total paid by tenant"
                      value={formatAmount(selected.total_amount, selected.currency)}
                    />
                    <div className="mb-1 mt-5 pt-10 border-t border-dashed border-slate-200 dark:border-slate-800" />
                    <DetailRow label="Created" value={formatCreatedDate(selected.created_at)} />
                    <DetailRow
                      label="Commission rate"
                      value={`${Number(selected.platform_commission_rate ?? 0).toFixed(2)}%`}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <Wallet className="h-4 w-4 text-[#c99b43]" />
                    Payment
                  </h3>
                  {selected.latest_payment_status ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPaymentStatusMeta(selected.latest_payment_status).tone}`}>
                          {getPaymentStatusMeta(selected.latest_payment_status).label}
                        </span>
                      </div>
                      <DetailRow
                        label="Method"
                        value={formatPaymentMethod(selected.latest_payment_method, selected.latest_payment_method_display)}
                      />
                      <DetailRow label="Transaction ref" value={selected.latest_payment_reference} />
                      <DetailRow
                        label="Provider ref"
                        value={selected.latest_payment_provider_reference || '—'}
                      />
                      <DetailRow label="Amount" value={formatAmount(selected.total_amount, selected.currency)} />
                      <DetailRow label="Attempts" value={selected.payment_attempt_count ?? 0} />
                      <DetailRow label="Paid at" value={formatCreatedDate(selected.latest_payment_created_at)} />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      No payment recorded for this booking.
                    </p>
                  )}
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
