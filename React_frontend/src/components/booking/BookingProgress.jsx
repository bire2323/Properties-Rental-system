import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Booking Details' },
  { id: 2, label: 'Payment' },
  { id: 3, label: 'Confirmation' },
]

export default function BookingProgress({ currentStep = 1 }) {
  const reduceMotion = useReducedMotion()

  return (
    <nav aria-label="Booking progress" className="w-full">
      <ol className="flex items-center justify-between gap-2 sm:justify-start sm:gap-0">
        {STEPS.map((step, index) => {
          const isComplete = currentStep > step.id
          const isActive = currentStep === step.id

          return (
            <li key={step.id} className="flex flex-1 items-center sm:flex-none sm:min-w-[9rem]">
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:items-start">
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive && !reduceMotion ? 1.05 : 1,
                      backgroundColor: isComplete || isActive ? '#c99b43' : undefined,
                    }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                      isComplete || isActive
                        ? 'border-[#c99b43] bg-[#c99b43] text-white'
                        : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : step.id}
                  </motion.div>
                  <span
                    className={`hidden text-sm font-medium sm:inline ${
                      isActive
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-medium sm:hidden ${
                    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 hidden h-px flex-1 sm:block ${
                    currentStep > step.id ? 'bg-[#c99b43]' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
