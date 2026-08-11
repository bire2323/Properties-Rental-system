export default function EmptyState({ title, description, action }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">{title}</p>
            <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    )
}
