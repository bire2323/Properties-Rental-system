import { cn } from '@/lib/utils'

export default function StatCard({ icon, label, value, description, accent }) {
    return (
        <div className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className={cn('inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100', accent)}>
                    {icon}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-medium uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-500 dark:bg-slate-800 dark:text-slate-400 max-w-full truncate text-center self-start sm:self-auto">
                    {label}
                </span>
            </div>
            <div className="mt-4 sm:mt-6">
                <p className="text-xl sm:text-3xl font-semibold text-slate-900 dark:text-white truncate">{value}</p>
                {description && <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{description}</p>}
            </div>
        </div>
    )
}
