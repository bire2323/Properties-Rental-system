import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Home, Bookmark, Calendar, CreditCard, MessageSquare, User, Settings, LogOut, Menu, X, ChevronRight, Building2 } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { cn, getImageUrl } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../../../assets/logo.jpg'
import { getSiteSettings, resolveSiteMediaUrl } from '../../../api/siteSettingsApi'

const links = [
    { label: 'Dashboard', path: '/tenant/dashboard', icon: Home },
    { label: 'Bookings', path: '/tenant/bookings', icon: Calendar },
    { label: 'Favorites', path: '/tenant/favorites', icon: Bookmark },
    { label: 'Payments', path: '/tenant/payments', icon: CreditCard },
    { label: 'Messages', path: '/tenant/messages', icon: MessageSquare },
    { label: 'Profile', path: '/tenant/profile', icon: User },
    { label: 'Settings', path: '/tenant/settings', icon: Settings },
]
function BrandSkeleton() {
    return (
        <>
            <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
                <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200/80 dark:bg-slate-800/80" />
            </div>
        </>
    )
}

function BrandFallback({ label = 'Home' }) {
    return (
        <>
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#c99b43]/25 bg-[#c99b43]/10 text-[#b98227] dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]">
                <Building2 size={26} />
            </span>
            <span className="max-w-[11rem] truncate text-lg font-semibold tracking-tight text-[#f3c96d] sm:max-w-[14rem]">
                {label}
            </span>
        </>
    )
}
export default function TenantSidebar({ isOpen, onClose }) {
    const { logout, user } = useAuth()
    const navigate = useNavigate()

    const profileImageUrl = user?.profile_image ? getImageUrl(user.profile_image) : null
    const userInitial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'T'
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'Tenant'

    const [siteSettings, setSiteSettings] = useState(null)
    const [siteSettingsStatus, setSiteSettingsStatus] = useState('loading')
    const [brandLogoFailed, setBrandLogoFailed] = useState(false)
    const siteName = siteSettings?.site_name?.trim() || ''
    const siteLogoUrl = resolveSiteMediaUrl(siteSettings?.logo)
    useEffect(() => {
        let isActive = true

        setSiteSettingsStatus('loading')
        getSiteSettings()
            .then((data) => {
                if (!isActive) return
                setSiteSettings(data)
                setSiteSettingsStatus('success')
            })
            .catch(() => {
                if (!isActive) return
                setSiteSettingsStatus('error')
            })

        return () => {
            isActive = false
        }
    }, [])

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-[#c99b43]/20 bg-gradient-to-br from-[#0b2141] via-[#122b52] to-[#0b2141] shadow-2xl shadow-[#0b2141]/30 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-5">
                <button type="button" onClick={() => navigate('/')} className="flex shrink-0 items-center gap-3">
                    {siteSettingsStatus === 'loading' ? (
                        <BrandSkeleton />
                    ) : siteSettingsStatus === 'success' ? (
                        <>
                            {siteLogoUrl && !brandLogoFailed ? (
                                <img
                                    src={siteLogoUrl}
                                    alt={`${siteName || 'Website'} logo`}
                                    className="h-14 w-auto max-w-[3.5rem] object-contain"
                                    onError={() => setBrandLogoFailed(true)}
                                />
                            ) : (
                                <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#c99b43]/25 bg-[#c99b43]/10 text-[#b98227] dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]">
                                    <Building2 size={26} />
                                </span>
                            )}
                            <span className="max-w-[11rem] truncate text-lg font-semibold tracking-tight text-[#f3c96d] sm:max-w-[14rem]">
                                <span className="bg-[linear-gradient(135deg,#f7db96,#c99b43)] bg-clip-text text-transparent">
                                    {siteName || 'Home'}
                                </span>
                            </span>
                        </>
                    ) : (
                        <BrandFallback label={siteName || 'Home'} />
                    )}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-200 transition hover:bg-white/10 hover:text-white lg:hidden"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1">
                    {links.map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => cn(
                                    'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                                    isActive
                                        ? 'bg-[#c99b43]/20 text-[#f3c96d] shadow-sm ring-1 ring-inset ring-[#c99b43]/40'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                )}
                                onClick={onClose}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </NavLink>
                        )
                    })}
                </div>
            </nav>

            <div className="border-t border-white/10 p-3">
                {/* User Profile Card */}
                <button
                    type="button"
                    onClick={() => {
                        navigate('/tenant/profile')
                        if (onClose) onClose()
                    }}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2.5 text-left shadow-sm transition hover:border-[#c99b43]/40 hover:bg-white/10"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] text-sm font-semibold text-slate-950 shadow-sm ring-2 ring-[#c99b43]/30">
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
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white transition group-hover:text-[#f3c96d]">
                            {fullName}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                            {user?.email || ''}
                        </p>
                        <span className="mt-0.5 inline-flex items-center rounded-full bg-[#c99b43]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#f3c96d]">
                            {user?.role || 'Tenant'}
                        </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#f3c96d]" />
                </button>

                <button
                    onClick={async () => {
                        await logout()
                    }}
                    className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-sm font-medium text-red-300 transition hover:border-red-300/50 hover:bg-red-500/25 hover:text-red-200"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
        </>
    )
}
