import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../hooks/useTheme'

export default function PendingApprovalsSection({ pendingCount = null, pendingApprovals = [] }) {
    const navigate = useNavigate()
    const { isDark } = useTheme()

    const displayApprovals = Array.isArray(pendingApprovals)
        ? pendingApprovals.map((p) => ({
            id: p.id,
            title: p.title,
            type: p.type || 'Property',
            owner: p.owner || 'Unknown',
            date: p.date ? `Submitted ${p.date}` : 'Recently submitted',
            image: p.image,
        }))
        : []

    const displayCount = pendingCount !== null ? pendingCount : displayApprovals.length

    return (
        <section className={`rounded-xl border shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`border-b px-6 py-4 flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Pending Approvals
                    {pendingCount !== null && (
                        <span className={`ml-2 text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            ({displayCount})
                        </span>
                    )}
                </h2>
                <button onClick={() => navigate('/admin-dashboard/notifications')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
            </div>

            {displayApprovals.length === 0 ? (
                <div className={`p-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No pending approvals yet.
                </div>
            ) : (
                <div className={`space-y-3 p-6 max-h-80 overflow-y-auto`}>
                    {displayApprovals.map((item) => (
                        <div
                            key={item.id || item.title}
                            className={`flex items-center gap-3 rounded-lg border p-3 transition ${isDark ? 'border-slate-700 bg-slate-800 hover:bg-slate-750' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <div className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {item.title}
                                    </div>
                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>
                                        {item.type}
                                    </span>
                                </div>
                                <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    by {item.owner}
                                </div>
                                <div className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {item.date}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
