import { useState } from 'react'
import {
    Bell,
    Building2,
    CheckCircle2,
    Clock3,
    CreditCard,
    Globe,
    LayoutTemplate,
    Lock,
    Mail,
    Phone,
    Save,
    ShieldCheck,
    UserRound,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'

const tabs = [
    { label: 'General Settings', icon: LayoutTemplate },
    { label: 'Security Settings', icon: ShieldCheck },
    { label: 'Notification Settings', icon: Bell },
    { label: 'Payment Settings', icon: CreditCard },
]

const settingsContent = {
    'General Settings': {
        title: 'General Settings',
        fields: [
            { label: 'Site Name', value: 'NexaSpace Property Rental', type: 'text' },
            { label: 'Site Tagline', value: 'Find Your Perfect Property', type: 'text' },
            { label: 'Contact Phone', value: '+251 912 345 678', type: 'tel', icon: Phone },
            { label: 'Contact Email', value: 'contact@nexaspace.com', type: 'email', icon: Mail },
            { label: 'Office Address', value: 'Addis Ababa, Ethiopia', type: 'textarea', icon: Building2 },
        ],
        quickInfo: [
            { label: 'Site Name', value: 'NexaSpace Property Rental' },
            { label: 'Site Tagline', value: 'Find Your Perfect Property' },
            { label: 'Contact Phone', value: '+251 912 345 678' },
            { label: 'Properties', value: '856' },
            { label: 'Active Rentals', value: '324' },
            { label: 'System Status', value: 'Operational' },
        ],
    },
    'Security Settings': {
        title: 'Security Settings',
        fields: [
            { label: 'Admin Password', value: '••••••••', type: 'password', icon: Lock },
            { label: 'Confirm New Password', value: '', type: 'password', icon: Lock },
            { label: 'Two-Factor Authentication', value: 'true', type: 'toggle' },
            { label: 'Session Timeout (minutes)', value: '30', type: 'number' },
            { label: 'IP Whitelist', value: '192.168.1.1, 192.168.1.2', type: 'textarea', icon: Globe },
            { label: 'Login Attempts Limit', value: '5', type: 'number' },
            { label: 'SSL Certificate Status', value: 'Valid', type: 'text', icon: ShieldCheck },
        ],
        quickInfo: [
            { label: 'Last Password Change', value: 'Jul 15, 2024' },
            { label: 'Active Sessions', value: '3' },
            { label: 'Security Level', value: 'High' },
            { label: '2FA Status', value: 'Enabled' },
        ],
    },
    'Notification Settings': {
        title: 'Notification Settings',
        fields: [
            { label: 'New User Registration', value: 'true', type: 'toggle' },
            { label: 'Property Listing Alerts', value: 'true', type: 'toggle' },
            { label: 'Payment Notifications', value: 'true', type: 'toggle' },
            { label: 'Rental Completion Alerts', value: 'true', type: 'toggle' },
            { label: 'User Report Alerts', value: 'true', type: 'toggle' },
            { label: 'Maintenance Alerts', value: 'false', type: 'toggle' },
            { label: 'Admin Email Notifications', value: 'admin@nexaspace.com', type: 'email', icon: Mail },
        ],
        quickInfo: [
            { label: 'Notifications Sent', value: '1,245' },
            { label: 'Email Notifications', value: 'Enabled' },
            { label: 'SMS Notifications', value: 'Disabled' },
            { label: 'Notification Frequency', value: 'Real-time' },
        ],
    },
    'Payment Settings': {
        title: 'Payment Settings',
        fields: [
            { label: 'Payment Gateway', value: 'Stripe', type: 'text' },
            { label: 'Stripe API Key', value: 'sk_live_••••••••', type: 'password', icon: Lock },
            { label: 'Publishable Key', value: 'pk_live_••••••••', type: 'password', icon: Lock },
            { label: 'Currency', value: 'USD', type: 'text' },
            { label: 'Transaction Fee (%)', value: '2.5', type: 'number' },
            { label: 'Minimum Payment Amount', value: '10', type: 'number' },
            { label: 'Payment Timeout (minutes)', value: '15', type: 'number' },
        ],
        quickInfo: [
            { label: 'Total Transactions', value: '5,234' },
            { label: 'Total Revenue', value: '$245,890' },
            { label: 'Failed Transactions', value: '23' },
            { label: 'Pending Payments', value: '12' },
        ],
    },
}

function AdminSetting() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('General Settings')
    const { isDark } = useTheme()
    const currentSettings = settingsContent[activeTab]

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center gap-2 text-sm">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Dashboard</span>
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
                        <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>Settings</span>
                    </div>

                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings</h1>
                    </div>

                    <div className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className="grid gap-0 xl:grid-cols-[240px_1fr]">
                            <aside className={`border-b xl:border-b-0 xl:border-r ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                                <div className="p-4">
                                    {tabs.map(({ label, icon: Icon }) => {
                                        const selected = activeTab === label

                                        return (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => setActiveTab(label)}
                                                className={[
                                                    'mb-2 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition',
                                                    selected
                                                        ? 'border-amber-200 bg-amber-100 text-amber-700'
                                                        : isDark
                                                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                                                ].join(' ')}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </aside>

                            <div className="p-6">
                                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="w-full xl:max-w-3xl">
                                        <div className="mb-6">
                                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentSettings.title}</h2>
                                        </div>

                                        <div className="grid gap-5 md:grid-cols-2">
                                            {currentSettings.fields.map((field, index) => {
                                                const Icon = field.icon
                                                const inputBase = `w-full rounded-lg border text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'} ${field.type === 'textarea' ? 'py-2.5 pr-3' : 'py-2.5 pr-3'} ${Icon ? 'pl-10' : 'pl-3'}`

                                                return (
                                                    <div key={`${field.label}-${index}`} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                                        <label className={`mb-2 block text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                            {field.label}
                                                        </label>

                                                        {field.type === 'textarea' ? (
                                                            <div className="relative">
                                                                {Icon && (
                                                                    <Icon className={`pointer-events-none absolute left-3 top-3 h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                                                                )}
                                                                <textarea
                                                                    defaultValue={field.value}
                                                                    rows={3}
                                                                    className={`${inputBase} ${Icon ? 'pl-10' : 'pl-3'}`}
                                                                />
                                                            </div>
                                                        ) : field.type === 'toggle' ? (
                                                            <div className="flex items-center gap-3 pt-1">
                                                                <button
                                                                    type="button"
                                                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${field.value === 'true' ? 'bg-green-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
                                                                >
                                                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${field.value === 'true' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                                                </button>
                                                                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                                    {field.value === 'true' ? 'Enabled' : 'Disabled'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                {Icon && (
                                                                    <Icon className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                                                                )}
                                                                <input
                                                                    type={field.type}
                                                                    defaultValue={field.value}
                                                                    className={inputBase}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="w-full xl:max-w-[320px]">
                                        <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Info</h3>
                                                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Active
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {currentSettings.quickInfo.map((item) => (
                                                    <div key={item.label} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</span>
                                                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-2 rounded-lg bg-[#255070] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d405d]"
                                            >
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AdminSetting
