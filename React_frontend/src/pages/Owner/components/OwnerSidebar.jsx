import { NavLink, useNavigate } from 'react-router-dom'
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

export default function OwnerSidebar({ isOpen, onClose }) {
    const navigate = useNavigate()
    const { logout } = useAuth()

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 overflow-y-auto lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
        >

            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                    <Home className="h-4 w-4" />
                    Home
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
    )
}
