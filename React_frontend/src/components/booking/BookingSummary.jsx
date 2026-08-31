import { MapPin, CalendarDays, Users } from 'lucide-react'
import { Card } from '../ui/card'
import PriceBreakdown from './PriceBreakdown'
import { formatDisplayDate } from '../../lib/bookingUtils'

export default function BookingSummary({
  property,
  form,
  pricing,
  action,
  sticky = true,
  compact = false,
}) {
  if (!property) return null

  return (
    <Card
      className={`relative overflow-hidden border-slate-200/70 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95 ${
        sticky ? 'lg:sticky lg:top-28' : ''
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />

      <div className={compact ? 'p-4' : 'p-5 sm:p-6'}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Booking Summary
        </h3>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <img
            src={property.image}
            alt={property.title}
            className={`w-full object-cover ${compact ? 'h-28' : 'h-40'}`}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'
            }}
          />
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">{property.title}</h4>
            <p className="mt-1 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c99b43]" />
              {property.location}
            </p>
          </div>

          <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950/50">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CalendarDays className="h-4 w-4 text-[#c99b43]" />
              <span>{formatDisplayDate(form.checkIn)} → {formatDisplayDate(form.checkOut)}</span>
            </div>
            {pricing?.nights > 0 && (
              <p className="pl-6 text-slate-500 dark:text-slate-400">
                {pricing.nights} night{pricing.nights > 1 ? 's' : ''}
              </p>
            )}
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Users className="h-4 w-4 text-[#c99b43]" />
              <span>{form.guests} guest{form.guests > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <PriceBreakdown property={property} pricing={pricing} compact={compact} />
        </div>

        {action && <div className="mt-5 hidden lg:block">{action}</div>}
      </div>
    </Card>
  )
}
