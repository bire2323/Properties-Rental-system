import { useEffect, useState } from 'react'
import {
    Bell,
    Building2,
    CheckCircle2,
    Clock3,
    CreditCard,
    Landmark,
    LayoutTemplate,
    Lock,
    Mail,
    Menu,
    Pencil,
    Phone,
    Plus,
    Save,
    ShieldCheck,
    Trash2,
    Upload,
    UserRound,
    Wallet,
    X,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { createPaymentMethod, deletePaymentMethod as removePaymentMethod, getPaymentMethods, getSiteSettings, resolveSiteMediaUrl, updatePaymentMethod, updateSiteSettings } from '../../api/siteSettingsApi'
import { getProfile, updateProfile } from '../../api/authApi'

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
            { key: 'site_name', label: 'Website Name', value: '', type: 'text' },
            { key: 'site_tagline', label: 'Website Tagline', value: '', type: 'text' },
            { key: 'description', label: 'Website Description', value: '', type: 'textarea' },
            { key: 'contact_phone', label: 'Contact Phone', value: '', type: 'tel', icon: Phone },
            { key: 'email', label: 'Contact Email', value: '', type: 'email', icon: Mail },
            { key: 'address', label: 'Office Address', value: '', type: 'textarea', icon: Building2 },
            { key: 'copyright_text', label: 'Copyright Text', value: '', type: 'text' },
        ],
        quickInfo: [
            { label: 'Website Name', key: 'site_name' },
            { label: 'Contact Email', key: 'email' },
            { label: 'Last Updated', key: 'updated_at' },
        ],
    },
    'Security Settings': {
        title: 'Security Settings',
        fields: [
            { key: 'first_name', label: 'Admin First Name', value: '', type: 'text', icon: UserRound },
            { key: 'last_name', label: 'Admin Last Name', value: '', type: 'text', icon: UserRound },
            { key: 'email', label: 'Admin Email', value: '', type: 'email', icon: Mail },
            { key: 'phone_number', label: 'Admin Phone Number', value: '', type: 'tel', icon: Phone },
            { key: 'session_timeout_minutes', label: 'Session Timeout (minutes)', value: 30, type: 'number' },
            { key: 'login_attempts_limit', label: 'Login Attempts Limit', value: 5, type: 'number' },
        ],
        quickInfo: [
            { label: 'Admin Name', key: 'name' },
            { label: 'Admin Email', key: 'email' },
            { label: 'Admin Phone', key: 'phone_number' },
        ],
    },
    'Notification Settings': {
        title: 'Notification Settings',
        fields: [
            { key: 'new_user_registration', label: 'New User Registration', value: true, type: 'toggle' },
            { key: 'property_listing_alerts', label: 'Property Listing Alerts', value: true, type: 'toggle' },
            { key: 'payment_notifications', label: 'Payment Notifications', value: true, type: 'toggle' },
            { key: 'user_report_alerts', label: 'User Report Alerts', value: true, type: 'toggle' },
        ],
        quickInfo: [
            { label: 'Notifications Sent', value: '1,245' },
            { label: 'Email Notifications', value: 'Enabled' },
            { label: 'SMS Notifications', value: 'Disabled' },
            { label: 'Notification Frequency', value: 'Real-time' },
        ],
    },
    'Payment Settings': { title: 'Payment Settings', fields: [], quickInfo: [] },
}

const emptyPaymentMethod = {
    name: '',
    account: '',
    holder: '',
    logo: '',
    description: '',
    enabled: true,
}

function AdminSetting() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('General Settings')
    const [mobileTabsOpen, setMobileTabsOpen] = useState(false)
    const { isDark } = useTheme()
    const [siteSettings, setSiteSettings] = useState(null)
    const [adminProfile, setAdminProfile] = useState(null)
    const [passwordFields, setPasswordFields] = useState({ new_password: '', confirm_password: '' })
    const [logoFile, setLogoFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [notice, setNotice] = useState(null)
    const [paymentMethods, setPaymentMethods] = useState([])
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
    const [passwordErrors, setPasswordErrors] = useState({})
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [editingPaymentId, setEditingPaymentId] = useState(null)
    const [paymentForm, setPaymentForm] = useState(emptyPaymentMethod)
    const [paymentSettings, setPaymentSettings] = useState({ expirationHours: '', commission: '' })
    const { updateUser } = useAuth()
    const currentSettings = settingsContent[activeTab]

    useEffect(() => {
        Promise.all([getSiteSettings(), getProfile(), getPaymentMethods()])
            .then(([siteData, profileData, methods]) => {
                setSiteSettings(siteData)
                setAdminProfile(profileData.user || profileData)
                setPaymentMethods(methods)
                setPaymentSettings({ expirationHours: siteData.booking_expiration_hours ?? '', commission: siteData.owner_commission_percent ?? '' })
                setLogoPreview(resolveSiteMediaUrl(siteData.logo))
            })
            .catch((error) => setNotice({ type: 'error', message: error.message || 'Unable to load settings.' }))
            .finally(() => setLoading(false))
    }, [])

    const handleLogoChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setNotice({ type: 'error', message: 'Please select a valid image file.' })
            event.target.value = ''
            return
        }
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
        setNotice(null)
    }

    const openPaymentModal = (method = null) => {
        setEditingPaymentId(method?.id || null)
        setPaymentForm(method ? { ...method } : { ...emptyPaymentMethod })
        setPaymentModalOpen(true)
    }

    const savePaymentMethod = async (event) => {
        event.preventDefault()
        if (!paymentForm.name.trim() || !paymentForm.account.trim() || !paymentForm.holder.trim()) return
        try {
            if (editingPaymentId) {
                await updatePaymentMethod(editingPaymentId, paymentForm)
            } else {
                await createPaymentMethod(paymentForm)
            }
            const persistedMethods = await getPaymentMethods()
            setPaymentMethods(persistedMethods)
            setPaymentModalOpen(false)
            setNotice({ type: 'success', message: editingPaymentId ? 'Payment method updated.' : 'Payment method added.' })
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Unable to save payment method.' })
        }
    }

    const deletePaymentMethod = async (method) => {
        if (window.confirm(`Delete ${method.name}? This payment method will no longer be available.`)) {
            try {
                await removePaymentMethod(method.id)
                setPaymentMethods((current) => current.filter((item) => item.id !== method.id))
                setNotice({ type: 'success', message: 'Payment method deleted.' })
            } catch (error) {
                setNotice({ type: 'error', message: error.message || 'Unable to delete payment method.' })
            }
        }
    }

    const togglePaymentMethod = async (method) => {
        try {
            const updated = await updatePaymentMethod(method.id, { enabled: !method.enabled })
            setPaymentMethods((current) => current.map((item) => item.id === updated.id ? updated : item))
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Unable to update payment method status.' })
        }
    }

    const changeAdminPassword = async (event) => {
        event.preventDefault()
        const { current_password, new_password, confirm_password } = passwordForm
        const errors = {}
        if (!current_password || !new_password || !confirm_password) {
            if (!current_password) errors.current_password = 'Enter your current password.'
            if (!new_password) errors.new_password = 'Enter a new password.'
            if (!confirm_password) errors.confirm_password = 'Confirm your new password.'
            setPasswordErrors(errors)
            return
        }
        setPasswordSaving(true)
        setPasswordErrors({})
        setNotice(null)
        try {
            const data = new FormData()
            Object.entries(passwordForm).forEach(([key, value]) => data.append(key, value))
            const updated = await updateProfile(data)
            const updatedUser = updated.user || updated
            setAdminProfile(updatedUser)
            updateUser(updatedUser)
            setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
            setPasswordErrors({})
            setPasswordModalOpen(false)
            setNotice({ type: 'success', message: 'Password changed successfully.' })
        } catch (error) {
            const message = error.message || 'Unable to change password.'
            const field = message.toLowerCase().includes('current password') ? 'current_password'
                : message.toLowerCase().includes('confirmation') || message.toLowerCase().includes('match') ? 'confirm_password'
                    : 'new_password'
            setPasswordErrors({ [field]: message })
        } finally {
            setPasswordSaving(false)
        }
    }

    const handleSave = async () => {
        if (saving) return
        if (activeTab === 'General Settings' && !siteSettings) return
        if (activeTab === 'Security Settings' && !adminProfile) return
        if (activeTab === 'Notification Settings' && !siteSettings) return
        setSaving(true)
        setNotice(null)
        try {
            if (activeTab === 'General Settings') {
                const fields = settingsContent['General Settings'].fields.map((field) => field.key)
                const values = Object.fromEntries(fields.map((key) => [key, siteSettings[key] || '']))
                const updated = await updateSiteSettings(values, logoFile)
                setSiteSettings(updated)
                setLogoFile(null)
                setLogoPreview(resolveSiteMediaUrl(updated.logo))
                setNotice({ type: 'success', message: 'Site settings saved successfully.' })
            } else if (activeTab === 'Security Settings') {
                const newPassword = passwordFields.new_password.trim()
                const confirmPassword = passwordFields.confirm_password.trim()
                if (newPassword || confirmPassword) {
                    if (newPassword.length < 8) {
                        throw new Error('New password must be at least 8 characters.')
                    }
                    if (newPassword !== confirmPassword) {
                        throw new Error('New password and confirmation do not match.')
                    }
                }
                const profilePayload = {
                    first_name: (adminProfile.first_name || '').trim(),
                    last_name: (adminProfile.last_name || '').trim(),
                    email: (adminProfile.email || '').trim(),
                    phone_number: (adminProfile.phone_number || '').trim(),
                }
                if (!profilePayload.email) {
                    throw new Error('Admin email is required.')
                }
                if (profilePayload.phone_number.length > 20) {
                    throw new Error('Admin phone number must be 20 characters or fewer.')
                }
                if (newPassword) {
                    Object.assign(profilePayload, {
                        new_password: newPassword,
                        confirm_password: confirmPassword,
                    })
                }
                const updated = await updateProfile(profilePayload)
                const securityUpdated = await updateSiteSettings({
                    session_timeout_minutes: Number(siteSettings.session_timeout_minutes),
                    login_attempts_limit: Number(siteSettings.login_attempts_limit),
                })
                const updatedUser = updated.user || updated
                setAdminProfile(updatedUser)
                setPasswordFields({ new_password: '', confirm_password: '' })
                setSiteSettings(securityUpdated)
                updateUser(updatedUser)
                setNotice({ type: 'success', message: 'Security settings saved successfully.' })
            } else if (activeTab === 'Notification Settings') {
                const notificationValues = Object.fromEntries(
                    settingsContent['Notification Settings'].fields.map((field) => [field.key, Boolean(siteSettings[field.key])]),
                )
                const updated = await updateSiteSettings(notificationValues)
                setSiteSettings(updated)
                setNotice({ type: 'success', message: 'Notification settings saved successfully.' })
            } else if (activeTab === 'Payment Settings') {
                const updated = await updateSiteSettings({
                    booking_expiration_hours: Number(paymentSettings.expirationHours),
                    owner_commission_percent: Number(paymentSettings.commission),
                })
                setSiteSettings(updated)
                setNotice({ type: 'success', message: 'Payment settings saved successfully.' })
            }
        } catch (error) {
            setNotice({ type: 'error', message: error.message || 'Unable to save site settings.' })
        } finally {
            setSaving(false)
        }
    }

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
                        <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
                            <button
                                type="button"
                                aria-label="Open settings sections"
                                onClick={() => setMobileTabsOpen(true)}
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{activeTab}</span>
                        </div>
                        <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
                            <aside className={`hidden border-b lg:block lg:border-b-0 lg:border-r ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
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
                                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="w-full lg:max-w-3xl">
                                        <div className="mb-6">
                                            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentSettings.title}</h2>
                                            {activeTab === 'General Settings' && loading && (
                                                <p className="mt-2 text-xs text-slate-500">Loading site settings...</p>
                                            )}
                                        </div>

                                        {activeTab === 'Security Settings' && (
                                            <div className={`mb-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                                                <div>
                                                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Password</h3>
                                                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Change your administrator password securely.</p>
                                                </div>
                                                <button type="button" onClick={() => { setNotice(null); setPasswordErrors({}); setPasswordModalOpen(true) }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#255070] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1d405d]"><Lock className="h-4 w-4" /> Change Password</button>
                                            </div>
                                        )}

                                        {activeTab === 'General Settings' && (
                                            <div className={`mb-6 rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Website Logo</h3>
                                                        <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Choose an image to use across the website.</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border ${isDark ? 'border-slate-600 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                                            {logoPreview ? <img src={logoPreview} alt="Website logo preview" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-slate-400">No logo</span>}
                                                        </div>
                                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#255070] px-3 py-2 text-sm font-semibold text-[#255070] hover:bg-[#255070]/10">
                                                            <Upload className="h-4 w-4" />
                                                            Change Logo
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'Payment Settings' ? (
                                            <div className="space-y-4">
                                                <section className={`rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div><h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Payment Methods</h3><p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage the payment channels available to renters.</p></div>
                                                        <button type="button" onClick={() => openPaymentModal()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#255070] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1d405d]"><Plus className="h-4 w-4" /> Add Payment Method</button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {paymentMethods.map((method) => (
                                                            <div key={method.id} className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                                    <div className="flex min-w-0 items-center gap-3">
                                                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ${isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-[#255070]'}`}>{method.logo ? <img src={method.logo} alt="" className="h-full w-full object-cover" /> : method.name === 'Bank Transfer' ? <Landmark className="h-5 w-5" /> : method.name === 'Credit Card' ? <CreditCard className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}</div>
                                                                        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{method.name}</h4><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${method.enabled ? 'bg-emerald-100 text-emerald-700' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{method.enabled ? 'Enabled' : 'Disabled'}</span></div></div>
                                                                    </div>
                                                                    <div className="grid gap-3 sm:grid-cols-[minmax(150px,1fr)_auto] lg:min-w-[340px] lg:grid-cols-[1fr_auto] lg:items-center"><div><p className={`text-[10px] uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Account / Phone</p><p className={`mt-1 text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{method.account}</p><p className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{method.holder}</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => togglePaymentMethod(method)} className={`relative inline-flex h-6 w-10 items-center rounded-full ${method.enabled ? 'bg-[#255070]' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`} aria-label={`Toggle ${method.name}`}><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${method.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></button><button type="button" onClick={() => openPaymentModal(method)} className={`rounded-lg p-2 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-white'}`} aria-label={`Edit ${method.name}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => deletePaymentMethod(method)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label={`Delete ${method.name}`}><Trash2 className="h-4 w-4" /></button></div></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {!paymentMethods.length && <div className={`rounded-lg border border-dashed p-8 text-center text-xs ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>No payment methods configured. Add one to accept payments.</div>}
                                                    </div>
                                                </section>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <section className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}><div className="mb-3 flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#255070]" /><h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Booking Expiration</h3></div><label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Expire unpaid bookings after<div className="mt-2 flex items-center gap-2"><input type="number" min="1" value={paymentSettings.expirationHours} onChange={(event) => setPaymentSettings((current) => ({ ...current, expirationHours: event.target.value }))} className={`w-20 rounded-lg border px-2.5 py-1.5 text-sm ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`} /><span className="text-sm text-slate-500">hours</span></div></label><p className="mt-2 text-[11px] text-slate-500">Past this limit: <span className="font-semibold text-amber-600">Expired</span>.</p></section>
                                                    <section className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}><div className="mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-[#255070]" /><h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Owner Commission</h3></div><label className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Commission percentage<div className="relative mt-2"><input type="number" min="0" max="100" value={paymentSettings.commission} onChange={(event) => setPaymentSettings((current) => ({ ...current, commission: event.target.value }))} className={`w-full rounded-lg border px-2.5 py-1.5 pr-8 text-sm ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`} /><span className="absolute right-3 top-1.5 text-sm text-slate-400">%</span></div></label><p className="mt-2 text-[11px] text-slate-500">Deducted from each owner booking payment.</p></section>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`grid gap-5 ${activeTab === 'Notification Settings' ? 'grid-cols-2' : 'md:grid-cols-2'}`}>
                                                {currentSettings.fields.map((field, index) => {
                                                    const Icon = field.icon
                                                    const inputBase = `w-full rounded-lg border text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'} ${field.type === 'textarea' ? 'py-2.5 pr-3' : 'py-2.5 pr-3'} ${Icon ? 'pl-10' : 'pl-3'}`
                                                    const fieldValue = activeTab === 'General Settings'
                                                        ? (siteSettings?.[field.key] || '')
                                                        : activeTab === 'Notification Settings'
                                                            ? (siteSettings?.[field.key] ?? field.value)
                                                            : activeTab === 'Security Settings' && ['new_password', 'confirm_password'].includes(field.key)
                                                                ? passwordFields[field.key]
                                                                : activeTab === 'Security Settings' && ['first_name', 'last_name', 'email', 'phone_number'].includes(field.key)
                                                                    ? (adminProfile?.[field.key] || '')
                                                                    : activeTab === 'Security Settings' && field.key
                                                                        ? (siteSettings?.[field.key] ?? field.value)
                                                                        : field.value

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
                                                                        value={fieldValue}
                                                                        onChange={(event) => {
                                                                            if (activeTab === 'General Settings') setSiteSettings((current) => ({ ...current, [field.key]: event.target.value }))
                                                                            if (activeTab === 'Security Settings' && ['new_password', 'confirm_password'].includes(field.key)) setPasswordFields((current) => ({ ...current, [field.key]: event.target.value }))
                                                                            if (activeTab === 'Security Settings' && ['first_name', 'last_name', 'email', 'phone_number'].includes(field.key)) setAdminProfile((current) => ({ ...current, [field.key]: event.target.value }))
                                                                            if (activeTab === 'Security Settings' && ['session_timeout_minutes', 'login_attempts_limit'].includes(field.key)) setSiteSettings((current) => ({ ...current, [field.key]: event.target.value }))
                                                                        }}
                                                                        rows={3}
                                                                        className={`${inputBase} ${Icon ? 'pl-10' : 'pl-3'}`}
                                                                    />
                                                                </div>
                                                            ) : field.type === 'toggle' ? (
                                                                <div className="flex items-center gap-3 pt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => activeTab === 'Notification Settings' && setSiteSettings((current) => ({ ...current, [field.key]: !current?.[field.key] }))}
                                                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${fieldValue ? 'bg-green-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
                                                                    >
                                                                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${fieldValue ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                                                    </button>
                                                                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                                        {fieldValue ? 'Enabled' : 'Disabled'}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    {Icon && (
                                                                        <Icon className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                                                                    )}
                                                                    <input
                                                                        type={field.type}
                                                                        value={fieldValue}
                                                                        onChange={(event) => {
                                                                            if (activeTab === 'General Settings') setSiteSettings((current) => ({ ...current, [field.key]: event.target.value }))
                                                                            if (activeTab === 'Security Settings' && ['new_password', 'confirm_password'].includes(field.key)) setPasswordFields((current) => ({ ...current, [field.key]: event.target.value }))
                                                                            if (activeTab === 'Security Settings' && ['first_name', 'last_name', 'email', 'phone_number'].includes(field.key)) setAdminProfile((current) => ({ ...current, [field.key]: event.target.value }))
                                                                            if (activeTab === 'Security Settings' && ['session_timeout_minutes', 'login_attempts_limit'].includes(field.key)) setSiteSettings((current) => ({ ...current, [field.key]: event.target.value }))
                                                                        }}
                                                                        className={inputBase}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full lg:max-w-[320px]">
                                        {!['Notification Settings', 'Payment Settings'].includes(activeTab) && (
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
                                                            <span className={`max-w-[60%] truncate text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{activeTab === 'General Settings' ? (siteSettings?.[item.key] || '-') : activeTab === 'Security Settings' ? (item.key === 'name' ? `${adminProfile?.first_name || ''} ${adminProfile?.last_name || ''}`.trim() || '-' : adminProfile?.[item.key] || '-') : item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={handleSave}
                                                disabled={loading || saving || !['General Settings', 'Security Settings', 'Notification Settings', 'Payment Settings'].includes(activeTab)}
                                                className="inline-flex items-center gap-2 rounded-lg bg-[#255070] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d405d]"
                                            >
                                                <Save className="h-4 w-4" />
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                        {notice && (
                                            <p className={`mt-3 text-right text-xs ${notice.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`} role="status">
                                                {notice.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {paymentModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
                            <form onSubmit={savePaymentMethod} className={`w-full max-w-xl rounded-2xl border p-5 shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="payment-modal-title" className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{editingPaymentId ? 'Edit Payment Method' : 'Add Payment Method'}</h2><p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Add the details renters need to complete a payment.</p></div><button type="button" onClick={() => setPaymentModalOpen(false)} className={`rounded-lg p-2 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`} aria-label="Close payment method dialog"><X className="h-5 w-5" /></button></div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[
                                        ['name', 'Payment Method Name', 'e.g. Telebirr'],
                                        ['account', 'Account Number / Phone Number', 'e.g. +251 911 234 567'],
                                        ['holder', 'Account Holder Name', 'e.g. Property Rental System'],
                                    ].map(([key, label, placeholder]) => <label key={key} className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'} ${key === 'name' ? 'sm:col-span-2' : ''}`}>{label}<input required value={paymentForm[key]} onChange={(event) => setPaymentForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400'}`} /></label>)}
                                    <label className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs font-medium ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>Status<span className="flex items-center gap-2"><span>{paymentForm.enabled ? 'Enabled' : 'Disabled'}</span><button type="button" onClick={() => setPaymentForm((current) => ({ ...current, enabled: !current.enabled }))} className={`relative inline-flex h-6 w-10 items-center rounded-full ${paymentForm.enabled ? 'bg-[#255070]' : 'bg-slate-300'}`} aria-label="Toggle payment method status"><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${paymentForm.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></button></span></label>
                                </div>
                                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setPaymentModalOpen(false)} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#255070] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d405d]"><Save className="h-4 w-4" /> Save Payment Method</button></div>
                            </form>
                        </div>
                    )}

                    {passwordModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
                            <form onSubmit={changeAdminPassword} className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="password-modal-title" className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Change Password</h2><p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Use at least 8 characters with uppercase, lowercase, number, and special character.</p></div><button type="button" onClick={() => setPasswordModalOpen(false)} className={`rounded-lg p-2 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`} aria-label="Close password dialog"><X className="h-5 w-5" /></button></div>
                                <div className="space-y-4">
                                    {[['current_password', 'Current Password'], ['new_password', 'New Password'], ['confirm_password', 'Confirm New Password']].map(([key, label]) => <label key={key} className={`block text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{label}<input required type="password" value={passwordForm[key]} onChange={(event) => { setPasswordForm((current) => ({ ...current, [key]: event.target.value })); setPasswordErrors((current) => ({ ...current, [key]: '' })) }} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${passwordErrors[key] ? 'border-red-500' : isDark ? 'border-slate-700' : 'border-slate-200'} ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'}`} aria-invalid={Boolean(passwordErrors[key])} />{passwordErrors[key] && <span className="mt-1 block text-xs text-red-600" role="alert">{passwordErrors[key]}</span>}</label>)}
                                </div>
                                <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setPasswordModalOpen(false)} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button><button type="submit" disabled={passwordSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#255070] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d405d]"><Save className="h-4 w-4" /> {passwordSaving ? 'Changing...' : 'Change Password'}</button></div>
                            </form>
                        </div>
                    )}

                    {mobileTabsOpen && (
                        <aside className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-1rem)] overflow-y-auto border-r p-4 shadow-2xl lg:hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Settings Sections</h2>
                                <button
                                    type="button"
                                    aria-label="Close settings sections"
                                    onClick={() => setMobileTabsOpen(false)}
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            {tabs.map(({ label, icon: Icon }) => {
                                const selected = activeTab === label
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(label)
                                            setMobileTabsOpen(false)
                                        }}
                                        className={`mb-2 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-medium ${selected ? 'border-amber-200 bg-amber-100 text-amber-700' : isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{label}</span>
                                    </button>
                                )
                            })}
                        </aside>
                    )}
                </main>
            </div>
        </div>
    )
}

export default AdminSetting
