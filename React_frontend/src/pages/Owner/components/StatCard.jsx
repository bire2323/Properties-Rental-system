import { cn } from '@/lib/utils'

export default function StatCard({ icon, label, value, description, accent, gradient }) {
    return (
        <div
            className={cn(
                'group relative min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900',
                gradient
            )}
        >
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <div className="relative flex items-start justify-between gap-2">
                <div className={cn(
                    'inline-flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110',
                    accent
                )}>
                    {icon}
                </div>
                <span className="min-w-0 truncate rounded-full border border-slate-200/60 bg-white/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-400 sm:text-[10px] backdrop-blur-sm">
                    {label}
                </span>
            </div>

            <div className="relative mt-4 sm:mt-5">
                <p className="truncate text-xl font-bold text-slate-900 dark:text-white sm:text-2xl tracking-tight">
                    {value}
                </p>
                {description && (
                    <p className="mt-1.5 truncate text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {description}
                    </p>
                )}
            </div>

            {/* Bottom accent bar */}
            <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 rounded-b-3xl opacity-40 group-hover:opacity-80 transition-opacity', accent)} />
        </div>
    )
}
