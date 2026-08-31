import { CalendarDays, Minus, Plus } from 'lucide-react'
import { Input } from '../ui/input'
import { getMinCheckInDate } from '../../lib/bookingUtils'

function DateField({ label, name, value, min, onChange, error }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c99b43]" />
        <Input
          type="date"
          name={name}
          value={value}
          min={min}
          onChange={onChange}
          className={`h-12 w-full rounded-2xl pl-10 text-base ${error ? 'border-red-500' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </label>
  )
}

export default function BookingDates({ form, errors, onChange }) {
  const minCheckIn = getMinCheckInDate()
  const minCheckOut = form.checkIn || minCheckIn

  const adjustGuests = (delta) => {
    const next = Math.max(1, Math.min(20, Number(form.guests || 1) + delta))
    onChange({ guests: next })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DateField
        label="Check-in"
        name="checkIn"
        value={form.checkIn}
        min={minCheckIn}
        error={errors.checkIn}
        onChange={(event) => onChange({ checkIn: event.target.value })}
      />
      <DateField
        label="Check-out"
        name="checkOut"
        value={form.checkOut}
        min={minCheckOut}
        error={errors.checkOut}
        onChange={(event) => onChange({ checkOut: event.target.value })}
      />

      <div className="sm:col-span-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Guests</span>
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <span className="text-sm text-slate-600 dark:text-slate-400">Number of guests</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => adjustGuests(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              aria-label="Decrease guests"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[2rem] text-center text-base font-semibold text-slate-900 dark:text-white">
              {form.guests}
            </span>
            <button
              type="button"
              onClick={() => adjustGuests(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              aria-label="Increase guests"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {errors.guests && <p className="mt-1 text-xs text-red-500">{errors.guests}</p>}
      </div>
    </div>
  )
}
