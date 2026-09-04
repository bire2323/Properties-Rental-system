import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, Heart, Moon, SunMedium, Menu, ChevronDown } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../hooks/useTheme'
import { cn, getImageUrl } from '@/lib/utils'

const routeTitles = {
    dashboard: 'Dashboard',
    properties: 'Properties',
    bookings: 'Bookings',
    payments: 'Payments',
    messages: 'Messages',
    favorites: 'Favorites',
    reports: 'Reports',
    settings: 'Settings',
}

export default function OwnerTopbar({ onToggleSidebar }) {
    const location = useLocation()
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)
    const profileImageUrl = user?.profile_image ? getImageUrl(user.profile_image) : null;

    const pageTitle = (() => {
        const segments = location.pathname.split('/').filter(Boolean)
        const page = segments[1] || 'dashboard'
        return routeTitles[page] || 'Owner'
    })()

    const profileLabel = user?.first_name
        ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`
        : user?.email?.split('@')[0] || 'Owner'
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
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <div className="mx-auto flex h-14 sm:h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="inline-flex h-7 sm:h-11 w-7 sm:w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
                    >
                        <Menu className="h-4 sm:h-5 w-4 sm:w-5" />
                    </button>

                    <div>
                        <span className="block text-[11px] sm:text-base md:text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                            Owner Portal
                        </span>
                        <h1 className="text-[10px] sm:text-lg font-semibold text-slate-900 dark:text-white">
                            {pageTitle}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:inline-flex"
                    >
                        {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <Link to="/owner/messages" className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex">
                        <Bell className="h-4 w-4" />
                    </Link>
                    <Link to="/owner/favorites" className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex">
                        <Heart className="h-4 w-4" />
                    </Link>
                    <div className="relative" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setMenuOpen((open) => !open)}
                            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <div className="flex h-5 sm:h-9 w-5 sm:w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={profileLabel}
                                        className="h-full w-full rounded-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.textContent = profileInitial;
                                        }}
                                    />
                                ) : (
                                    profileInitial
                                )}
                            </div>
                            <span className="hidden md:inline">{profileLabel}</span>
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/20 dark:border-slate-800 dark:bg-slate-950">
                                <Link
                                    to="/owner/settings"
                                    className="block px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Settings
                                </Link>
                                <Link
                                    to="/owner/properties"
                                    className="block px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    My Properties
                                </Link>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setMenuOpen(false)
                                        await logout()
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
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
