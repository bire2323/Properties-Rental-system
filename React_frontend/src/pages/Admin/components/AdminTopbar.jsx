import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, Heart, Moon, SunMedium, Menu, ChevronDown } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../hooks/useTheme'
import { getAdminNotifications } from '../../../api/admin/adminApi'

const routeTitles = {
    dashboard: 'Dashboard',
    users: 'Users',
    properties: 'Properties',
    rentals: 'Rentals',
    bookings: 'Bookings',
    verification: 'Verification',
    reports: 'Reports & Complaints',
    payments: 'Payments',
    locations: 'Locations',
    categories: 'Categories',
    notifications: 'Notifications',
    'audit-log': 'Audit Log',
    settings: 'Settings',
}

export default function AdminTopbar({ onToggleSidebar }) {
    const location = useLocation()
    const { user, logout } = useAuth()
    const { theme, toggleTheme, isDark } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const menuRef = useRef(null)

    const pageTitle = (() => {
        const segments = location.pathname.split('/').filter(Boolean)
        const page = segments[1] || 'dashboard'
        return routeTitles[page] || 'Admin'
    })()

    const profileLabel = user?.first_name
        ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`
        : user?.email?.split('@')[0] || 'Admin'
    const profileInitial = profileLabel.charAt(0).toUpperCase()
    const visibleNotifications = notifications.filter((item) => (
        item.type !== 'System' || item.title === 'New user registration'
    ))
    const newNotifications = visibleNotifications.filter((item) => item.status === 'New')

    const getNotificationRoute = (notification) => {
        const title = `${notification.title || ''} ${notification.details || ''}`.toLowerCase()
        if (notification.type === 'Payment') return '/admin-dashboard/payments'
        if (notification.type === 'Report' || title.includes('report')) return '/admin-dashboard/reports'
        return '/admin-dashboard/notifications'
    }

    useEffect(() => {
        let active = true
        const loadNotifications = async () => {
            const items = await getAdminNotifications()
            if (active) setNotifications(items)
        }
        loadNotifications()
        const interval = window.setInterval(loadNotifications, 30000)
        return () => {
            active = false
            window.clearInterval(interval)
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false)
            }
        }

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [menuOpen])

    return (
        <div className={`sticky top-0 z-40 border-b transition ${isDark ? 'border-slate-800 bg-slate-900/95 backdrop-blur' : 'border-slate-200 bg-white/80 backdrop-blur'}`}>
            <div className={`mx-auto flex h-20 max-w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8`}>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition lg:hidden ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div>
                        <span className={`block text-xs uppercase tracking-wider font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Admin Portal
                        </span>
                        <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {pageTitle}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className={`hidden h-10 w-10 items-center justify-center rounded-lg border transition md:inline-flex ${isDark ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {theme === 'dark' ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    <div
                        className="relative hidden sm:block"
                        onMouseEnter={() => setNotificationMenuOpen(true)}
                        onMouseLeave={() => setNotificationMenuOpen(false)}
                    >
                        <Link
                            to="/admin-dashboard/notifications"
                            aria-label="Notifications"
                            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Bell className="h-5 w-5" />
                            {newNotifications.length > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {newNotifications.length > 99 ? '99+' : newNotifications.length}
                                </span>
                            )}
                        </Link>

                        {notificationMenuOpen && (
                            <div className={`absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border shadow-lg ${isDark ? 'border-slate-700 bg-slate-900 shadow-slate-900/40' : 'border-slate-200 bg-white shadow-slate-200/20'}`}>
                                <div className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>New notifications</span>
                                    <span className="text-xs text-slate-500">{newNotifications.length} new</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {newNotifications.slice(0, 5).map((item) => (
                                        <Link
                                            key={item.id}
                                            to={getNotificationRoute(item)}
                                            onClick={() => setNotificationMenuOpen(false)}
                                            className={`block border-b px-4 py-3 transition ${isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-50'}`}
                                        >
                                            <div className={`truncate text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.title}</div>
                                            <div className={`mt-1 line-clamp-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.details}</div>
                                            <div className="mt-1 text-[10px] text-slate-400">{item.date} {item.time}</div>
                                        </Link>
                                    ))}
                                    {newNotifications.length === 0 && (
                                        <div className="px-4 py-6 text-center text-sm text-slate-500">No new notifications.</div>
                                    )}
                                </div>
                                <Link to="/admin-dashboard/notifications" className={`block px-4 py-3 text-center text-xs font-semibold ${isDark ? 'text-blue-300 hover:bg-slate-800' : 'text-blue-600 hover:bg-slate-50'}`}>View all notifications</Link>
                            </div>
                        )}
                    </div>



                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition ${isDark ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
                                {profileInitial}
                            </div>
                            <span className="hidden md:inline">{profileLabel}</span>
                            <ChevronDown className={`h-4 w-4 transition ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        </button>

                        {menuOpen && (
                            <div className={`absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border shadow-lg ${isDark ? 'border-slate-700 bg-slate-900 shadow-slate-900/40' : 'border-slate-200 bg-white shadow-slate-200/20'}`}>
                                <Link
                                    to="/admin-dashboard/profile"
                                    className={`block px-4 py-3 text-sm font-medium transition ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/admin-dashboard/settings"
                                    className={`block px-4 py-3 text-sm font-medium transition ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Settings
                                </Link>
                                <Link
                                    to="/admin-dashboard/users"
                                    className={`block px-4 py-3 text-sm font-medium transition ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Users
                                </Link>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setMenuOpen(false)
                                        await logout()
                                    }}
                                    className={`w-full px-4 py-3 text-left text-sm font-medium transition ${isDark ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
