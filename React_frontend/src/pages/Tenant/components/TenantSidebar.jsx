import { NavLink } from 'react-router-dom'
import { Home, Bookmark, Calendar, CreditCard, MessageSquare, User, Settings, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import logo from '../../../assets/logo.jpg'

const links = [
    { label: 'Dashboard', path: '/tenant/dashboard', icon: Home },
    { label: 'Bookings', path: '/tenant/bookings', icon: Calendar },
    { label: 'Favorites', path: '/tenant/favorites', icon: Bookmark },
    { label: 'Payments', path: '/tenant/payments', icon: CreditCard },
    { label: 'Messages', path: '/tenant/messages', icon: MessageSquare },
    { label: 'Profile', path: '/tenant/profile', icon: User },
    { label: 'Settings', path: '/tenant/settings', icon: Settings },
]

export default function TenantSidebar({ isOpen, onClose }) {
    const { logout } = useAuth()
    const navigate = useNavigate()
    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 overflow-y-auto lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
        >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <button type="button" onClick={() => navigate('/')} className="flex shrink-0 items-center gap-3">
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
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900 lg:hidden"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-6 bg-slate-50 dark:bg-slate-950">
                <div className="space-y-1">
                    {links.map((item) => {
                        const Icon = item.icon
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => cn('group flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition', isActive ? 'bg-[#c99b43]/10 text-[#c99b43]' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900')}
                                onClick={onClose}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </NavLink>
                        )
                    })}
                </div>
            </nav>

            <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                <button
                    onClick={async () => {
                        await logout()
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200"
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </aside>
    )
}
