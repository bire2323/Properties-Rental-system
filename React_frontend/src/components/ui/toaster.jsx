import { Toaster as Sonner, toast as sonnerToast } from 'sonner'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '@/lib/utils'

/**
 * App-wide toast viewport built on sonner.
 *
 * - Follows the active app theme (light/dark/system).
 * - Responsive: on mobile sonner renders a banner near the top/bottom and on
 *   larger screens the toasts stack in a corner.
 * - richColors gives clear success/error/warning accents out of the box.
 *
 * Rendered once in App.jsx so toasts are available app-wide.
 */
export function Toaster() {
  const theme = useTheme()

  return (
    <Sonner
      theme={theme?.theme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
      expand
      visibleToasts={5}
      gap={10}
      offset={{ bottom: '1.5rem', right: '1.5rem' }}
      mobileOffset={{ bottom: '1rem', left: '1rem', right: '1rem' }}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: cn(
            'group toast w-full rounded-2xl border bg-popover text-popover-foreground shadow-lg backdrop-blur-md',
            'data-[type=error]:border-red-400/40 data-[type=success]:border-emerald-400/40',
            'max-sm:w-full max-sm:rounded-2xl'
          ),
          title: 'font-semibold text-sm',
          description: 'text-sm text-muted-foreground',
          closeButton: cn(
            'border-border bg-background text-muted-foreground',
            'group-data-[type=error]:border-red-400/40 group-data-[type=success]:border-emerald-400/40'
          ),
        },
      }}
    />
  )
}

export { sonnerToast as toast }

export function useToast() {
  return {
    toast: sonnerToast,
    success: (message, options) => sonnerToast.success(message, options),
    error: (message, options) => sonnerToast.error(message, options),
    warning: (message, options) => sonnerToast.warning(message, options),
    info: (message, options) => sonnerToast.info(message, options),
  }
}
