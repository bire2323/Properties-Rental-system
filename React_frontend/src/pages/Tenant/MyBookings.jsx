import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  Building2 as BuildingGlyph,
  Calendar,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  DollarSign as DollarIcon,
  ExternalLink,
  Eye,
  FileClock,
  FileText,
  Grid,
  Home,
  LayoutGrid,
  List,
  Loader2,
  Paperclip,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck as ShieldIcon,
  User,
  X,
} from 'lucide-react'
import { listBookings, cancelBooking } from '../../api/bookingApi'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import { toast } from '../../components/ui/toaster'
import {
  canRenterCancel,
  formatAmount,
  formatCreatedDate,
  formatDisplayDate,
  formatListingType,
  formatRentalType,
  getStatusMeta,
  getStatusNextStep,
  resolveBookingImage,
  resolveDocumentUrl,
} from '../../lib/bookingDisplay'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Rejected' },
]

function BookingCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-4">
        <div className="h-5 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="flex gap-4">
        <div className="h-20 w-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      <div className="h-10 w-full rounded-2xl bg-slate-100 dark:bg-slate-800" />
    </div>
  )
}

function calculateDuration(startDate, endDate, rentalType) {
  if (rentalType === 'month_to_month') return 'Month to Month'
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '1 day'
  if (diffDays === 1) return '1 night'
  if (diffDays < 30) return `${diffDays} days`
  const months = Math.round(diffDays / 30)
  return `${months} month${months > 1 ? 's' : ''}`
}

function StepperTracker({ status }) {
  const steps = [
    { id: 'request', label: 'Requested' },
    { id: 'review', label: 'Owner Review' },
    { id: 'payment', label: 'Payment' },
    { id: 'active', label: 'Confirmed Stay' },
    { id: 'completed', label: 'Completed' },
  ]

  let activeIndex = 0
  if (status === 'pending') activeIndex = 1
  else if (status === 'approved') activeIndex = 2
  else if (status === 'confirmed') activeIndex = 3
  else if (status === 'completed') activeIndex = 4
  else if (status === 'cancelled' || status === 'rejected') activeIndex = -1

  if (activeIndex === -1) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-center dark:border-red-900/40 dark:bg-red-950/30">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300 capitalize">
          Booking {status}
        </p>
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {status === 'cancelled'
            ? 'This booking was cancelled and is no longer active.'
            : 'The host was unable to accept this booking request.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Booking Progress
      </p>
      <div className="relative flex items-center justify-between">
        {/* Connecting Line */}
        <div className="absolute left-3 right-3 top-3.5 -z-0 h-0.5 bg-slate-200 dark:bg-slate-800" />
        <div
          className="absolute left-3 top-3.5 -z-0 h-0.5 bg-[#c99b43] transition-all duration-500"
          style={{ width: `${Math.max(0, (activeIndex / (steps.length - 1)) * 100)}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < activeIndex
          const isCurrent = idx === activeIndex

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-[#c99b43] text-white shadow-sm'
                    : isCurrent
                    ? 'border-2 border-[#c99b43] bg-white text-[#b98227] shadow-md dark:bg-slate-950 dark:text-[#f3c96d]'
                    : 'border border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-[10px] sm:text-xs font-medium ${
                  isCurrent
                    ? 'font-bold text-[#b98227] dark:text-[#f3c96d]'
                    : isDone
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailsRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4 shrink-0 text-[#c99b43]" />
        <span>{label}</span>
      </div>
      <div className="text-right text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  )
}

function DocumentsSection({ booking }) {
  const app = booking?.applicant_details || null
  const documents = app && Array.isArray(app.documents) ? app.documents : []

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
        <Paperclip className="mx-auto h-5 w-5 text-slate-300 dark:text-slate-600" />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          No identity documents were attached to this booking.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
        <FileText className="h-4 w-4 text-[#c99b43]" />
        Identity Documents ({documents.length})
      </h4>
      <div className="mt-3 space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                {doc.original_filename || `Document ${doc.id}`}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                {doc.document_type || 'Identity'}
              </p>
            </div>
            <a
              href={resolveDocumentUrl(doc.document_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#c99b43]/10 px-2.5 py-1 text-xs font-semibold text-[#b98227] transition hover:bg-[#c99b43]/20 dark:text-[#f3c96d]"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MyBookings() {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Controls
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // Modals / Drawer
  const [selected, setSelected] = useState(null)
  const [cancelModalBooking, setCancelModalBooking] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [copiedRef, setCopiedRef] = useState(null)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listBookings()
      const results = Array.isArray(data) ? data : data?.results || []
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
      if (e.key === 'Escape') {
        setSelected(null)
        setCancelModalBooking(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const copyReference = (ref, e) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(ref)
    setCopiedRef(ref)
    toast.success(`Reference ${ref} copied to clipboard`)
    setTimeout(() => setCopiedRef(null), 2500)
  }

  const confirmCancel = async () => {
    if (!cancelModalBooking) return
    setCancelling(true)
    try {
      await cancelBooking(cancelModalBooking.id)
      setBookings((prev) =>
        prev.map((b) => (b.id === cancelModalBooking.id ? { ...b, status: 'cancelled' } : b))
      )
      if (selected?.id === cancelModalBooking.id) {
        setSelected((prev) => (prev ? { ...prev, status: 'cancelled' } : prev))
      }
      toast.success(`Booking ${cancelModalBooking.booking_reference} has been cancelled.`)
      setCancelModalBooking(null)
    } catch (err) {
      toast.error(err.message || 'Unable to cancel booking.')
    } finally {
      setCancelling(false)
    }
  }

  // Filtered and Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        // Status filter
        if (statusFilter !== 'all' && booking.status !== statusFilter) return false
        // Listing type filter
        if (typeFilter !== 'all' && booking.listing_type !== typeFilter) return false
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesName = booking.property_name?.toLowerCase().includes(q)
          const matchesRef = booking.booking_reference?.toLowerCase().includes(q)
          const matchesRecipient = booking.recipient_company?.toLowerCase().includes(q)
          if (!matchesName && !matchesRef && !matchesRecipient) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at || 0) - new Date(b.created_at || 0)
        }
        if (sortBy === 'price-high') {
          return Number(b.total_amount || 0) - Number(a.total_amount || 0)
        }
        if (sortBy === 'price-low') {
          return Number(a.total_amount || 0) - Number(b.total_amount || 0)
        }
        if (sortBy === 'start-date') {
          return new Date(a.start_date || 0) - new Date(b.start_date || 0)
        }
        return 0
      })
  }, [bookings, statusFilter, typeFilter, searchQuery, sortBy])

  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const approvedCount = bookings.filter((b) => b.status === 'approved').length

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Bookings
            </h1>
            {!loading && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {bookings.length} Total
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {loading
              ? 'Loading your reservations…'
              : approvedCount > 0
              ? `You have ${approvedCount} approved booking${approvedCount > 1 ? 's' : ''} ready for payment!`
              : pendingCount > 0
              ? `${pendingCount} booking${pendingCount > 1 ? 's' : ''} awaiting owner confirmation.`
              : 'Track status, manage rental payments, and view lease agreements.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadBookings}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>

      {/* Action Notification Alert for Approved bookings */}
      {approvedCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-[#c99b43]/50 bg-gradient-to-r from-amber-50 via-[#fdf6e7] to-amber-50 p-4 sm:p-5 dark:border-[#c99b43]/40 dark:from-[#2a2215] dark:via-[#1e1a14] dark:to-[#171410] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#c99b43] text-white">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {approvedCount} Approved Booking{approvedCount > 1 ? 's' : ''} Waiting For Payment
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Landlords approved your request. Lock in your dates by completing secure payment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('approved')
            }}
            className="shrink-0 rounded-xl bg-[#c99b43] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#b08838]"
          >
            View Approved
          </button>
        </div>
      )}

      {/* Interactive Control & Search Bar */}
      <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by property, vehicle, or reference..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#c99b43] focus:bg-white focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Type filter, Sort by, View toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Listing Type Filter */}
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('house')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  typeFilter === 'house'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                Homes
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('car')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  typeFilter === 'car'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Car className="h-3.5 w-3.5" />
                Vehicles
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#c99b43] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="start-date">Check-in Date</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-xl p-1.5 text-slate-600 transition dark:text-slate-300 ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#c99b43] shadow-xs dark:bg-slate-800 dark:text-[#f3c96d]'
                    : 'hover:text-slate-900'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-xl p-1.5 text-slate-600 transition dark:text-slate-300 ${
                  viewMode === 'list'
                    ? 'bg-white text-[#c99b43] shadow-xs dark:bg-slate-800 dark:text-[#f3c96d]'
                    : 'hover:text-slate-900'
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab.key === 'all'
                ? bookings.length
                : bookings.filter((b) => b.status === tab.key).length
            const active = statusFilter === tab.key

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-[#c99b43] text-white shadow-xs'
                    : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/40">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-bold text-red-900 dark:text-red-200">
            Unable to load your bookings
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={loadBookings}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#b08838]"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {/* Empty state: No bookings at all */}
      {!loading && !error && bookings.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs dark:border-slate-700 dark:bg-slate-950">
          <CalendarDays className="mx-auto h-12 w-12 text-[#c99b43]/60" />
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            No bookings yet
          </h3>
          <p className="mt-2 max-w-md mx-auto text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            You haven't requested any property or vehicle reservations yet. Discover our verified rentals and place your first booking request!
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/properties')}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#b08838]"
            >
              <Home className="h-4 w-4" />
              Explore Properties
            </button>
            <button
              type="button"
              onClick={() => navigate('/vehicles')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <Car className="h-4 w-4" />
              Explore Vehicles
            </button>
          </div>
        </div>
      )}

      {/* Empty filter results */}
      {!loading && !error && bookings.length > 0 && filteredBookings.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
          <FileClock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            No matching bookings found
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            No reservations matched your current filters or search term.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all')
              setTypeFilter('all')
              setSearchQuery('')
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* BOOKINGS DISPLAY: GRID VIEW */}
      {!loading && !error && filteredBookings.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredBookings.map((booking, index) => {
            const duration = calculateDuration(booking.start_date, booking.end_date, booking.rental_type)

            return (
              <motion.article
                key={booking.id}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.25) }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-[#c99b43]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
              >
                {/* Header card image and top pills */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={resolveBookingImage(null, booking.listing_type)}
                    alt={booking.property_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src =
                        booking.listing_type === 'car'
                          ? 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=70&w=640'
                          : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=70&w=640'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  {/* Badges on Image */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      {booking.listing_type === 'car' ? (
                        <Car className="h-3.5 w-3.5 text-[#c99b43]" />
                      ) : (
                        <Home className="h-3.5 w-3.5 text-[#c99b43]" />
                      )}
                      {formatListingType(booking.listing_type)}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <BookingStatusBadge status={booking.status} size="sm" />
                  </div>

                  {/* Bottom Image Overlay text: Property Name & Duration */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base sm:text-lg font-bold text-white drop-shadow-sm">
                        {booking.property_name}
                      </h3>
                      {duration && (
                        <span className="text-xs text-slate-200/90 drop-shadow-xs">
                          Duration: {duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  {/* Reference & Created Date */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={(e) => copyReference(booking.booking_reference, e)}
                      className="group/ref inline-flex items-center gap-1.5 font-mono text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                      title="Click to copy reference"
                    >
                      <span>{booking.booking_reference}</span>
                      {copiedRef === booking.booking_reference ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 opacity-60 group-hover/ref:opacity-100" />
                      )}
                    </button>
                    <span className="text-slate-400 dark:text-slate-500">
                      Created {formatCreatedDate(booking.created_at)}
                    </span>
                  </div>

                  {/* Dates & Rental Type */}
                  <div className="space-y-1.5 rounded-2xl bg-slate-50/80 p-3 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#c99b43]" />
                      <span className="font-medium">
                        {formatDisplayDate(booking.start_date)}
                        {booking.end_date
                          ? ` → ${formatDisplayDate(booking.end_date)}`
                          : ' (Ongoing)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Lease Type: {formatRentalType(booking.rental_type)}</span>
                      <span>Total: {formatAmount(booking.total_amount, booking.currency)}</span>
                    </div>
                  </div>

                  {/* Next Step Informational Banner */}
                  <div
                    className={`rounded-xl p-2.5 text-xs font-medium ${
                      booking.status === 'approved'
                        ? 'border border-[#c99b43]/30 bg-[#c99b43]/10 text-[#966718] dark:text-[#f3c96d]'
                        : booking.status === 'pending'
                        ? 'border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : booking.status === 'confirmed'
                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border border-slate-200 bg-slate-100/60 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {getStatusNextStep(booking.status)}
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => setSelected(booking)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </button>

                    {booking.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => navigate(`/bookings/${booking.id}/payment`)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#c99b43] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#b08838]"
                      >
                        <CreditCard className="h-4 w-4" />
                        Pay Now
                      </button>
                    )}

                    {canRenterCancel(booking.status) && (
                      <button
                        type="button"
                        onClick={() => setCancelModalBooking(booking)}
                        className="ml-auto inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}

      {/* BOOKINGS DISPLAY: LIST VIEW */}
      {!loading && !error && filteredBookings.length > 0 && viewMode === 'list' && (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="group flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-[#c99b43]/40 hover:shadow-xs dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                  <img
                    src={resolveBookingImage(null, booking.listing_type)}
                    alt={booking.property_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src =
                        booking.listing_type === 'car'
                          ? 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=70&w=320'
                          : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=70&w=320'
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {booking.property_name}
                    </span>
                    <BookingStatusBadge status={booking.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="font-mono">{booking.booking_reference}</span>
                    <span>·</span>
                    <span>{formatListingType(booking.listing_type)}</span>
                    <span>·</span>
                    <span>
                      {formatDisplayDate(booking.start_date)}
                      {booking.end_date ? ` → ${formatDisplayDate(booking.end_date)}` : ' (Ongoing)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pl-24 sm:pl-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatAmount(booking.total_amount, booking.currency)}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase">
                    {formatRentalType(booking.rental_type)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(booking)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Details
                  </button>
                  {booking.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/bookings/${booking.id}/payment`)}
                      className="rounded-xl bg-[#c99b43] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#b08838]"
                    >
                      Pay Now
                    </button>
                  )}
                  {canRenterCancel(booking.status) && (
                    <button
                      type="button"
                      onClick={() => setCancelModalBooking(booking)}
                      className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAILS SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, x: reduceMotion ? 0 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduceMotion ? 0 : 30 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-slate-950"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c99b43]">
                    Booking Details
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {selected.booking_reference}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => copyReference(selected.booking_reference, e)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Copy Reference"
                    >
                      {copiedRef === selected.booking_reference ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Hero property banner */}
                <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                  <img
                    src={resolveBookingImage(null, selected.listing_type)}
                    alt={selected.property_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src =
                        selected.listing_type === 'car'
                          ? 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=70&w=640'
                          : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=70&w=640'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <span className="rounded-full bg-[#c99b43] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        {formatListingType(selected.listing_type)}
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-white truncate">
                        {selected.property_name}
                      </h3>
                    </div>
                    <BookingStatusBadge status={selected.status} size="sm" />
                  </div>
                </div>

                {/* Stepper Progress */}
                <StepperTracker status={selected.status} />

                {/* Approved Pay CTA Banner */}
                {selected.status === 'approved' && (
                  <div className="rounded-2xl border border-[#c99b43]/40 bg-gradient-to-r from-amber-50 to-amber-100/60 p-4 dark:border-[#c99b43]/40 dark:from-[#2a2215] dark:to-[#1a1610]">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-[#b08838] dark:text-[#f3c96d]" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Ready for Payment
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Complete your payment securely with Chapa to finalize this rental.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/bookings/${selected.id}/payment`)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c99b43] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#b08838]"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Securely with Chapa
                    </button>
                  </div>
                )}

                {/* Booking Key Information */}
                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                    Reservation Details
                  </h4>
                  <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                    <DetailsRow
                      icon={CalendarDays}
                      label="Start Date"
                      value={formatDisplayDate(selected.start_date)}
                    />
                    <DetailsRow
                      icon={CalendarDays}
                      label="End Date"
                      value={selected.end_date ? formatDisplayDate(selected.end_date) : 'Ongoing'}
                    />
                    <DetailsRow
                      icon={Calendar}
                      label="Rental Type"
                      value={formatRentalType(selected.rental_type)}
                    />
                    <DetailsRow
                      icon={FileClock}
                      label="Requested On"
                      value={formatCreatedDate(selected.created_at)}
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                    <Receipt className="h-4 w-4 text-[#c99b43]" />
                    Price Breakdown
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span>Base Rent</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatAmount(selected.base_price, selected.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span>Security Deposit</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatAmount(selected.security_deposit, selected.currency)}
                      </span>
                    </div>
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Total Amount
                      </span>
                      <span className="text-base sm:text-lg font-bold text-[#c99b43]">
                        {formatAmount(selected.total_amount, selected.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Applicant & Tenant Information */}
                <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                    Applicant Information
                  </h4>
                  <DetailsRow icon={User} label="Tenant Name" value={selected.renter_name || '—'} />
                  {selected.recipient_company && (
                    <DetailsRow
                      icon={BuildingGlyph}
                      label="Company"
                      value={selected.recipient_company}
                    />
                  )}
                </div>

                {/* Document Attachments */}
                <DocumentsSection booking={selected} />

                {/* Cancel Booking Action in Drawer */}
                {canRenterCancel(selected.status) && (
                  <button
                    type="button"
                    onClick={() => setCancelModalBooking(selected)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3 text-xs sm:text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40"
                  >
                    <X className="h-4 w-4" />
                    Cancel This Booking
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CUSTOM IN-APP CANCELLATION CONFIRMATION MODAL */}
      <AnimatePresence>
        {cancelModalBooking && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => (!cancelling ? setCancelModalBooking(null) : null)}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  Cancel Booking Request?
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Are you sure you want to cancel booking{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {cancelModalBooking.booking_reference}
                  </span>{' '}
                  for{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {cancelModalBooking.property_name}
                  </span>
                  ? This action cannot be reversed.
                </p>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  Total amount:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatAmount(cancelModalBooking.total_amount, cancelModalBooking.currency)}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => setCancelModalBooking(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={confirmCancel}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm Cancellation
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
