import { FileText, MapPinned, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../hooks/useTheme'

const getStatusColors = (statusType, isDark) => {
    if (statusType === 'warning') {
        return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'
    }
    if (statusType === 'info') {
        return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
    }
    return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
}

const getStatusBadgeColors = (statusType, isDark) => {
    if (statusType === 'warning') {
        return isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
    }
    if (statusType === 'info') {
        return isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
    }
    return isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
}

const getIcon = (statusType) => {
    if (statusType === 'warning') return <FileText className="h-4 w-4" />
    if (statusType === 'info') return <MapPinned className="h-4 w-4" />
    return <ShieldCheck className="h-4 w-4" />
}

export default function RecentReportsSection({ recentReports = [] }) {
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const displayReports = Array.isArray(recentReports) ? recentReports : []

    return (
        <section className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`border-b px-6 py-4 flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Recent Reports
                </h3>
                <button onClick={() => navigate('/admin-dashboard/reports')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    View All
                </button>
            </div>

            {displayReports.length === 0 ? (
                <div className={`p-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No recent reports yet.
                </div>
            ) : (
                <div className={`space-y-2 p-4 max-h-80 overflow-y-auto`}>
                    {displayReports.map((report) => (
                        <div
                            key={`${report.id || report.title}-${report.time}`}
                            className={`flex items-start gap-3 rounded-lg p-3 transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                        >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${getStatusColors(report.statusType, isDark)}`}>
                                {getIcon(report.statusType)}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <div className={`truncate text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {report.title}
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${getStatusBadgeColors(report.statusType, isDark)}`}>
                                        {report.status}
                                    </span>
                                </div>
                                <div className={`mt-1 truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {report.place}
                                </div>
                                <div className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {report.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
