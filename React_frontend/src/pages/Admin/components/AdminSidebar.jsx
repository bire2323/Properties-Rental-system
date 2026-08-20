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
    MapPinned,
    FolderTree,
    Bell,
    Settings,
    LogOut,
    X,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useTheme } from '../../../hooks/useTheme'
import { cn } from '@/lib/utils'
import logo from '../../../assets/logo.jpg'
import { getSiteSettings, resolveSiteMediaUrl } from '../../../api/siteSettingsApi'

const managementLinks = [
    { label: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin-dashboard/users', icon: Users },
    { label: 'Properties', path: '/admin-dashboard/properties', icon: Building2 },
    { label: 'Rentals', path: '/admin-dashboard/rentals', icon: KeyRound },
    { label: 'Verification', path: '/admin-dashboard/verification', icon: ShieldCheck },
    { label: 'Reports & Complaints', path: '/admin-dashboard/reports', icon: BarChart3 },
    { label: 'Payments', path: '/admin-dashboard/payments', icon: WalletCards },
]

const settingsLinks = [
    { label: 'Notifications', path: '/admin-dashboard/notifications', icon: Bell },
    { label: 'Settings', path: '/admin-dashboard/settings', icon: Settings },
]

export default function AdminSidebar({ isOpen, onClose }) {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const { isDark } = useTheme()
    const [siteSettings, setSiteSettings] = useState(null)

    useEffect(() => {
        getSiteSettings().then(setSiteSettings).catch(() => { })
    }, [])

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
        >
            <div className={`flex items-center justify-between border-b px-5 py-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <img src={resolveSiteMediaUrl(siteSettings?.logo) || logo} alt={`${siteSettings?.site_name || 'Website'} logo`} className="h-11 w-11 rounded-lg object-cover" />
                    <div>
                        <div className={`text-xl font-bold leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{siteSettings?.site_name || 'NexaSpace'}</div>
                        <div className={`mt-1 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Property Rental
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition lg:hidden ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                >
                    <X size={18} />
                </button>
            </div>

            <nav className={`flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin] ${isDark ? '[scrollbar-color:#475569_#1e293b]' : '[scrollbar-color:#d9dfe8_#f8fafc]'}`}>
                <div className={`mb-5 px-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Management
                </div>

                <div className="space-y-1.5">
                    {managementLinks.map(({ label, path, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/admin-dashboard'}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                                    isActive
                                        ? 'text-white'
                                        : isDark
                                            ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                )
                            }
                            style={({ isActive }) => ({
                                ...(isActive && {
                                    backgroundColor: '#255070',
                                    boxShadow: '0 10px 15px -3px rgba(37, 80, 112, 0.2)'
                                })
                            })}
                            onClick={onClose}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className={`mt-8 mb-4 px-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Settings
                </div>

                <div className="space-y-1.5">
                    {settingsLinks.map(({ label, path, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                                    isActive
                                        ? 'text-white'
                                        : isDark
                                            ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                )
                            }
                            style={({ isActive }) => ({
                                ...(isActive && {
                                    backgroundColor: '#255070',
                                    boxShadow: '0 10px 15px -3px rgba(37, 80, 112, 0.2)'
                                })
                            })}
                            onClick={onClose}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            <style>{`
                nav::-webkit-scrollbar {
                    width: 7px;
                }
                nav::-webkit-scrollbar-track {
                    background: transparent;
                }
                nav::-webkit-scrollbar-thumb {
                    background: ${isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.5)'};
                    border-radius: 9999px;
                }
                nav::-webkit-scrollbar-thumb:hover {
                    background: ${isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(203, 213, 225, 0.8)'};
                }
            `}</style>

            <div className={`border-t px-3 py-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                    type="button"
                    onClick={async () => {
                        await logout()
                        navigate('/login')
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isDark ? 'text-slate-400 hover:bg-red-900/20 hover:text-red-400' : 'text-slate-600 hover:bg-red-50 hover:text-red-600'}`}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
    )
}
