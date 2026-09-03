import { cn } from '@/lib/utils'

export default function StatCard({ icon, label, value, description, accent }) {
    return (
        <div className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 sm:rounded-2xl sm:p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
                <div className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:h-8 sm:w-8', accent)}>
                    {icon}
                </div>
                <span className="min-w-0 truncate rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:px-2 sm:text-[9px]">
                    {label}
                </span>
            </div>
            <div className="mt-2 sm:mt-3">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-lg">{value}</p>
                {description && <p className="mt-1 truncate text-[9px] text-slate-500 dark:text-slate-400 sm:text-xs">{description}</p>}
            </div>
        </div>
    )
}
