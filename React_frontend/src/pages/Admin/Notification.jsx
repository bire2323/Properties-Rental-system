import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowRight,
    Bell,
    ChevronLeft,
    ChevronRight,
    House,
    Loader2,
    Search,
    ShieldCheck,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { getAdminNotifications } from '../../api/admin/adminApi'

const tabs = ['All', 'Booking', 'Property']

function Notification() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('All')
    const [search, setSearch] = useState('')
    const [displayCount, setDisplayCount] = useState(3)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const { isDark } = useTheme()

    const fetchNotifications = useCallback(async () => {
        setLoading(true)
        try {
            const filters = {}
            if (activeTab !== 'All') {
                filters.type = activeTab
            }
            const data = await getAdminNotifications(filters)
            setNotifications(data)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            setNotifications([])
        } finally {
            setLoading(false)
        }
    }, [activeTab])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    const filteredNotifications = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return notifications
        return notifications.filter((item) => {
            return [item.title, item.sender, item.type, item.details, item.property_title, item.propertyTitle].some((field) =>
                field?.toLowerCase().includes(query),
            )
        })
    }, [notifications, search])

    const getStatusClass = (status) => {
        const map = {
            New: isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600',
            Received: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600',
            Confirmed: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600',
            Info: isDark ? 'bg-slate-600/20 text-slate-300' : 'bg-slate-100 text-slate-600',
        }
        return map[status] || (isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600')
    }

    return (
        <div className={`min-h-screen flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Dashboard</span>
                            <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
                            <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>Notifications</span>
                        </div>
                    </div>

                    <div className={`overflow-hidden rounded-2xl border shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className="flex flex-col gap-4 border-b px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                            <div>
                                <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h1>
                                <p className={isDark ? 'mt-1 text-sm text-slate-400' : 'mt-1 text-sm text-slate-500'}>
                                    View all system notifications and activity.
                                </p>
                            </div>

                            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                                <Search className="h-4 w-4 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search anything..."
                                    className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-400 ${isDark ? 'text-white' : 'text-slate-700'}`}
                                />
                            </div>
                        </div>

                        <div className="border-b px-4 py-3 md:px-6">
                            <div className="flex flex-wrap gap-2">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab
                                    return (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setActiveTab(tab)}
                                            className={[
                                                'rounded-lg border px-3 py-2 text-xs font-medium transition',
                                                isActive
                                                    ? 'border-[#f0c765] bg-[#fff8e7] text-[#795400]'
                                                    : isDark
                                                        ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
                                            ].join(' ')}
                                        >
                                            {tab}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-3 p-4 md:p-5">
                            {loading ? (
                                <div className={`flex items-center justify-center p-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="ml-2 text-sm">Loading notifications...</span>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className={`rounded-xl border border-dashed p-8 text-center ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                    No notifications found.
                                </div>
                            ) : (
                                filteredNotifications.slice(0, displayCount).map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => navigate(`/admin-dashboard/notifications/${item.id}`)}
                                        className={[
                                            'flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition',
                                            isDark
                                                ? 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'
                                                : 'border-slate-200 bg-white hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-slate-700 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                                                {item.type === 'Property' ? <House className="h-4 w-4" /> : item.type === 'Payment' ? <ShieldCheck className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                                    {item.title}
                                                </div>
                                                <div className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {item.details}
                                                </div>
                                                <div className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {item.date} • {item.time}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                            <ArrowRight className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {filteredNotifications.length > displayCount || displayCount > 3 ? (
                            <div className={`flex items-center justify-center border-t px-4 py-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="flex items-center gap-2">
                                    {displayCount > 3 && (
                                        <button
                                            type="button"
                                            onClick={() => setDisplayCount(3)}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${isDark
                                                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            View less
                                        </button>
                                    )}
                                    {filteredNotifications.length > displayCount && (
                                        <button
                                            type="button"
                                            onClick={() => setDisplayCount(displayCount + 3)}
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${isDark
                                                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            View more
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Notification
