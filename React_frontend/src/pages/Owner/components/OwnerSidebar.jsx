import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../../../assets/logo.jpg'
import { getSiteSettings, resolveSiteMediaUrl } from '../../../api/siteSettingsApi'
import {
    LayoutDashboard,
    Building2,
    CalendarCheck,
    CreditCard,
    MessageSquare,
    Heart,
    BarChart3,
    Settings,
    Home,
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
    { label: 'Messages', path: '/owner/messages', icon: MessageSquare },
    { label: 'Favorites', path: '/owner/favorites', icon: Heart },
    { label: 'Reports', path: '/owner/reports', icon: BarChart3 },
    { label: 'Settings', path: '/owner/settings', icon: Settings },
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
            <span className="max-w-[11rem] truncate text-lg font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d] sm:max-w-[14rem]">
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
                    'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 overflow-y-auto lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
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
                                <span className="max-w-[11rem] truncate text-lg font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d] sm:max-w-[14rem]">
                                    <span className="bg-[linear-gradient(135deg,#0b2141,#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#f7db96,#c99b43)]">
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
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 bg-slate-50 dark:bg-slate-950">
                    <div className="space-y-1">
                        {links.map((item) => {
                            const Icon = item.icon
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        cn(
                                            'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                                            isActive
                                                ? 'bg-[#c99b43]/10 text-[#c99b43] shadow-sm dark:bg-[#c99b43]/10 dark:text-[#f3c96d]'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
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
                </nav>

                <div className="border-t border-slate-200 px-4 py-5 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={async () => {
                            await logout()
                            navigate('/login')
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    )
}
