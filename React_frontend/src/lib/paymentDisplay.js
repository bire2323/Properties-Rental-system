/**
 * Shared presentation metadata for PaymentTransaction statuses.
 *
 * The backend stores statuses as lowercase strings:
 * initiated, pending, successful, failed, cancelled, refunded, partially_refunded.
 * Never compare against capitalized labels like "Successful".
 */
export const PAYMENT_STATUS_META = Object.freeze({
  initiated: {
    label: 'Initiated',
    tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200',
  },
  pending: {
    label: 'Pending',
    tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200',
  },
  successful: {
    label: 'Successful',
    tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  failed: {
    label: 'Failed',
    tone: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-200',
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-200',
  },
  refunded: {
    label: 'Refunded',
    tone: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
  partially_refunded: {
    label: 'Partially refunded',
    tone: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  },
})

export function getPaymentStatusMeta(status) {
  return (
    PAYMENT_STATUS_META[status] || {
      label: 'No payment',
      tone: 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300',
    }
  )
}

export const PAYMENT_METHODS = Object.freeze({
  chapa: { label: 'Chapa' },
  telebirr: { label: 'Telebirr' },
  cbe_birr: { label: 'CBE Birr' },
  cash: { label: 'Cash' },
  other: { label: 'Other' },
})

export function formatPaymentMethod(method, displayLabel) {
  if (displayLabel) return displayLabel
  return PAYMENT_METHODS[method]?.label || String(method || '—').replace(/_/g, ' ')
}