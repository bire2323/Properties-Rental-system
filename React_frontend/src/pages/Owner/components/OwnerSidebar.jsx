import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../../../assets/logo.jpg'
import { getSiteSettings, resolveSiteMediaUrl } from '../../../api/siteSettingsApi'
import {
    LayoutDashboard,
    Building2,
    CalendarCheck,
    CreditCard,
    Wallet,
    MessageSquare,
    Heart,
    Star,
    Car,
    Settings,
    UserRound,
    Home,
    Info,
    LogOut,
    X,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'



const links = [
    { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
    { label: 'Properties', path: '/owner/properties', icon: Building2 },
    { label: 'Bookings', path: '/owner/bookings', icon: CalendarCheck },
    { label: 'Payments', path: '/owner/payments', icon: CreditCard },
    { label: 'Subscription', path: '/owner/subscriptions', icon: Wallet },
    { label: 'Messages', path: '/owner/messages', icon: MessageSquare },
    { label: 'Favorites', path: '/owner/favorites', icon: Heart },
    { label: 'Reviews', path: '/owner/reviews', icon: Star },
    { label: 'My Profile', path: '/owner/profile', icon: UserRound },
    { label: 'Settings', path: '/owner/settings', icon: Settings },
]

const publicLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Properties', path: '/properties', icon: Building2 },
    { label: 'Vehicles', path: '/vehicles', icon: Car },
    { label: 'About Us', path: '/about', icon: Info },
]

const uniqueLinks = links.filter((link, index, items) => (
    items.findIndex((candidate) => candidate.path === link.path) === index
))

const uniquePublicLinks = publicLinks.filter((link, index, items) => (
    items.findIndex((candidate) => candidate.path === link.path) === index
))
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

export default function OwnerSidebar({ isOpen, onClose }) {
    const navigate = useNavigate()
    const { logout } = useAuth()

    const [siteSettings, setSiteSettings] = useState(null)
    const [siteSettingsStatus, setSiteSettingsStatus] = useState('loading')
    const [brandLogoFailed, setBrandLogoFailed] = useState(false)


    const siteName = siteSettings?.site_name?.trim() || ''
    const siteLogoUrl = resolveSiteMediaUrl(siteSettings?.logo)


    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

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

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-[#c99b43]/20 bg-gradient-to-br from-[#0b2141] via-[#122b52] to-[#0b2141] shadow-2xl shadow-[#0b2141]/30 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-5">
                    {/* <button type="button" onClick={() => navigate('/')} className="flex shrink-0 items-center gap-3">
                        <img
                            src={logo}
                            alt="NX Rent logo"
                            className="h-14 w-auto object-contain"
                        />
                        <span className="text-lg font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d]">
                            <span className="bg-[linear-gradient(135deg,#0b2141,#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#f7db96,#c99b43)]">
                                NexaSpace
                            </span>
                        </span>
                    </button> */}
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

                <nav className="flex-1 px-4 py-6">
                    <div className="space-y-1">
                        {uniqueLinks.map((item) => {
                            const Icon = item.icon
                            return (
                                <NavLink
                                    key={`owner-sidebar-${item.path}`}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        cn(
                                            'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                                            isActive
                                                ? 'bg-[#c99b43]/20 text-[#f3c96d] shadow-sm ring-1 ring-inset ring-[#c99b43]/40'
                                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                        )
                                    }
                                    onClick={onClose}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </NavLink>
                            )
                        })}
                    </div>

                    <div className="mt-8 border-t border-white/10 pt-5 lg:hidden">
                        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3c96d]">
                            Explore
                        </p>
                        <div className="space-y-1">
                            {uniquePublicLinks.map((item) => {
                                const Icon = item.icon
                                return (
                                    <NavLink
                                        key={`owner-public-${item.path}`}
                                        to={item.path}
                                        onClick={onClose}
                                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </NavLink>
                                )
                            })}
                        </div>
                    </div>
                </nav>

                <div className="border-t border-white/10 px-4 py-5">
                    <button
                        type="button"
                        onClick={async () => {
                            await logout()
                            navigate('/login')
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-300/50 hover:bg-red-500/25 hover:text-red-200"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    )
}
