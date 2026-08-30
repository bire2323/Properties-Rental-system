import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, CalendarCheck, Settings, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const bottomLinks = [
    { label: 'Home', path: '/owner/dashboard', icon: LayoutDashboard },
    { label: 'Properties', path: '/owner/properties', icon: Building2 },
    { label: 'Bookings', path: '/owner/bookings', icon: CalendarCheck },
    { label: 'Settings', path: '/owner/settings', icon: Settings },
]

export default function OwnerBottomNav({ onOpenMenu }) {
    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/90 px-2 pb-safe backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
            {bottomLinks.map((item) => {
                const Icon = item.icon
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] transition-colors',
                                isActive
                                    ? 'text-[#c99b43] dark:text-[#f3c96d]'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                            )
                        }
                    >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                )
            })}
            
            <button
                type="button"
                onClick={onOpenMenu}
                className="flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
            >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Menu</span>
            </button>
        </nav>
    )
}
