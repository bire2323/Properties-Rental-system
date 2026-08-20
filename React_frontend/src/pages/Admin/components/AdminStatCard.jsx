import { useTheme } from '../../../hooks/useTheme'

export default function AdminStatCard({ icon: Icon, label, value, iconBg }) {
    const { isDark } = useTheme()

    return (
        <div
            className={`min-w-0 overflow-hidden rounded-lg border p-2 shadow-sm transition sm:p-3 ${isDark ? 'border-slate-700 bg-slate-900 hover:shadow-md' : 'border-slate-200 bg-white hover:shadow-md'}`}
        >
            <div className="mb-1.5 flex items-start gap-2 sm:mb-2">
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${iconBg}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>

            <div className={`truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs sm:tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
            </div>

            <div className={`mt-1 break-words text-lg font-bold tracking-[-0.03em] sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {value}
            </div>
        </div>
    )
}
