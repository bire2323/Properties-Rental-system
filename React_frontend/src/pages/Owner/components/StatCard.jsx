import { cn } from '@/lib/utils'

export default function StatCard({ icon, label, value, description, accent }) {
    return (
        <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
                <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100', accent)}>
                    {icon}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {label}
                </span>
            </div>
            <div className="mt-6">
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
                {description && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
        </div>
    )
}
