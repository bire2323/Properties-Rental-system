import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../hooks/useTheme'

export default function RecentUsersSection({ recentUsers = [] }) {
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const displayUsers = Array.isArray(recentUsers) ? recentUsers : []

    return (
        <section className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`border-b px-6 py-4 flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Recent Users
                </h3>
                <button onClick={() => navigate('/admin-dashboard/users')} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    View All
                </button>
            </div>

            {displayUsers.length === 0 ? (
                <div className={`p-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No recent users yet.
                </div>
            ) : (
                <div className={`space-y-2 p-4 max-h-80 overflow-y-auto`}>
                    {displayUsers.map((user) => (
                        <div
                            key={user.id || user.email}
                            className={`flex items-center justify-between gap-3 rounded-lg p-3 transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <img
                                    src={user.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'}
                                    alt={user.name}
                                    className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {user.name}
                                    </div>
                                    <div className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {user.email}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className={`rounded-full px-2 py-1 text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                    {user.role}
                                </div>
                                <div className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {user.time}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
