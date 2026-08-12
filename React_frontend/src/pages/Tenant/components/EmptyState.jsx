export default function EmptyState({ title, description, action }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}