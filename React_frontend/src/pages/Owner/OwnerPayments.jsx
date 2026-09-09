import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileClock,
  Inbox,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react'
import { listPayments } from '../../api/paymentApi'
import { formatAmount, formatCreatedDate } from '../../lib/bookingDisplay'
import { formatPaymentMethod, getPaymentStatusMeta } from '../../lib/paymentDisplay'

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'initiated', label: 'Initiated' },
  { value: 'pending', label: 'Pending' },
  { value: 'successful', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially refunded' },
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

export default function OwnerPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const loadPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPayments()
      const results = Array.isArray(data) ? data : data.results || []
      setPayments(results)
    } catch (err) {
      setError(err.message || 'Unable to load payments.')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const totals = useMemo(() => {
    const sum = (statuses) =>
      payments
        .filter((p) => statuses.includes(p.status))
        .reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
    return {
      collected: sum(['successful']),
      pending: sum(['initiated', 'pending']),
      failed: sum(['failed', 'cancelled']),
      currency: payments[0]?.currency || 'ETB',
    }
  }, [payments])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return payments.filter((p) => {
      const matchesStatus = !statusFilter || p.status === statusFilter
      const haystack = [
        p.transaction_reference,
        p.tx_ref,
        p.provider_reference,
        p.booking_reference,
        p.booking_property_name,
        p.renter_name,
        p.renter_email,
        formatPaymentMethod(p.payment_method),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesSearch = !term || haystack.includes(term)
      return matchesStatus && matchesSearch
    })
  }, [payments, searchTerm, statusFilter])

  const statCards = [
    {
      label: 'Total collected',
      value: formatAmount(totals.collected, totals.currency),
      icon: Wallet,
      iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      label: 'Pending',
      value: formatAmount(totals.pending, totals.currency),
      icon: Clock3,
      iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      label: 'Failed / Cancelled',
      value: formatAmount(totals.failed, totals.currency),
      icon: XCircle,
      iconClass: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300',
    },
    {
      label: 'Records',
      value: String(payments.length),
      icon: CreditCard,
      iconClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">Payments</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {loading
              ? 'Loading payments…'
              : `Track payments from bookings on the properties and vehicles you manage.`}
          </p>
        </div>
        {!loading && !error && payments.length > 0 && (
          <button
            type="button"
            onClick={loadPayments}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </section>

      {!loading && !error && payments.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions…"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#c99b43] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter payments by status"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#c99b43] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && <TableSkeleton />}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/40">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-200">Unable to load payments</h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={loadPayments}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {!loading && !error && payments.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <Inbox className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No payments yet</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Payments from your tenants will appear here once they are approved and pay.
          </p>
        </div>
      )}

      {!loading && !error && payments.length > 0 && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-950">
          <FileClock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No matching payments</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No payments match the current filters.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Transaction</th>
                  <th className="px-6 py-4 font-semibold">Property</th>
                  <th className="px-6 py-4 font-semibold">Renter</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Method</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((payment) => {
                  const meta = getPaymentStatusMeta(payment.status)
                  return (
                    <tr key={payment.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          {payment.transaction_reference}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">{payment.booking_reference}</p>
                      </td>
                      <td className="max-w-[14rem] px-6 py-4">
                        <p className="truncate font-medium text-slate-900 dark:text-white">
                          {payment.booking_property_name || '—'}
                        </p>
                        {payment.provider_reference && (
                          <p className="truncate font-mono text-[10px] text-slate-400">
                            ref {payment.provider_reference}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800 dark:text-slate-100">{payment.renter_name || '—'}</p>
                        {payment.renter_email && (
                          <p className="text-xs text-slate-400">{payment.renter_email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {formatPaymentMethod(payment.payment_method)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {formatCreatedDate(payment.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 lg:hidden">
          {filtered.map((payment) => {
            const meta = getPaymentStatusMeta(payment.status)
            return (
              <div
                key={payment.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {payment.transaction_reference}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {payment.booking_property_name || '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {payment.renter_name || payment.renter_email || '—'}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Method</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {formatPaymentMethod(payment.payment_method)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {formatCreatedDate(payment.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}