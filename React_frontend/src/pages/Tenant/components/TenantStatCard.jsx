export default function TenantStatCard({
    icon,
    label,
    value,
    badge,
    subtext,
    accent = 'gold',
    className = '',
    onClick,
}) {
    const accentStyles = {
        gold: {
            iconBg: 'bg-[#c99b43]/10 text-[#b98227] dark:bg-[#c99b43]/20 dark:text-[#f3c96d] border-[#c99b43]/20',
            badgeBg: 'bg-[#c99b43]/10 text-[#b98227] dark:text-[#f3c96d]',
            glow: 'group-hover:border-[#c99b43]/40',
        },
        emerald: {
            iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20',
            badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
            glow: 'group-hover:border-emerald-500/40',
        },
        amber: {
            iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
            badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
            glow: 'group-hover:border-amber-500/40',
        },
        blue: {
            iconBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20',
            badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
            glow: 'group-hover:border-blue-500/40',
        },
        purple: {
            iconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20',
            badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
            glow: 'group-hover:border-purple-500/40',
        },
        slate: {
            iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            badgeBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            glow: 'group-hover:border-slate-300 dark:group-hover:border-slate-700',
        },
    }

    const currentAccent = accentStyles[accent] || accentStyles.gold

    return (
        <div
            onClick={onClick}
            className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 ${currentAccent.glow} ${
                onClick ? 'cursor-pointer' : ''
            } ${className}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        {value}
                    </p>
                    {subtext && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {subtext}
                        </p>
                    )}
                </div>

                {icon && (
                    <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105 ${currentAccent.iconBg}`}
                    >
                        {icon}
                    </div>
                )}
            </div>

            {badge && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${currentAccent.badgeBg}`}
                    >
                        {badge}
                    </span>
                </div>
            )}
        </div>
    )
}