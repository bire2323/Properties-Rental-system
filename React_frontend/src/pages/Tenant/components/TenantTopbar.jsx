import { useEffect, useRef, useState } from 'react'
import { Bell, Heart, Menu, ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const profileImageUrl = user?.profile_image ? getImageUrl(user.profile_image) : null;
    const userInitial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'T';
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Tenant';
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
                        <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                            <div className="h-8 w-8 rounded-full bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] text-slate-950 flex items-center justify-center font-semibold overflow-hidden ring-2 ring-[#c99b43]/30">
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
                            <span className="hidden sm:inline font-medium">{fullName}</span>
                            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </button>

                        {open && (
                            <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95">
                                {/* Profile Header Card */}
                                <div className="border-b border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] text-sm font-semibold text-slate-950 shadow-sm ring-2 ring-[#c99b43]/30">
                                            {profileImageUrl ? (
                                                <img
                                                    src={profileImageUrl}
                                                    alt={fullName}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none'
                                                        e.target.parentElement.textContent = userInitial
                                                    }}
                                                />
                                            ) : (
                                                userInitial
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                {fullName}
                                            </p>
                                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                {user?.email || ''}
                                            </p>
                                            <span className="mt-1 inline-flex items-center rounded-full bg-[#c99b43]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#b27a23] dark:text-[#f3c96d]">
                                                {user?.role || 'Tenant'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-1.5">
                                    <button
                                        onClick={() => {
                                            setOpen(false)
                                            navigate('/tenant/profile')
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                                    >
                                        <User size={16} className="text-[#c99b43]" />
                                        <span>View Profile</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOpen(false)
                                            navigate('/tenant/settings')
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:text-slate-200 dark:hover:bg-[#c99b43]/20 dark:hover:text-[#f3c96d]"
                                    >
                                        <Settings size={16} className="text-[#c99b43]" />
                                        <span>Settings</span>
                                    </button>
                                    <div className="my-1 border-t border-slate-200/80 dark:border-slate-800" />
                                    <button
                                        onClick={async () => {
                                            setOpen(false)
                                            await logout()
                                        }}
                                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}