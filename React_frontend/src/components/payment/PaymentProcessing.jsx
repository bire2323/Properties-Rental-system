import { motion, useReducedMotion } from 'framer-motion'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function PaymentProcessing({ message = 'Processing your payment...' }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-950"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        {!reduceMotion && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[#c99b43]/30"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          />
        )}
        <Loader2 className={`h-8 w-8 text-[#c99b43] ${reduceMotion ? 'animate-pulse' : 'animate-spin'}`} />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{message}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Please wait while we simulate the payment step. No real transaction is occurring.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
        <ShieldCheck className="h-4 w-4 text-[#c99b43]" />
        Mock secure checkout
      </div>
    </motion.div>
  )
}
