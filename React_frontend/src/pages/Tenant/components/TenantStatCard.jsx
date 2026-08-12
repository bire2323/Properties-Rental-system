export default function TenantStatCard({ icon, label, value, className = '' }) {
    return (
        <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
            </div>
            {icon && <div className="mt-3 text-slate-500 dark:text-slate-400">{icon}</div>}
        </div>
    )
}