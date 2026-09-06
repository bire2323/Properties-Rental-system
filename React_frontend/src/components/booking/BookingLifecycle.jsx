import { Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Post-submission booking lifecycle indicator.
 *
 * This deliberately replaces the 5-step FORM progress (BookingProgress) once a
 * request has been submitted. The form progress (Customer / Identification /
 * Rental Details / Review / Confirm) describes filling in the booking form;
 * this stepper describes what happens AFTER submission:
 *
 *   Request submitted -> Owner approval -> Payment -> Booking confirmed
 *
 * It is purely presentational; position of each step is derived from the
 * authoritative booking status.
 */
const LIFECYCLE_STEPS = [
  { id: 'request', label: 'Request submitted' },
  { id: 'approval', label: 'Owner approval' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmed', label: 'Booking confirmed' },
]

const PAID_STATUSES = ['confirmed', 'completed']

function stepState(stepId, status) {
  if (stepId === 'request') return 'done'
  if (stepId === 'approval') {
    if (status === 'approved' || PAID_STATUSES.includes(status)) return 'done'
    if (status === 'pending') return 'active'
    return 'stopped'
  }
  if (stepId === 'payment') {
    if (PAID_STATUSES.includes(status)) return 'done'
    if (status === 'approved') return 'active'
    if (status === 'pending') return 'upcoming'
    return 'upcoming'
  }
  if (stepId === 'confirmed') {
    if (PAID_STATUSES.includes(status)) return 'done'
    return 'upcoming'
  }
  return 'upcoming'
}

function StepMarker({ state, index, rejected }) {
  const stopped = state === 'stopped'
  const stoppedRed = stopped && rejected
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
        state === 'done' &&
          'border-[#c99b43] bg-[#c99b43] text-white',
        state === 'active' &&
          'border-[#c99b43] bg-[#c99b43]/10 text-[#b98227] dark:text-[#f3c96d]',
        (state === 'upcoming' || stopped) &&
          (stoppedRed
            ? 'border-red-200 bg-red-50 text-red-500 dark:border-red-900/50 dark:bg-red-950/40'
            : 'border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900')
      )}
    >
      {state === 'done' ? (
        <Check className="h-4 w-4" />
      ) : stopped ? (
        <X className="h-4 w-4" />
      ) : state === 'active' ? (
        <span className="h-2.5 w-2.5 rounded-full bg-[#c99b43] dark:bg-[#f3c96d]" />
      ) : (
        index + 1
      )}
    </div>
  )
}

export default function BookingLifecycle({ status = 'pending', outline = false }) {
  const rejected = status === 'rejected'

  return (
    <nav
      aria-label="Booking lifecycle"
      className={cn('w-full rounded-2xl border p-4 sm:p-5', outline ? 'border-transparent' : 'border-slate-200 dark:border-slate-800')}
    >
      <ol className="flex items-start justify-between gap-2">
        {LIFECYCLE_STEPS.map((step, index) => {
          const state = stepState(step.id, status)
          const connect = index < LIFECYCLE_STEPS.length - 1
          const prevDone = state === 'done' || state === 'active'
          return (
            <li key={step.id} className="flex flex-1 items-start">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <StepMarker state={state} index={index} rejected={rejected} />
                <span
                  className={cn(
                    'text-[11px] font-medium leading-tight sm:text-xs',
                    state === 'active' || state === 'done'
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {connect && (
                <div
                  className={cn(
                    'mt-4 h-px min-w-4 flex-1 sm:min-w-8',
                    prevDone ? 'bg-[#c99b43]/60' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}