import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck2,
  Car,
  CheckCircle2,
  Clock,
  Home,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { listBookings } from '../../api/bookingApi'
import TenantStatCard from './components/TenantStatCard'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'
import BookingStatusBadge from '../../components/booking/BookingStatusBadge'
import { formatAmount, formatDisplayDate, formatListingType, resolveBookingImage } from '../../lib/bookingDisplay'

export default function TenantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadBookings() {
      setLoading(true)
      setError(null)
      try {
        const data = await listBookings()
        const results = Array.isArray(data) ? data : data.results || []
        setBookings(results)
      } catch (err) {
        setError(err.message || 'Unable to load bookings.')
        setBookings([])
      } finally {
        setLoading(false)
      }
    }
    loadBookings()
  }, [])

  const activeBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'approved' || b.status === 'confirmed'
  ).length
  const upcoming = bookings.filter((b) => b.status === 'confirmed').length
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const cancelled = bookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length

  const recent = bookings.slice(0, 4)

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Welcome back</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Welcome, {user?.first_name || user?.email}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage your rentals, bookings, payments and saved properties.</p>
      </section>

      <section>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
            <p className="font-semibold">Unable to load dashboard data.</p>
            <p className="mt-2">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                setError(null)
                listBookings()
                  .then((data) => setBookings(Array.isArray(data) ? data : data.results || []))
                  .catch((e) => setError(e.message))
                  .finally(() => setLoading(false))
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b08838]"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <TenantStatCard icon={<CalendarCheck2 className="h-5 w-5" />} label="Active Bookings" value={activeBookings} />
            <TenantStatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Confirmed" value={upcoming} />
            <TenantStatCard icon={<Clock className="h-5 w-5" />} label="Pending Approval" value={pendingCount} />
            <TenantStatCard icon={<XCircle className="h-5 w-5" />} label="Cancelled / Rejected" value={cancelled} />
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick actions</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="/properties" className="rounded-2xl bg-[#c99b43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b0883a]">Browse Properties</a>
          <a href="/vehicles" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800">Browse Vehicles</a>
          <a href="/tenant/bookings" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800">View Bookings</a>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent bookings</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your most recent booking activity.</p>
          </div>
          {bookings.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/tenant/bookings')}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              View all
            </button>
          )}
        </div>

        {error ? null : !bookings.length ? (
          <div className="mt-6">
            <EmptyState
              title="No bookings yet"
              description="You haven't made any bookings yet. Explore properties or vehicles to get started."
            />
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {recent.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
              >
                <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                  <img
                    src={resolveBookingImage(null, booking.listing_type)}
                    alt={booking.property_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = booking.listing_type === 'car'
                        ? 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=70&w=320'
                        : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=70&w=320'
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {booking.listing_type === 'car' ? (
                      <Car className="h-4 w-4 text-[#c99b43]" />
                    ) : (
                      <Home className="h-4 w-4 text-[#c99b43]" />
                    )}
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{booking.property_name}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {formatListingType(booking.listing_type)} · {formatDisplayDate(booking.start_date)}
                    {booking.end_date ? ` → ${formatDisplayDate(booking.end_date)}` : ' (ongoing)'}
                  </p>
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatAmount(booking.total_amount, booking.currency)}
                  </span>
                </div>
                <BookingStatusBadge status={booking.status} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
