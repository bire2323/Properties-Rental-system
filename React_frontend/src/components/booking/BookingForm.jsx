import { AlertCircle, Info, User } from 'lucide-react'
import { Input } from '../ui/input'
import BookingDates from './BookingDates'

export default function BookingForm({ form, errors, onChange, user }) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Stay details</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose your dates and guest count for this rental.
          </p>
        </div>
        <BookingDates form={form} errors={errors} onChange={onChange} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Special requests</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Optional notes for the property owner (mock — not sent to backend yet).
          </p>
        </div>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Early check-in, parking needs, accessibility requirements..."
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#c99b43]" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contact information</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
            Full name
            <Input
              value={form.contactName}
              onChange={(event) => onChange({ contactName: event.target.value })}
              placeholder={user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Your full name'}
              className="h-12 rounded-2xl text-base"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            Email
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(event) => onChange({ contactEmail: event.target.value })}
              placeholder={user?.email || 'you@example.com'}
              className="h-12 rounded-2xl text-base"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            Phone
            <Input
              type="tel"
              value={form.contactPhone}
              onChange={(event) => onChange({ contactPhone: event.target.value })}
              placeholder="+251 9XX XXX XXX"
              className="h-12 rounded-2xl text-base"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#c99b43]" />
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-900 dark:text-white">Before you continue</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>This is a frontend-only booking preview — no real reservation is created yet.</li>
              <li>Security deposit may be refundable subject to owner approval.</li>
              <li>Booking requests may require owner confirmation in a future release.</li>
            </ul>
          </div>
        </div>
      </section>

      {errors.general && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}
    </div>
  )
}
