import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Calendar,
  CalendarCheck2,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Heart,
  Home,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { listBookings } from '../../api/bookingApi'
import { getFavorites } from '../../api/property/propertyApi'
import TenantStatCard from './components/TenantStatCard'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import {
  formatAmount,
  formatDisplayDate,
  formatListingType,
  formatRentalType,
  resolveBookingImage,
} from '../../lib/bookingDisplay'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function TenantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [bookingsData, favsData] = await Promise.allSettled([
        listBookings(),
        getFavorites(),
      ])

      if (bookingsData.status === 'fulfilled') {
        const results = Array.isArray(bookingsData.value)
          ? bookingsData.value
          : bookingsData.value?.results || []
        setBookings(results)
      } else {
        throw new Error(bookingsData.reason?.message || 'Failed to load bookings')
      }

      if (favsData.status === 'fulfilled') {
        const favsList = Array.isArray(favsData.value) ? favsData.value : []
        setFavoritesCount(favsList.length)
      }
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const {
    activeBookings,
    confirmedCount,
    pendingCount,
    approvedBookings,
    spotlightBooking,
    recentBookings,
  } = useMemo(() => {
    const active = bookings.filter(
      (b) => b.status === 'pending' || b.status === 'approved' || b.status === 'confirmed'
    ).length
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length
    const pending = bookings.filter((b) => b.status === 'pending').length
    const approved = bookings.filter((b) => b.status === 'approved')

    // Spotlight prioritizes approved (needs action/payment), then confirmed, then pending
    const spotlight =
      approved[0] ||
      bookings.find((b) => b.status === 'confirmed') ||
      bookings.find((b) => b.status === 'pending') ||
      bookings[0] ||
      null

    const recent = bookings.slice(0, 4)

    return {
      activeBookings: active,
      confirmedCount: confirmed,
      pendingCount: pending,
      approvedBookings: approved,
      spotlightBooking: spotlight,
      recentBookings: recent,
    }
  }, [bookings])

  const userName = user?.first_name || user?.email?.split('@')[0] || 'Tenant'
  const greeting = getGreeting()

  return (
    <div className="space-y-8 pb-10">
      {/* Luxury Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 lg:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Ambient Gradient Underlay */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f8e6ba]/40 via-white/50 to-[#dfeaf7]/30 dark:from-[#2a2215]/50 dark:via-slate-950/70 dark:to-[#0b2141]/30"
          aria-hidden="true"
        />

        {/* Decorative Luxury Imagery */}
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
          alt="Modern villa"
          className="pointer-events-none absolute -right-12 -top-8 h-40 w-40 sm:h-56 sm:w-56 rounded-[2.5rem] object-cover opacity-20 blur-[0.5px] dark:opacity-25"
        />
        <img
          src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
          alt="Luxury car"
          className="pointer-events-none absolute -left-10 -bottom-8 h-32 w-32 sm:h-44 sm:w-44 rounded-full object-cover opacity-15 blur-[1px] dark:opacity-20"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c99b43]/30 bg-[#c99b43]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#b98227] dark:text-[#f3c96d]">
              <Sparkles className="h-3.5 w-3.5" />
              Tenant Portal
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {greeting}, <span className="text-[#c99b43]">{userName}</span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Welcome to your personal rental dashboard. Manage your active leases, track upcoming reservations, make secure payments, and discover new stays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#c99b43]/20 transition-all hover:bg-[#b08838] hover:shadow-lg hover:shadow-[#c99b43]/30"
            >
              <Home className="h-4 w-4" />
              Browse Properties
            </Link>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 backdrop-blur transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Car className="h-4 w-4 text-[#c99b43]" />
              Rent Vehicles
            </Link>
          </div>
        </div>
      </section>

      {/* Urgent Action Banner: Approved Bookings awaiting payment */}
      {approvedBookings.length > 0 && (
        <section className="relative overflow-hidden rounded-3xl border border-[#c99b43]/40 bg-gradient-to-r from-[#fef8ea] via-[#fcf3dc] to-[#faedd0] p-5 dark:border-[#c99b43]/40 dark:from-[#2a2215] dark:via-[#1e1a14] dark:to-[#171410] shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#c99b43] text-white shadow-sm">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Payment Required: {approvedBookings.length} Booking{approvedBookings.length > 1 ? 's' : ''} Approved!
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  The owner has approved your request for{' '}
                  <span className="font-medium text-[#b08838] dark:text-[#f3c96d]">
                    {approvedBookings[0].property_name}
                  </span>
                  . Complete your secure payment to lock in your reservation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/bookings/${approvedBookings[0].id}/payment`)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c99b43] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#b08838]"
            >
              Pay Now with Chapa
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* Key Metrics KPI Cards */}
      <section>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Unable to load dashboard data.
            </div>
            <p className="mt-2 text-xs sm:text-sm">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#b08838]"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TenantStatCard
              icon={<CalendarCheck2 className="h-5 w-5" />}
              label="Active Stays"
              value={activeBookings}
              subtext="Ongoing & upcoming reservations"
              badge="Active"
              accent="emerald"
              onClick={() => navigate('/tenant/bookings')}
            />
            <TenantStatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Confirmed"
              value={confirmedCount}
              subtext="Paid and confirmed bookings"
              badge="Ready for check-in"
              accent="blue"
              onClick={() => navigate('/tenant/bookings')}
            />
            <TenantStatCard
              icon={<Clock className="h-5 w-5" />}
              label="Pending Review"
              value={pendingCount}
              subtext="Awaiting landlord approval"
              badge={pendingCount > 0 ? 'Reviewing' : 'None pending'}
              accent="amber"
              onClick={() => navigate('/tenant/bookings')}
            />
            <TenantStatCard
              icon={<Bookmark className="h-5 w-5" />}
              label="Saved Wishlist"
              value={favoritesCount}
              subtext="Properties & cars bookmarked"
              badge="Favorites"
              accent="gold"
              onClick={() => navigate('/tenant/favorites')}
            />
          </div>
        )}
      </section>

      {/* Spotlight Card: Next Up / Featured Reservation */}
      {!loading && spotlightBooking && (
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Image Banner */}
            <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-56 lg:h-44 lg:w-72 dark:bg-slate-900">
              <img
                src={resolveBookingImage(null, spotlightBooking.listing_type)}
                alt={spotlightBooking.property_name}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src =
                    spotlightBooking.listing_type === 'car'
                      ? 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=70&w=640'
                      : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=70&w=640'
                }}
              />
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {spotlightBooking.listing_type === 'car' ? (
                    <Car className="h-3.5 w-3.5 text-[#c99b43]" />
                  ) : (
                    <Home className="h-3.5 w-3.5 text-[#c99b43]" />
                  )}
                  {formatListingType(spotlightBooking.listing_type)}
                </span>
              </div>
            </div>

            {/* Info details */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#b98227] dark:text-[#f3c96d]">
                  Featured Reservation
                </span>
                <BookingStatusBadge status={spotlightBooking.status} size="sm" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {spotlightBooking.property_name}
                </h3>
                <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">
                  Ref: {spotlightBooking.booking_reference}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#c99b43]" />
                  <span>
                    {formatDisplayDate(spotlightBooking.start_date)}
                    {spotlightBooking.end_date
                      ? ` → ${formatDisplayDate(spotlightBooking.end_date)}`
                      : ' (Ongoing)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>Type: {formatRentalType(spotlightBooking.rental_type)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Total</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatAmount(spotlightBooking.total_amount, spotlightBooking.currency)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {spotlightBooking.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/bookings/${spotlightBooking.id}/payment`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#c99b43] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#b08838]"
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/tenant/bookings')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Navigation Action Hub */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/properties"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c99b43]/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-[#b98227] transition-transform group-hover:scale-110 dark:bg-[#c99b43]/20 dark:text-[#f3c96d]">
              <Home className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#c99b43]">
                Find Properties
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Villas, apartments & homes</p>
            </div>
          </Link>

          <Link
            to="/vehicles"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c99b43]/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-950/50 dark:text-blue-400">
              <Car className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#c99b43]">
                Rent Vehicles
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sedans, SUVs & luxury rentals</p>
            </div>
          </Link>

          <Link
            to="/tenant/bookings"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c99b43]/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CalendarCheck2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#c99b43]">
                All Bookings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Invoices, status & details</p>
            </div>
          </Link>

          <Link
            to="/tenant/favorites"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c99b43]/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-110 dark:bg-purple-950/50 dark:text-purple-400">
              <Heart className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#c99b43]">
                Saved Favorites
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {favoritesCount} saved item{favoritesCount === 1 ? '' : 's'}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Bookings Activity */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Bookings</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Your recent rental reservations and request statuses.
            </p>
          </div>
          {bookings.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/tenant/bookings')}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              View all ({bookings.length})
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {error ? null : !bookings.length ? (
          <div className="mt-6">
            <EmptyState
              title="No bookings yet"
              description="You haven't made any rental bookings yet. Explore our curated properties or luxury vehicles to get started."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/properties"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#b08838]"
                  >
                    <Home className="h-4 w-4" />
                    Explore Properties
                  </Link>
                  <Link
                    to="/vehicles"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <Car className="h-4 w-4" />
                    Explore Vehicles
                  </Link>
                </div>
              }
            />
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="group flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors rounded-2xl px-2 hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                    <img
                      src={resolveBookingImage(null, booking.listing_type)}
                      alt={booking.property_name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
                      {booking.listing_type === 'car' ? (
                        <Car className="h-4 w-4 shrink-0 text-[#c99b43]" />
                      ) : (
                        <Home className="h-4 w-4 shrink-0 text-[#c99b43]" />
                      )}
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {booking.property_name}
                      </p>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                      Ref: {booking.booking_reference}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatListingType(booking.listing_type)} · {formatDisplayDate(booking.start_date)}
                      {booking.end_date ? ` → ${formatDisplayDate(booking.end_date)}` : ' (ongoing)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pl-24 sm:pl-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatAmount(booking.total_amount, booking.currency)}
                    </p>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {formatRentalType(booking.rental_type)}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <BookingStatusBadge status={booking.status} size="sm" />
                    {booking.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/bookings/${booking.id}/payment`)}
                        className="rounded-xl bg-[#c99b43] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#b08838]"
                      >
                        Pay
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate('/tenant/bookings')}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Renter Trust & Concierge Assurance */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-[#0b2141] to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#f3c96d]">
              <ShieldCheck className="h-4 w-4" />
              Renter Guarantee
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Secure Payments & Verified Listings
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every home and vehicle on our platform is verified for quality and legitimacy. Your payments are processed securely via Chapa encrypted gateway with zero hidden fees.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Learn More
            </Link>
            <Link
              to="/tenant/messages"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#b08838]"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
