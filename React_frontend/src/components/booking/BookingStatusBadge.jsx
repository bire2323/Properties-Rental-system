import { getStatusMeta } from '../../lib/bookingDisplay'
import { cn } from '../../lib/utils'

/**
 * Reusable status badge showing the lifecycle-friendly label and dot.
 * Used across tenant and owner dashboard views.
 */
export default function BookingStatusBadge({ status, size = 'md' }) {
  const meta = getStatusMeta(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.14em]',
        meta.badge,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}
