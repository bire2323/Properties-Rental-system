import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    Building2,
    KeyRound,
    ShieldCheck,
    BarChart3,
    WalletCards,
    BadgeDollarSign,
    MapPinned,
    CalendarCheck2,
    Bell,
    ScrollText,
    Settings,
    LogOut,
    X,
    MessagesSquare,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { cn } from '@/lib/utils'
import logo from '../../../assets/logo.jpg'
import { getSiteSettings, resolveSiteMediaUrl } from '../../../api/siteSettingsApi'

const managementLinks = [
    { label: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin-dashboard/users', icon: Users },
    { label: 'Properties', path: '/admin-dashboard/properties', icon: Building2 },
    { label: 'Rentals', path: '/admin-dashboard/rentals', icon: KeyRound },
    { label: 'Bookings', path: '/admin-dashboard/bookings', icon: CalendarCheck2 },
    { label: 'Verification', path: '/admin-dashboard/verification', icon: ShieldCheck },
    { label: 'Reports & Complaints', path: '/admin-dashboard/reports', icon: BarChart3 },
    { label: 'Payments', path: '/admin-dashboard/payments', icon: WalletCards },
    { label: 'Subscription Plans', path: '/admin-dashboard/subscriptions', icon: BadgeDollarSign },
    { label: 'Locations', path: '/admin-dashboard/locations', icon: MapPinned },
    { label: 'Category management', path: '/admin-dashboard/categories', icon: MapPinned },
    { label: 'Testimonials', path: '/admin-dashboard/testimonials', icon: MessagesSquare },
]

const settingsLinks = [
    { label: 'Notifications', path: '/admin-dashboard/notifications', icon: Bell },
    { label: 'Audit Log', path: '/admin-dashboard/audit-log', icon: ScrollText },
    { label: 'Settings', path: '/admin-dashboard/settings', icon: Settings },
]

export default function AdminSidebar({ isOpen, onClose }) {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const [siteSettings, setSiteSettings] = useState(null)

    useEffect(() => {
        getSiteSettings().then(setSiteSettings).catch(() => { })
    }, [])

    return (
        <>
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-[#c99b43]/20 bg-gradient-to-br from-[#0b2141] via-[#122b52] to-[#0b2141] shadow-2xl shadow-[#0b2141]/30 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-6">
                    <div className="flex items-center gap-3">
                        <img src={resolveSiteMediaUrl(siteSettings?.logo) || logo} alt={`${siteSettings?.site_name || 'Website'} logo`} className="h-11 w-11 rounded-lg object-cover" />
                        <div>
                            <div className="max-w-[12rem] truncate text-lg font-semibold tracking-tight text-[#f3c96d]">
                                <span className="bg-[linear-gradient(135deg,#f7db96,#c99b43)] bg-clip-text text-transparent">
                                    {siteSettings?.site_name || 'NexaSpace'}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#c99b43]/80" />
                                Admin
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-200 transition hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-6 [scrollbar-width:thin] [scrollbar-color:#475569_#0b2141]">
                    <div className="space-y-1">
                        {managementLinks.map(({ label, path, icon: Icon }) => (
                            <NavLink
                                key={path}
                                to={path}
                                end={path === '/admin-dashboard'}
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
                                {label}
                            </NavLink>
                        ))}
                    </div>

                    <div className="mt-8 border-t border-white/10 pt-5">
                        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3c96d]">
                            Settings
                        </p>
                        <div className="space-y-1">
                            {settingsLinks.map(({ label, path, icon: Icon }) => (
                                <NavLink
                                    key={path}
                                    to={path}
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
                                    {label}
                                </NavLink>
                            ))}
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