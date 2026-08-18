import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, Heart, Moon, SunMedium, Menu, ChevronDown } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../hooks/useTheme'

const routeTitles = {
    dashboard: 'Dashboard',
    users: 'Users',
    properties: 'Properties',
    rentals: 'Rentals',
    verification: 'Verification',
    reports: 'Reports & Complaints',
    payments: 'Payments',
    locations: 'Locations',
    categories: 'Categories',
    notifications: 'Notifications',
    settings: 'Settings',
}

export default function AdminTopbar({ onToggleSidebar }) {
    const location = useLocation()
    const { user, logout } = useAuth()
    const { theme, toggleTheme, isDark } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
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

                    <Link to="/admin-dashboard/reports" className={`hidden h-10 w-10 items-center justify-center rounded-lg border transition sm:inline-flex ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                        <Bell className="h-5 w-5" />
                    </Link>

                    <Link to="/admin-dashboard/notifications" className={`hidden h-10 w-10 items-center justify-center rounded-lg border transition sm:inline-flex ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                        <Heart className="h-5 w-5" />
                    </Link>

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
                                    className={`w-full px-4 py-3 text-left text-sm font-medium transition ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
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
