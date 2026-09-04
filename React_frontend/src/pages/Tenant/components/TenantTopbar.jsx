import { useEffect, useRef, useState } from 'react'
import { Bell, Heart, Menu, ChevronDown } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../hooks/useTheme'
import { cn, getImageUrl } from '@/lib/utils'

const routeTitles = {
    dashboard: 'Dashboard',
    bookings: 'Bookings',
    favorites: 'Favorites',
    payments: 'Payments',
    messages: 'Messages',
    profile: 'Profile',
    settings: 'Settings',
}

export default function TenantTopbar({ onToggleSidebar }) {
    const location = useLocation()
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const profileImageUrl = user?.profile_image ? getImageUrl(user.profile_image) : null;
    const userInitial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'T';
    const pageTitle = (() => {
        const segments = location.pathname.split('/').filter(Boolean)
        const page = segments[1] || 'dashboard'
        return routeTitles[page] || 'Tenant'
    })()

    useEffect(() => {
        function onDoc(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    return (
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <button onClick={onToggleSidebar} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 lg:hidden">
                        <Menu className="h-5 w-5" />
                    </button>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Tenant Portal</p>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{pageTitle}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={toggleTheme} className="hidden rounded-md p-2 md:inline-flex">{theme === 'dark' ? '☀️' : '🌙'}</button>
                    <Link to="/tenant/messages" className="hidden h-10 w-10 items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 sm:inline-flex">
                        <Bell className="h-5 w-5" />
                    </Link>
                    <Link to="/tenant/favorites" className="hidden h-10 w-10 items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 sm:inline-flex">
                        <Heart className="h-5 w-5" />
                    </Link>

                    <div className="relative" ref={ref}>
                        <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100 flex items-center justify-center font-semibold">
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={user?.first_name || 'Profile'}
                                        className="h-full w-full rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.textContent = userInitial;
                                        }}
                                    />
                                ) : (
                                    userInitial
                                )}
                            </div>
                            <span className="hidden sm:inline">{user?.first_name || user?.email?.split('@')[0]}</span>
                            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </button>

                        {open && (
                            <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-950">
                                <button onClick={() => { setOpen(false) }} className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900">View Profile</button>
                                <button onClick={() => { setOpen(false) }} className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900">Settings</button>
                                <button onClick={async () => { await logout() }} className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}