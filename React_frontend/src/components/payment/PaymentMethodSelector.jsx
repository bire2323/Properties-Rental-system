import { motion, useReducedMotion } from 'framer-motion'
import { Building2, CreditCard, Smartphone, Clock } from 'lucide-react'

export const PAYMENT_METHODS = [
  {
    id: 'card',
    label: 'Card payment',
    description: 'Visa, Mastercard, or local debit cards',
    icon: CreditCard,
  },
  {
    id: 'mobile',
    label: 'Mobile payment',
    description: 'Telebirr, M-Pesa, or similar wallets',
    icon: Smartphone,
  },
  {
    id: 'bank',
    label: 'Bank transfer',
    description: 'Pay via bank transfer reference',
    icon: Building2,
  },
  {
    id: 'later',
    label: 'Pay later',
    description: 'Submit request and pay after approval',
    icon: Clock,
  },
]

export default function PaymentMethodSelector({ selectedMethod, onSelect }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon
        const isSelected = selectedMethod === method.id

        return (
          <motion.button
            key={method.id}
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            onClick={() => onSelect(method.id)}
            className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c99b43]/40 ${
              isSelected
                ? 'border-[#c99b43] bg-[#fff7e8] shadow-sm dark:border-[#c99b43]/60 dark:bg-[#1e1a11]'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
            }`}
            aria-pressed={isSelected}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isSelected
                    ? 'bg-[#c99b43] text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{method.label}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{method.description}</p>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
