import { useTheme } from '../../../hooks/useTheme'

export default function AdminStatCard({ icon: Icon, label, value, iconBg }) {
    const { isDark } = useTheme()

    return (
        <div
            className={`rounded-lg border shadow-sm transition p-3 ${isDark ? 'border-slate-700 bg-slate-900 hover:shadow-md' : 'border-slate-200 bg-white hover:shadow-md'}`}
        >
            <div className="flex items-start gap-2 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${iconBg}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>

            <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
            </div>

            <div className={`mt-1 text-xl font-bold tracking-[-0.03em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {value}
            </div>
        </div>
    )
}
