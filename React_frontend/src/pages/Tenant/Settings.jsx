import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Sun,
    Moon,
    Monitor,
    Bell,
    Shield,
    ShieldCheck,
    Smartphone,
    Mail,
    Globe,
    DollarSign,
    Calendar,
    Download,
    Trash2,
    ArrowRight,
    RefreshCw,
    Sparkles,
    Sliders,
    Layers,
    User,
    Check,
    X,
    ExternalLink,
    LogOut,
    HelpCircle,
    Info,
    Laptop,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { updateProfile, getProfile } from '../../api/authApi'

export default function Settings() {
    const { theme, setTheme, toggleTheme, isDark } = useTheme()
    const { user, updateUser, logout, loading } = useAuth()

    // Active Tab: Default to 'security' as requested by user
    const [activeTab, setActiveTab] = useState('security') // 'security' | 'appearance' | 'preferences' | 'notifications' | 'account'

    // Toast feedback notification
    const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', text: '' }

    const showNotification = (type, text) => {
        setFeedback({ type, text })
        setTimeout(() => setFeedback(null), 4500)
    }

    // ─── 1. Password & Security State ─────────────────────────────────
    const [savingPassword, setSavingPassword] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    })

    // Password validation tests
    const passwordValidation = {
        hasMinLength: passwordForm.new_password.length >= 8,
        hasUpper: /[A-Z]/.test(passwordForm.new_password),
        hasLower: /[a-z]/.test(passwordForm.new_password),
        hasNumber: /\d/.test(passwordForm.new_password),
        hasSpecial: /[^A-Za-z0-9]/.test(passwordForm.new_password),
    }

    const passwordStrengthScore = Object.values(passwordValidation).filter(Boolean).length

    // Privacy Controls (directly synced with Backend)
    const [sharePhoneWithHost, setSharePhoneWithHost] = useState(() => {
        if (typeof user?.share_phone_with_hosts === 'boolean') return user.share_phone_with_hosts
        if (typeof user?.profile?.share_phone_with_hosts === 'boolean') return user.profile.share_phone_with_hosts
        return true
    })
    const [hideEmailOnReviews, setHideEmailOnReviews] = useState(() => {
        if (typeof user?.hide_email_on_reviews === 'boolean') return user.hide_email_on_reviews
        if (typeof user?.profile?.hide_email_on_reviews === 'boolean') return user.profile.hide_email_on_reviews
        return true
    })
    const [savingPrivacy, setSavingPrivacy] = useState(false)

    // Sync when user context updates from backend
    useEffect(() => {
        if (user) {
            if (typeof user.share_phone_with_hosts === 'boolean') {
                setSharePhoneWithHost(user.share_phone_with_hosts)
            } else if (typeof user.profile?.share_phone_with_hosts === 'boolean') {
                setSharePhoneWithHost(user.profile.share_phone_with_hosts)
            }
            if (typeof user.hide_email_on_reviews === 'boolean') {
                setHideEmailOnReviews(user.hide_email_on_reviews)
            } else if (typeof user.profile?.hide_email_on_reviews === 'boolean') {
                setHideEmailOnReviews(user.profile.hide_email_on_reviews)
            }
        }
    }, [user])

    const handleToggleSharePhone = async () => {
        if (savingPrivacy) return
        const next = !sharePhoneWithHost
        setSharePhoneWithHost(next)
        setSavingPrivacy(true)
        try {
            const res = await updateProfile({ share_phone_with_hosts: next })
            if (res?.user) {
                updateUser(res.user)
            }
            showNotification(
                'success',
                next
                    ? 'Contact Info Public: Everyone can now view your phone number and email.'
                    : 'Contact Info Protected: Phone and email are now hidden from other tenants (visible only to property/vehicle owners and administrators).'
            )
        } catch (err) {
            setSharePhoneWithHost(!next)
            showNotification('error', err.message || 'Failed to update contact visibility.')
        } finally {
            setSavingPrivacy(false)
        }
    }

    const handleToggleHideEmail = async () => {
        if (savingPrivacy) return
        const next = !hideEmailOnReviews
        setHideEmailOnReviews(next)
        setSavingPrivacy(true)
        try {
            const res = await updateProfile({ hide_email_on_reviews: next })
            if (res?.user) {
                updateUser(res.user)
            }
            showNotification(
                'success',
                next
                    ? 'Email Masked on Public Reviews: Your email is hidden when leaving ratings or feedback.'
                    : 'Email Visible on Reviews: Your email is visible when leaving ratings or feedback.'
            )
        } catch (err) {
            setHideEmailOnReviews(!next)
            showNotification('error', err.message || 'Failed to update review email privacy.')
        } finally {
            setSavingPrivacy(false)
        }
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()

        if (!passwordForm.current_password) {
            showNotification('error', 'Please provide your current password.')
            return
        }

        if (passwordStrengthScore < 4) {
            showNotification('error', 'New password must meet all security requirements.')
            return
        }

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            showNotification('error', 'New password and confirmation do not match.')
            return
        }

        setSavingPassword(true)
        try {
            const result = await updateProfile({
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                confirm_password: passwordForm.confirm_password,
            })

            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_password: '',
            })

            if (result?.user) {
                updateUser(result.user)
            }

            showNotification('success', result?.message || 'Password changed successfully! Your session remains active.')
        } catch (err) {
            showNotification('error', err.message || 'Failed to update password. Please check your current password.')
        } finally {
            setSavingPassword(false)
        }
    }

    // ─── 2. Appearance & Preferences State ─────────────────────────────
    const [currency, setCurrency] = useState(() => localStorage.getItem('tenant_pref_currency') || 'ETB')
    const [language, setLanguage] = useState(() => localStorage.getItem('tenant_pref_language') || 'en')
    const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('tenant_pref_date_format') || 'DD/MM/YYYY')
    const [compactView, setCompactView] = useState(() => localStorage.getItem('tenant_pref_compact_view') === 'true')

    const handleCurrencyChange = (val) => {
        setCurrency(val)
        localStorage.setItem('tenant_pref_currency', val)
        showNotification('success', `Default currency set to ${val}`)
    }

    const handleLanguageChange = (val) => {
        setLanguage(val)
        localStorage.setItem('tenant_pref_language', val)
        showNotification('success', `Language changed to ${val === 'en' ? 'English' : 'Amharic'}`)
    }

    const handleCompactToggle = () => {
        const next = !compactView
        setCompactView(next)
        localStorage.setItem('tenant_pref_compact_view', String(next))
        showNotification('success', next ? 'Compact layout enabled' : 'Standard layout enabled')
    }

    // ─── 3. Notification Preferences State ──────────────────────────────
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('tenant_notifications')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch {
                // fallback
            }
        }
        return {
            bookingConfirmation: true,
            bookingReminder: true,
            messageAlerts: true,
            priceDropAlerts: true,
            favoriteUpdates: true,
            promotions: false,
            emailDelivery: true,
            smsDelivery: false,
            browserPush: true,
        }
    })

    const toggleNotification = (key) => {
        setNotifications((prev) => {
            const updated = { ...prev, [key]: !prev[key] }
            localStorage.setItem('tenant_notifications', JSON.stringify(updated))
            return updated
        })
    }

    const handleSaveNotifications = () => {
        localStorage.setItem('tenant_notifications', JSON.stringify(notifications))
        showNotification('success', 'Notification preferences saved successfully!')
    }

    // ─── 4. Data Export ────────────────────────────────────────────────
    const [exporting, setExporting] = useState(false)

    const handleExportData = async () => {
        setExporting(true)
        try {
            const currentProfile = await getProfile().catch(() => user)
            const exportData = {
                user: currentProfile?.user || currentProfile || user,
                exported_at: new Date().toISOString(),
                preferences: {
                    currency,
                    language,
                    theme,
                    notifications,
                    privacy: {
                        sharePhoneWithHost,
                        hideEmailOnReviews,
                    },
                },
            }
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `tenant-account-archive-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
            showNotification('success', 'Account data archive downloaded!')
        } catch (err) {
            showNotification('error', 'Failed to export account data.')
        } finally {
            setExporting(false)
        }
    }

    // Modern Switch Toggle
    const Switch = ({ checked, onChange, disabled = false }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#c99b43] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${checked ? 'bg-[#c99b43]' : 'bg-slate-200 dark:bg-slate-700'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    )

    const tabs = [
        { id: 'security', label: 'Security & Password', icon: Shield, badge: 'Protected' },
        { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
        { id: 'preferences', label: 'Regional Preferences', icon: Globe },
        { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
        { id: 'account', label: 'Account & Data', icon: User },
    ]

    if (loading && !user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c99b43] border-t-transparent shadow-md" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Toast Notification Alert */}
            {feedback && (
                <div
                    className={`flex items-center justify-between gap-3 rounded-2xl p-4 shadow-xl transition-all animate-in fade-in slide-in-from-top-3 ${feedback.type === 'success'
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/70 dark:text-emerald-200'
                            : 'border border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/70 dark:text-red-200'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {feedback.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                        )}
                        <p className="text-sm font-semibold">{feedback.text}</p>
                    </div>
                    <button
                        onClick={() => setFeedback(null)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-black/5 dark:hover:bg-white/10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#c99b43]/15 text-[#c99b43]">
                                <Sliders className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b27a23] dark:text-[#f3c96d]">
                                Tenant Control Center
                            </span>
                        </div>
                        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Account & Security Settings
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Manage password security, display themes, alert preferences, and account controls.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/tenant/profile"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#c99b43] hover:text-[#c99b43] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <User className="h-3.5 w-3.5 text-[#c99b43]" />
                            View Profile
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Settings Grid Layout (Sidebar Navigation + Content Area) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Side Navigation Panel */}
                <div className="lg:col-span-4 space-y-2">
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-4">
                        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b27a23] dark:text-[#f3c96d]">
                            Settings Menu
                        </p>
                        <nav className="space-y-1.5">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isSelected = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${isSelected
                                                ? 'bg-[#c99b43] text-white shadow-md shadow-[#c99b43]/25'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-[#c99b43]'}`} />
                                            <span>{tab.label}</span>
                                        </div>
                                        {tab.badge && (
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isSelected
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                    }`}
                                            >
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Quick Security Status Card in Sidebar */}
                    <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                    Account Protection
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Encrypted Cookie-JWT Session
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Content Panel */}
                <div className="lg:col-span-8">
                    {/* ══════════════════════════════════════════════════════════
                        TAB 1: SECURITY & PASSWORD (EXCLUSIVE TO SETTINGS)
                       ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Password Change Card */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c99b43]/15 text-[#c99b43]">
                                        <KeyRound className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Change Password
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Update your account password securely.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Current Password
                                        </label>
                                        <div className="relative mt-2">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwordForm.current_password}
                                                onChange={(e) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        current_password: e.target.value,
                                                    }))
                                                }
                                                required
                                                placeholder="Enter your current password"
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            New Password
                                        </label>
                                        <div className="relative mt-2">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordForm.new_password}
                                                onChange={(e) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        new_password: e.target.value,
                                                    }))
                                                }
                                                required
                                                placeholder="Create a strong password"
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>

                                        {/* Real-time Strength Checklist */}
                                        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Password Requirements:
                                            </p>
                                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs">
                                                <span
                                                    className={`flex items-center gap-1.5 ${passwordValidation.hasMinLength
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-400'
                                                        }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> 8+ characters
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1.5 ${passwordValidation.hasUpper
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-400'
                                                        }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Uppercase letter
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1.5 ${passwordValidation.hasLower
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-400'
                                                        }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Lowercase letter
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1.5 ${passwordValidation.hasNumber
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-400'
                                                        }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Number (0-9)
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1.5 ${passwordValidation.hasSpecial
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-400'
                                                        }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Special symbol
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confirm New Password */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Confirm New Password
                                        </label>
                                        <div className="relative mt-2">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordForm.confirm_password}
                                                onChange={(e) =>
                                                    setPasswordForm((prev) => ({
                                                        ...prev,
                                                        confirm_password: e.target.value,
                                                    }))
                                                }
                                                required
                                                placeholder="Re-enter your new password"
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={savingPassword}
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#c99b43] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#b58735] disabled:opacity-50"
                                        >
                                            {savingPassword ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    Updating Password...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="h-4 w-4" />
                                                    Update Password
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>



                            {/* Privacy Controls */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c99b43]/15 text-[#c99b43]">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                Privacy Controls
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Manage who can see your contact information on the rental platform.
                                            </p>
                                        </div>
                                    </div>
                                    {savingPrivacy && (
                                        <span className="flex items-center gap-1.5 text-xs text-[#c99b43] font-medium">
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving changes...
                                        </span>
                                    )}
                                </div>

                                <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
                                    {/* Toggle 1: Share Phone Number with Confirmed Hosts */}
                                    <div className="py-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    <Smartphone className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                            Share Phone Number with Confirmed Hosts
                                                        </h4>
                                                        {sharePhoneWithHost ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                                <Check className="h-3 w-3" /> Visible to Everyone
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                                                                <Lock className="h-3 w-3" /> Hidden from Tenants
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        Allows property and vehicle owners to contact you after booking is confirmed.
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={sharePhoneWithHost}
                                                onChange={handleToggleSharePhone}
                                                disabled={savingPrivacy}
                                            />
                                        </div>

                                        {/* Status explanation callout */}
                                        <div className={`mt-3 rounded-xl p-3 text-xs leading-relaxed border transition-colors ${
                                            sharePhoneWithHost
                                                ? 'border-emerald-200/80 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                                                : 'border-amber-200/80 bg-amber-50/60 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
                                        }`}>
                                            {sharePhoneWithHost ? (
                                                <div className="flex items-start gap-2">
                                                    <Globe className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                                                    <div>
                                                        <strong className="font-semibold">Public Visibility Active:</strong> Everyone on the platform can view your phone number and email address.
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-2">
                                                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                                    <div>
                                                        <strong className="font-semibold">Protected Privacy Active:</strong> Both your phone number and email visibility are <span className="underline font-bold">private</span> (hidden from other tenants, visible only to property/vehicle owners and administrators).
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Toggle 2: Mask Email Address on Public Reviews */}
                                    <div className="py-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                            Mask Email Address on Public Reviews
                                                        </h4>
                                                        {hideEmailOnReviews ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                                <Check className="h-3 w-3" /> Email Masked
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                Email Visible
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        Hides your direct email when you leave ratings or property feedback.
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={hideEmailOnReviews}
                                                onChange={handleToggleHideEmail}
                                                disabled={savingPrivacy}
                                            />
                                        </div>

                                        {/* Status explanation callout */}
                                        <div className={`mt-3 rounded-xl p-3 text-xs leading-relaxed border transition-colors ${
                                            hideEmailOnReviews
                                                ? 'border-emerald-200/80 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                                                : 'border-slate-200/80 bg-slate-50/60 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300'
                                        }`}>
                                            {hideEmailOnReviews ? (
                                                <div className="flex items-start gap-2">
                                                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                                                    <div>
                                                        <strong className="font-semibold">Email Concealed on Reviews:</strong> Your direct email is masked when you submit ratings or feedback on listings.
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-2">
                                                    <Mail className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
                                                    <div>
                                                        <strong className="font-semibold">Full Email Displayed:</strong> Your complete email address may appear alongside public feedback or reviews.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        TAB 2: APPEARANCE & THEME
                       ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interface Theme</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Select your preferred dashboard visual style.
                                </p>

                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTheme('light')
                                            showNotification('success', 'Light mode activated')
                                        }}
                                        className={`flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all ${theme === 'light'
                                                ? 'border-[#c99b43] bg-amber-50/20 shadow-md ring-2 ring-[#c99b43]/20'
                                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                                            }`}
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-[#c99b43] dark:bg-amber-950/40">
                                            <Sun className="h-6 w-6" />
                                        </div>
                                        <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                                            Light Theme
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Clean, bright contrast for daylight viewing.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTheme('dark')
                                            showNotification('success', 'Dark mode activated')
                                        }}
                                        className={`flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all ${theme === 'dark'
                                                ? 'border-[#c99b43] bg-amber-950/20 shadow-md ring-2 ring-[#c99b43]/20'
                                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                                            }`}
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-[#f3cd7a] dark:bg-slate-800">
                                            <Moon className="h-6 w-6" />
                                        </div>
                                        <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                                            Dark Theme
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Reduced glare and sleek aesthetics for night viewing.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Display Layout</h3>
                                <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                                    <div className="py-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Compact Card Density
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Display more listings and bookings per screen with reduced padding.
                                            </p>
                                        </div>
                                        <Switch checked={compactView} onChange={handleCompactToggle} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        TAB 3: REGIONAL PREFERENCES
                       ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Localization & Regional Preferences
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Customize currency, language, and date format for rental transactions.
                                </p>

                                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <DollarSign className="h-4 w-4 text-[#c99b43]" />
                                            <label className="text-xs font-bold uppercase tracking-wider">Currency</label>
                                        </div>
                                        <select
                                            value={currency}
                                            onChange={(e) => handleCurrencyChange(e.target.value)}
                                            className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="ETB">ETB (Ethiopian Birr)</option>
                                            <option value="USD">USD ($ Dollar)</option>
                                            <option value="EUR">EUR (€ Euro)</option>
                                        </select>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <Globe className="h-4 w-4 text-[#c99b43]" />
                                            <label className="text-xs font-bold uppercase tracking-wider">Language</label>
                                        </div>
                                        <select
                                            value={language}
                                            onChange={(e) => handleLanguageChange(e.target.value)}
                                            className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="en">English</option>
                                            <option value="am">Amharic (አማርኛ)</option>
                                        </select>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                            <Calendar className="h-4 w-4 text-[#c99b43]" />
                                            <label className="text-xs font-bold uppercase tracking-wider">Date Format</label>
                                        </div>
                                        <select
                                            value={dateFormat}
                                            onChange={(e) => {
                                                setDateFormat(e.target.value)
                                                localStorage.setItem('tenant_pref_date_format', e.target.value)
                                                showNotification('success', `Date format set to ${e.target.value}`)
                                            }}
                                            className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        TAB 4: NOTIFICATIONS & ALERTS
                       ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activity Alerts</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Configure when you receive notifications about your bookings and messages.
                                </p>

                                <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
                                    <div className="py-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Booking Confirmations & Status Updates
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Alerts when your booking request is accepted, confirmed, or completed.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.bookingConfirmation}
                                            onChange={() => toggleNotification('bookingConfirmation')}
                                        />
                                    </div>

                                    <div className="py-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Check-in Reminders
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Reminders 24 hours prior to booking start time.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.bookingReminder}
                                            onChange={() => toggleNotification('bookingReminder')}
                                        />
                                    </div>

                                    <div className="py-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Host Direct Messages
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Instant notifications when an owner or host sends a message.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.messageAlerts}
                                            onChange={() => toggleNotification('messageAlerts')}
                                        />
                                    </div>

                                    <div className="py-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Price Drop Alerts on Favorites
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Notifies you if a saved property or vehicle reduces its rental price.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notifications.priceDropAlerts}
                                            onChange={() => toggleNotification('priceDropAlerts')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveNotifications}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#c99b43] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#b58735]"
                                >
                                    <Check className="h-4 w-4" /> Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        TAB 5: ACCOUNT & DATA
                       ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'account' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Become Owner CTA Card */}
                            <div className="relative overflow-hidden rounded-3xl border border-[#c99b43]/30 bg-[linear-gradient(135deg,#0b2141_0%,#1a365d_100%)] p-6 text-white shadow-xl sm:p-8">
                                <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[#c99b43]/20 blur-3xl" />
                                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                                    <div className="space-y-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c99b43]/20 px-3 py-1 text-xs font-semibold text-[#f7db96] border border-[#c99b43]/30">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            Become a Host
                                        </span>
                                        <h3 className="text-xl sm:text-2xl font-bold">
                                            Rent Out Your Property or Vehicle
                                        </h3>
                                        <p className="max-w-xl text-xs sm:text-sm text-slate-300">
                                            Switch to an Owner account to list houses, apartments, and cars, manage tenant bookings, and start earning rental income.
                                        </p>
                                    </div>
                                    <Link
                                        to="/become-owner"
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition hover:scale-105"
                                    >
                                        Apply to Become Owner
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>

                            {/* Data Export */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Archive</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Download a copy of your personal tenant records, bookings, and preferences.
                                </p>

                                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Download Personal Archive (JSON)
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Includes profile data, contact details, and account configuration.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleExportData}
                                        disabled={exporting}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-[#c99b43] hover:text-[#c99b43] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
                                    >
                                        {exporting ? (
                                            <>
                                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                Preparing Archive...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-3.5 w-3.5" />
                                                Export JSON
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Session Signout */}
                            <div className="rounded-3xl border border-red-200 bg-red-50/30 p-6 shadow-sm dark:border-red-900/40 dark:bg-red-950/10 sm:p-8">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                    <h3 className="text-lg font-bold">Session Security</h3>
                                </div>
                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Log Out of All Sessions
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Terminates active browser cookies across all machines.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await logout()
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Log Out Everywhere
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}