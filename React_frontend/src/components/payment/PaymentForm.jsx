import { Input } from '../ui/input'

export default function PaymentForm({ method, payment, onChange, errors = {} }) {
  if (method === 'card') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
          Cardholder name
          <Input
            value={payment.cardholderName}
            onChange={(event) => onChange({ cardholderName: event.target.value })}
            placeholder="Name on card"
            autoComplete="cc-name"
            className="h-12 rounded-2xl text-base"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
          Card number
          <Input
            value={payment.cardNumber}
            onChange={(event) => onChange({ cardNumber: event.target.value.replace(/\D/g, '').slice(0, 16) })}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            autoComplete="cc-number"
            className="h-12 rounded-2xl text-base tracking-widest"
          />
          {errors.cardNumber && <p className="text-xs text-red-500">{errors.cardNumber}</p>}
        </label>
        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          Expiry date
          <Input
            value={payment.expiry}
            onChange={(event) => onChange({ expiry: event.target.value })}
            placeholder="MM/YY"
            autoComplete="cc-exp"
            className="h-12 rounded-2xl text-base"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          Security code
          <Input
            value={payment.cvc}
            onChange={(event) => onChange({ cvc: event.target.value.replace(/\D/g, '').slice(0, 4) })}
            placeholder="CVC"
            inputMode="numeric"
            autoComplete="cc-csc"
            className="h-12 rounded-2xl text-base"
          />
        </label>
        <p className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">
          UI placeholder only — card details are not stored or processed.
        </p>
      </div>
    )
  }

  if (method === 'mobile') {
    return (
      <div className="space-y-4">
        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          Mobile wallet number
          <Input
            value={payment.mobileNumber}
            onChange={(event) => onChange({ mobileNumber: event.target.value })}
            placeholder="+251 9XX XXX XXX"
            className="h-12 rounded-2xl text-base"
          />
        </label>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You will receive a payment prompt on your device after submitting (mock flow).
        </p>
      </div>
    )
  }

  if (method === 'bank') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950/50">
          <p className="font-medium text-slate-900 dark:text-white">Mock bank details</p>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Bank: NexaSpace Rental Bank</p>
          <p className="text-slate-600 dark:text-slate-400">Account: 1000 2345 6789</p>
          <p className="text-slate-600 dark:text-slate-400">Reference: Use your booking reference after submission</p>
        </div>
        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          Transfer reference (optional)
          <Input
            value={payment.bankReference}
            onChange={(event) => onChange({ bankReference: event.target.value })}
            placeholder="Your bank transfer reference"
            className="h-12 rounded-2xl text-base"
          />
        </label>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
      Your booking request will be submitted without immediate payment. The owner may contact you with payment instructions after approval.
    </div>
  )
}
