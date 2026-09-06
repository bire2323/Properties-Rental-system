import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { useAuth } from '../../hooks/useAuth'
import { useBooking } from '../../context/BookingContext'

/**
 * Legacy route kept for compatibility with old links / bookmarks
 * (/properties/:id/book/payment). The real, status-aware payment page lives at
 * /bookings/:bookingId/payment (PaymentCheckout), which gates payment purely on
 * the booking status — it never shows a pay form before the owner approves.
 *
 * This page no longer renders fake payment methods or card forms; it simply
 * routes the tenant to the booking's real checkout (falling back to My Bookings
 * when no booking is in context).
 */
export default function Payment() {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { bookingId } = useBooking()

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    if (bookingId) {
      navigate(`/bookings/${bookingId}/payment`, { replace: true })
    } else {
      navigate('/tenant/bookings', { replace: true })
    }
  }, [authLoading, isAuthenticated, bookingId, navigate])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#c99b43]" />
      </div>
      <Footer />
    </div>
  )
}