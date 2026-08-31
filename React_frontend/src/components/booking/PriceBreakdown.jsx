import { formatCurrency } from '../../lib/bookingUtils'

export default function PriceBreakdown({
  property,
  pricing,
  compact = false,
}) {
  if (!property || !pricing) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Select dates to see pricing.
      </p>
    )
  }

  const unitText = pricing.units > 0
    ? `${pricing.units} ${pricing.unitLabel}${pricing.units > 1 ? 's' : ''}`
    : '—'

  const rowClass = compact
    ? 'flex items-center justify-between gap-3 text-sm'
    : 'flex items-center justify-between gap-4 text-sm sm:text-base'

  return (
    <div className="space-y-3">
      <div className={rowClass}>
        <span className="text-slate-600 dark:text-slate-400">
          {formatCurrency(property.priceRaw, property.currency)} × {unitText}
        </span>
        <span className="font-medium text-slate-900 dark:text-white">
          {formatCurrency(pricing.rentalSubtotal, property.currency)}
        </span>
      </div>

      {pricing.securityDeposit > 0 && (
        <div className={rowClass}>
          <span className="text-slate-600 dark:text-slate-400">Security deposit</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {formatCurrency(pricing.securityDeposit, property.currency)}
          </span>
        </div>
      )}

      <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
        <div className={`${rowClass} text-base sm:text-lg`}>
          <span className="font-semibold text-slate-900 dark:text-white">Total</span>
          <span className="font-bold text-[#c99b43]">
            {formatCurrency(pricing.total, property.currency)}
          </span>
        </div>
      </div>
    </div>
  )
}
