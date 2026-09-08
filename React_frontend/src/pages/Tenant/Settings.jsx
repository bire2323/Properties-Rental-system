import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Sun,
    Moon,
    Shield,
    ShieldCheck,
    Smartphone,
    Mail,
    Download,
    RefreshCw,
    Sparkles,
    Sliders,
    User,
    Check,
    X,
    ArrowRight,
    LogOut,
    ExternalLink,
    RotateCcw,
    Save,
    Camera,
    CreditCard,
    Upload,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../hooks/useAuth'
import { updateProfile, getProfile } from '../../api/authApi'
import { listBookings } from '../../api/bookingApi'
import { getImageUrl } from '@/lib/utils'

export default function Settings() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { theme, setTheme } = useTheme()
    const { user, updateUser, logout, loading } = useAuth()

    // Active Navigation Tab: 'security' | 'appearance' | 'account'
    // Synchronize with ?tab= query parameter for deep links from Profile page
    const queryTab = searchParams.get('tab')
    const [activeTab, setActiveTab] = useState(() => {
        if (queryTab && ['security', 'appearance', 'account'].includes(queryTab)) {
            return queryTab
        }
        return 'security'
    })

    useEffect(() => {
        if (queryTab && ['security', 'appearance', 'account'].includes(queryTab)) {
            setActiveTab(queryTab)
        }
    }, [queryTab])

    const handleSelectTab = (tabId) => {
        setActiveTab(tabId)
        setSearchParams({ tab: tabId })
    }

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
    const passwordValidation = useMemo(() => ({
        hasMinLength: passwordForm.new_password.length >= 8,
        hasUpper: /[A-Z]/.test(passwordForm.new_password),
        hasLower: /[a-z]/.test(passwordForm.new_password),
        hasNumber: /\d/.test(passwordForm.new_password),
        hasSpecial: /[^A-Za-z0-9]/.test(passwordForm.new_password),
    }), [passwordForm.new_password])

    const passwordStrengthScore = useMemo(() => {
        return Object.values(passwordValidation).filter(Boolean).length
    }, [passwordValidation])

    // Privacy Controls (directly synced with Backend profile)
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
                    ? 'Contact Info Shared: Confirmed property and vehicle owners can view your phone number.'
                    : 'Contact Info Private: Your phone number is hidden from hosts.'
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
                    ? 'Email Masked: Your email will be masked when leaving reviews or ratings.'
                    : 'Email Visible: Your email will appear alongside public reviews.'
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
            showNotification('error', 'New password must meet at least 4 security requirements.')
            return
        }

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            showNotification('error', 'New password and confirmation password do not match.')
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

            showNotification('success', result?.message || 'Password changed successfully! Your session is secure.')
        } catch (err) {
            showNotification('error', err.message || 'Failed to update password. Please check your current password.')
        } finally {
            setSavingPassword(false)
        }
    }

    // ─── 2. Appearance & Display State ────────────────────────────────
    const [compactView, setCompactView] = useState(() => localStorage.getItem('tenant_pref_compact_view') === 'true')
    const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('tenant_pref_reduced_motion') === 'true')

    const handleCompactToggle = () => {
        const next = !compactView
        setCompactView(next)
        localStorage.setItem('tenant_pref_compact_view', String(next))
        showNotification('success', next ? 'Compact density enabled' : 'Standard density restored')
    }

    const handleReducedMotionToggle = () => {
        const next = !reducedMotion
        setReducedMotion(next)
        localStorage.setItem('tenant_pref_reduced_motion', String(next))
        showNotification('success', next ? 'Reduced motion animations enabled' : 'Full animations restored')
    }

    // Direct Light / Dark switcher (Auto/System removed as requested)
    const handleSetTheme = (newTheme) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        showNotification('success', `${newTheme === 'dark' ? 'Dark' : 'Light'} theme activated`)
    }

    // ─── 3. Account Profile Inline Editing ────────────────────────────
    const avatarInputRef = useRef(null)
    const frontInputRef = useRef(null)
    const backInputRef = useRef(null)

    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [frontIdFile, setFrontIdFile] = useState(null)
    const [frontIdPreview, setFrontIdPreview] = useState(null)
    const [backIdFile, setBackIdFile] = useState(null)
    const [backIdPreview, setBackIdPreview] = useState(null)

    const [profileForm, setProfileForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone_number: user?.phone_number || user?.profile?.phone_number || '',
        date_of_birth: user?.date_of_birth || user?.profile?.date_of_birth || '',
        address: user?.address || user?.profile?.address || '',
        city: user?.city || user?.profile?.city || '',
        country: user?.country || user?.profile?.country || '',
        national_id_number: user?.national_id_number || user?.profile?.national_id_number || '',
    })
    const [savingProfile, setSavingProfile] = useState(false)

    useEffect(() => {
        if (user) {
            setProfileForm({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone_number: user.phone_number || user.profile?.phone_number || '',
                date_of_birth: user.date_of_birth || user.profile?.date_of_birth || '',
                address: user.address || user.profile?.address || '',
                city: user.city || user.profile?.city || '',
                country: user.country || user.profile?.country || '',
                national_id_number: user.national_id_number || user.profile?.national_id_number || '',
            })
        }
    }, [user])

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            showNotification('error', 'Please select a valid image file (PNG, JPG, WEBP).')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            showNotification('error', 'Image size must be less than 5MB.')
            return
        }
        setUploadingAvatar(true)
        try {
            const formData = new FormData()
            formData.append('profile_image', file)
            const res = await updateProfile(formData)
            if (res?.user) {
                updateUser(res.user)
            } else if (res) {
                updateUser(res)
            }
            showNotification('success', 'Profile photo updated successfully!')
        } catch (err) {
            showNotification('error', err.message || 'Failed to upload photo.')
        } finally {
            setUploadingAvatar(false)
            if (avatarInputRef.current) avatarInputRef.current.value = ''
        }
    }

    const handleFrontIdChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            showNotification('error', 'Please select a valid image file (PNG, JPG, WEBP).')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            showNotification('error', 'Front ID image must be less than 10MB.')
            return
        }
        setFrontIdFile(file)
        setFrontIdPreview(URL.createObjectURL(file))
    }

    const handleBackIdChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            showNotification('error', 'Please select a valid image file (PNG, JPG, WEBP).')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            showNotification('error', 'Back ID image must be less than 10MB.')
            return
        }
        setBackIdFile(file)
        setBackIdPreview(URL.createObjectURL(file))
    }

    const currentFrontImageUrl =
        frontIdPreview ||
        (user?.id_front_image || user?.profile?.id_front_image
            ? getImageUrl(user.id_front_image || user.profile?.id_front_image)
            : null)
    const currentBackImageUrl =
        backIdPreview ||
        (user?.id_back_image || user?.profile?.id_back_image
            ? getImageUrl(user.id_back_image || user.profile?.id_back_image)
            : null)

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const formData = new FormData()
            formData.append('first_name', profileForm.first_name.trim())
            formData.append('last_name', profileForm.last_name.trim())
            formData.append('phone_number', profileForm.phone_number.trim())
            if (profileForm.date_of_birth) {
                formData.append('date_of_birth', profileForm.date_of_birth)
            } else {
                formData.append('date_of_birth', '')
            }
            formData.append('address', profileForm.address.trim())
            formData.append('city', profileForm.city.trim())
            formData.append('country', profileForm.country.trim())
            formData.append('national_id_number', profileForm.national_id_number.trim())

            if (frontIdFile) {
                formData.append('id_front_image', frontIdFile)
            }
            if (backIdFile) {
                formData.append('id_back_image', backIdFile)
            }

            const res = await updateProfile(formData)
            if (res?.user) {
                updateUser(res.user)
            } else if (res) {
                updateUser(res)
            }
            setFrontIdFile(null)
            setBackIdFile(null)
            showNotification('success', 'Profile and National ID saved successfully!')
        } catch (err) {
            showNotification('error', err.message || 'Failed to update profile.')
        } finally {
            setSavingProfile(false)
        }
    }

    // ─── 4. Account Archive & Danger Zone ─────────────────────────────
    const [exporting, setExporting] = useState(false)
    const [logoutModalOpen, setLogoutModalOpen] = useState(false)
    const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false)

    const handleExportData = async () => {
        setExporting(true)
        try {
            const [profileRes, bookingsRes] = await Promise.allSettled([
                getProfile(),
                listBookings(),
            ])

            const profileData = profileRes.status === 'fulfilled' ? profileRes.value : user
            const bookingsData = bookingsRes.status === 'fulfilled'
                ? (Array.isArray(bookingsRes.value) ? bookingsRes.value : bookingsRes.value?.results || [])
                : []

            const exportPayload = {
                account_id: user?.id,
                email: user?.email,
                role: user?.role,
                profile: profileData,
                bookings_summary: {
                    total_count: bookingsData.length,
                    active: bookingsData.filter((b) => b.status === 'confirmed' || b.status === 'approved').length,
                    records: bookingsData,
                },
                preferences: {
                    theme,
                    compactView,
                    reducedMotion,
                    privacy: {
                        sharePhoneWithHost,
                        hideEmailOnReviews,
                    },
                },
                exported_at: new Date().toISOString(),
            }

            const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `tenant-account-archive-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            showNotification('success', 'Personal account archive downloaded successfully!')
        } catch (err) {
            showNotification('error', err.message || 'Failed to export account archive.')
        } finally {
            setExporting(false)
        }
    }

    const handleClearCache = () => {
        localStorage.removeItem('tenant_pref_compact_view')
        localStorage.removeItem('tenant_pref_reduced_motion')
        setClearCacheModalOpen(false)
        showNotification('success', 'Local preferences reset. Reloading...')
        setTimeout(() => window.location.reload(), 800)
    }

    // Modern Switch Toggle
    const Switch = ({ checked, onChange, disabled = false }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#c99b43] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                checked ? 'bg-[#c99b43]' : 'bg-slate-200 dark:bg-slate-700'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    checked ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    )

    // Clean Tab Navigation (Regional Preferences and Notifications removed)
    const tabs = [
        { id: 'security', label: 'Security & Password', icon: Shield, badge: 'Protected' },
        { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
        { id: 'account', label: 'Account & Profile', icon: User },
    ]

    if (loading && !user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c99b43] border-t-transparent shadow-md" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Loading settings...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Toast Notification Alert */}
            {feedback && (
                <div
                    className={`flex items-center justify-between gap-3 rounded-2xl p-4 shadow-xl transition-all animate-in fade-in slide-in-from-top-3 ${
                        feedback.type === 'success'
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
                            Configure password security, theme styling, and personal profile preferences.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/tenant/profile"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#c99b43] hover:text-[#c99b43] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <User className="h-3.5 w-3.5 text-[#c99b43]" />
                            Full Profile
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Settings Grid Layout (Sidebar Navigation + Content Area) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Side Navigation Panel */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-4">
                        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b27a23] dark:text-[#f3c96d]">
                            Navigation
                        </p>
                        <nav className="space-y-1.5">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isSelected = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleSelectTab(tab.id)}
                                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                                            isSelected
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
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                    isSelected
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
                                    Account Status
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Active as {user?.role || 'Tenant'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Content Panel */}
                <div className="lg:col-span-8">
                    {/* ══════════════════════════════════════════════════════════
                        TAB 1: SECURITY & PASSWORD
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
                                                placeholder="Create a strong new password"
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

                                        {/* Strength Bar */}
                                        {passwordForm.new_password && (
                                            <div className="mt-2.5">
                                                <div className="flex items-center justify-between text-[11px] mb-1">
                                                    <span className="text-slate-500">Strength:</span>
                                                    <span className={`font-bold ${
                                                        passwordStrengthScore <= 2
                                                            ? 'text-red-500'
                                                            : passwordStrengthScore <= 4
                                                            ? 'text-amber-500'
                                                            : 'text-emerald-500'
                                                    }`}>
                                                        {passwordStrengthScore <= 2 ? 'Weak' : passwordStrengthScore <= 4 ? 'Good' : 'Very Strong'}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${
                                                            passwordStrengthScore <= 2
                                                                ? 'bg-red-500'
                                                                : passwordStrengthScore <= 4
                                                                ? 'bg-amber-500'
                                                                : 'bg-emerald-500'
                                                        }`}
                                                        style={{ width: `${(passwordStrengthScore / 5) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Real-time Strength Checklist */}
                                        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Password Requirements:
                                            </p>
                                            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs">
                                                <span
                                                    className={`flex items-center gap-1.5 ${
                                                        passwordValidation.hasMinLength
                                                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> 8+ characters
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1.5 ${
                                                        passwordValidation.hasUpper
                                                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Uppercase letter
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1.5 ${
                                                        passwordValidation.hasLower
                                                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Lowercase letter
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1.5 ${
                                                        passwordValidation.hasNumber
                                                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Number (0-9)
                                                </span>
                                                <span
                                                    className={`flex items-center gap-1.5 ${
                                                        passwordValidation.hasSpecial
                                                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
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
                                                Privacy & Contact Visibility
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Control whether property owners and review readers can view your contact details.
                                            </p>
                                        </div>
                                    </div>
                                    {savingPrivacy && (
                                        <span className="flex items-center gap-1.5 text-xs text-[#c99b43] font-medium">
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                                        </span>
                                    )}
                                </div>

                                <div className="mt-6 divide-y divide-slate-100 dark:divide-slate-800">
                                    {/* Toggle 1: Share Phone with Confirmed Hosts */}
                                    <div className="py-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    <Smartphone className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                            Share Phone with Confirmed Hosts
                                                        </h4>
                                                        {sharePhoneWithHost ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                                <Check className="h-3 w-3" /> Enabled
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                <Lock className="h-3 w-3" /> Private
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        Allows landlords and vehicle owners to contact you after your booking is approved or confirmed.
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={sharePhoneWithHost}
                                                onChange={handleToggleSharePhone}
                                                disabled={savingPrivacy}
                                            />
                                        </div>
                                    </div>

                                    {/* Toggle 2: Mask Email on Public Reviews */}
                                    <div className="py-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3.5">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                            Mask Email on Public Reviews
                                                        </h4>
                                                        {hideEmailOnReviews ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                                <Check className="h-3 w-3" /> Masked
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                Visible
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        Hides your direct email address when you publish reviews or ratings on rentals.
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={hideEmailOnReviews}
                                                onChange={handleToggleHideEmail}
                                                disabled={savingPrivacy}
                                            />
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
                            {/* Theme Selection: Clean 2-column Light vs Dark */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interface Theme</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Switch between clean daylight and sleek night mode.
                                </p>

                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Light Mode */}
                                    <button
                                        type="button"
                                        onClick={() => handleSetTheme('light')}
                                        className={`flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all ${
                                            theme === 'light'
                                                ? 'border-[#c99b43] bg-amber-50/40 shadow-md ring-2 ring-[#c99b43]/20'
                                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-[#c99b43] dark:bg-amber-950/40">
                                                <Sun className="h-6 w-6" />
                                            </div>
                                            {theme === 'light' && (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c99b43] text-white">
                                                    <Check className="h-3.5 w-3.5" />
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                                            Light Theme
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Crisp white background with warm gold highlights for daytime use.
                                        </p>
                                    </button>

                                    {/* Dark Mode */}
                                    <button
                                        type="button"
                                        onClick={() => handleSetTheme('dark')}
                                        className={`flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all ${
                                            theme === 'dark'
                                                ? 'border-[#c99b43] bg-[#2a2215]/30 shadow-md ring-2 ring-[#c99b43]/20'
                                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-[#f3cd7a] dark:bg-slate-800">
                                                <Moon className="h-6 w-6" />
                                            </div>
                                            {theme === 'dark' && (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c99b43] text-white">
                                                    <Check className="h-3.5 w-3.5" />
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                                            Dark Theme
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Sleek slate-950 background with reduced eye fatigue and modern luxury styling.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Display & Layout Density */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Display & Comfort</h3>
                                <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                                    <div className="py-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Compact Card Density
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Display more rental cards per screen with tighter padding.
                                            </p>
                                        </div>
                                        <Switch checked={compactView} onChange={handleCompactToggle} />
                                    </div>

                                    <div className="py-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Reduce Interface Animations
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Minimize motion effects and transitions for smoother rendering.
                                            </p>
                                        </div>
                                        <Switch checked={reducedMotion} onChange={handleReducedMotionToggle} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        TAB 3: ACCOUNT & PROFILE (Full editing + archive + danger zone)
                       ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'account' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Inline Profile Quick-Edit Card */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c99b43]/15 text-[#c99b43]">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                Personal Details
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Update your contact, location, and display details.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-[#c99b43]/15 px-3 py-1 text-xs font-bold text-[#b98227] dark:text-[#f3c96d] capitalize">
                                        {user?.role || 'Tenant'}
                                    </span>
                                </div>

                                <div className="mt-6 space-y-6">
                                    {/* Avatar Photo Management */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-slate-100 pb-6 dark:border-slate-800">
                                        <div className="relative">
                                            <div className="h-20 w-20 rounded-full bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] p-0.5 shadow-md ring-2 ring-white dark:ring-slate-900">
                                                <div className="h-full w-full rounded-full overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-xl text-slate-900 dark:text-white">
                                                    {user?.profile_image ? (
                                                        <img
                                                            src={getImageUrl(user.profile_image)}
                                                            alt={user?.first_name || 'Avatar'}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        user?.first_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'T'
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                                title="Upload new profile picture"
                                                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#0b2141] text-[#f7db96] shadow-sm transition hover:bg-[#c99b43] hover:text-white dark:border-slate-900 dark:bg-[#c99b43] dark:text-white disabled:opacity-60"
                                            >
                                                {uploadingAvatar ? (
                                                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                                                ) : (
                                                    <Camera className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            <input
                                                ref={avatarInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Profile Photo
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Upload a clear portrait photo (PNG, JPG, or WEBP up to 5MB).
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#c99b43] hover:text-[#c99b43] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                                            >
                                                <Camera className="h-3 w-3 text-[#c99b43]" />
                                                {uploadingAvatar ? 'Uploading Photo...' : 'Change Photo'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Profile Form */}
                                    <form onSubmit={handleSaveProfile} className="space-y-5">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileForm.first_name}
                                                    onChange={(e) =>
                                                        setProfileForm((prev) => ({ ...prev, first_name: e.target.value }))
                                                    }
                                                    placeholder="Your first name"
                                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileForm.last_name}
                                                    onChange={(e) =>
                                                        setProfileForm((prev) => ({ ...prev, last_name: e.target.value }))
                                                    }
                                                    placeholder="Your last name"
                                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Email Address (Read-only)
                                                </label>
                                                <div className="relative mt-2">
                                                    <input
                                                        type="email"
                                                        value={user?.email || ''}
                                                        disabled
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-sm text-slate-500 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Phone Number
                                                </label>
                                                <div className="relative mt-2">
                                                    <input
                                                        type="tel"
                                                        value={profileForm.phone_number}
                                                        onChange={(e) =>
                                                            setProfileForm((prev) => ({ ...prev, phone_number: e.target.value }))
                                                        }
                                                        placeholder="+251 9..."
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Date of Birth
                                                </label>
                                                <div className="relative mt-2">
                                                    <input
                                                        type="date"
                                                        value={profileForm.date_of_birth}
                                                        onChange={(e) =>
                                                            setProfileForm((prev) => ({ ...prev, date_of_birth: e.target.value }))
                                                        }
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Street Address
                                                </label>
                                                <div className="relative mt-2">
                                                    <input
                                                        type="text"
                                                        value={profileForm.address}
                                                        onChange={(e) =>
                                                            setProfileForm((prev) => ({ ...prev, address: e.target.value }))
                                                        }
                                                        placeholder="Street, Sub-city, House #"
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    City
                                                </label>
                                                <div className="relative mt-2">
                                                    <input
                                                        type="text"
                                                        value={profileForm.city}
                                                        onChange={(e) =>
                                                            setProfileForm((prev) => ({ ...prev, city: e.target.value }))
                                                        }
                                                        placeholder="Addis Ababa"
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    Country
                                                </label>
                                                <div className="relative mt-2">
                                                    <input
                                                        type="text"
                                                        value={profileForm.country}
                                                        onChange={(e) =>
                                                            setProfileForm((prev) => ({ ...prev, country: e.target.value }))
                                                        }
                                                        placeholder="Ethiopia"
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* National ID & Verification Document Section */}
                                        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
                                            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c99b43]/15 text-[#c99b43]">
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                                        National ID Verification (FAN)
                                                    </h4>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        Add your Fayda National ID number and upload front and back card images for verified renter status.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* National ID Number (FAN) */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                    National ID Number (FAN Number)
                                                </label>
                                                <div className="relative mt-2">
                                                    <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={profileForm.national_id_number}
                                                        onChange={(e) =>
                                                            setProfileForm((prev) => ({ ...prev, national_id_number: e.target.value }))
                                                        }
                                                        placeholder="e.g. 1234 5678 9012 3456"
                                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-mono"
                                                    />
                                                </div>
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    Official Ethiopian Fayda FAN number or government-issued ID card identifier.
                                                </p>
                                            </div>

                                            {/* Front & Back Document Upload Boxes */}
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                                                {/* Front ID Card */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                            Front of National ID
                                                        </label>
                                                        {currentFrontImageUrl && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <Check className="h-3 w-3" /> Attached
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-3.5 transition hover:border-[#c99b43] dark:border-slate-800 dark:bg-slate-950">
                                                        {currentFrontImageUrl ? (
                                                            <div className="w-full space-y-2.5">
                                                                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                                                                    <img
                                                                        src={currentFrontImageUrl}
                                                                        alt="Front of National ID"
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                    <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                                                                        Front
                                                                    </span>
                                                                    {frontIdFile && (
                                                                        <span className="absolute right-2 top-2 rounded-md bg-[#c99b43] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                                                            New
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => frontInputRef.current?.click()}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#c99b43] hover:text-[#c99b43] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                                                    >
                                                                        <Upload className="h-3 w-3 text-[#c99b43]" />
                                                                        Replace Front
                                                                    </button>
                                                                    {frontIdFile && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFrontIdFile(null)
                                                                                setFrontIdPreview(null)
                                                                                if (frontInputRef.current) frontInputRef.current.value = ''
                                                                            }}
                                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                                        >
                                                                            <X className="h-3 w-3" /> Reset
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={() => frontInputRef.current?.click()}
                                                                className="flex cursor-pointer flex-col items-center justify-center py-6 text-center w-full"
                                                            >
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c99b43]/15 text-[#c99b43]">
                                                                    <Upload className="h-5 w-5" />
                                                                </div>
                                                                <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                    Upload Front ID Image
                                                                </p>
                                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                                    PNG, JPG, or WEBP up to 10MB
                                                                </p>
                                                            </div>
                                                        )}
                                                        <input
                                                            ref={frontInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleFrontIdChange}
                                                            className="hidden"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Back ID Card */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                                            Back of National ID
                                                        </label>
                                                        {currentBackImageUrl && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                <Check className="h-3 w-3" /> Attached
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-3.5 transition hover:border-[#c99b43] dark:border-slate-800 dark:bg-slate-950">
                                                        {currentBackImageUrl ? (
                                                            <div className="w-full space-y-2.5">
                                                                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                                                                    <img
                                                                        src={currentBackImageUrl}
                                                                        alt="Back of National ID"
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                    <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                                                                        Back
                                                                    </span>
                                                                    {backIdFile && (
                                                                        <span className="absolute right-2 top-2 rounded-md bg-[#c99b43] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                                                            New
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => backInputRef.current?.click()}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#c99b43] hover:text-[#c99b43] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                                                    >
                                                                        <Upload className="h-3 w-3 text-[#c99b43]" />
                                                                        Replace Back
                                                                    </button>
                                                                    {backIdFile && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setBackIdFile(null)
                                                                                setBackIdPreview(null)
                                                                                if (backInputRef.current) backInputRef.current.value = ''
                                                                            }}
                                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                                        >
                                                                            <X className="h-3 w-3" /> Reset
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={() => backInputRef.current?.click()}
                                                                className="flex cursor-pointer flex-col items-center justify-center py-6 text-center w-full"
                                                            >
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c99b43]/15 text-[#c99b43]">
                                                                    <Upload className="h-5 w-5" />
                                                                </div>
                                                                <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                    Upload Back ID Image
                                                                </p>
                                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                                    PNG, JPG, or WEBP up to 10MB
                                                                </p>
                                                            </div>
                                                        )}
                                                        <input
                                                            ref={backInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleBackIdChange}
                                                            className="hidden"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <Link
                                                to="/tenant/profile"
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b98227] hover:underline dark:text-[#f3c96d]"
                                            >
                                                View Display Profile <ExternalLink className="h-3 w-3" />
                                            </Link>

                                            <button
                                                type="submit"
                                                disabled={savingProfile}
                                                className="inline-flex items-center gap-2 rounded-xl bg-[#c99b43] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#b58735] disabled:opacity-50"
                                            >
                                                {savingProfile ? (
                                                    <>
                                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                        Saving Details...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-3.5 w-3.5" />
                                                        Save Profile Details
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Become Owner CTA Banner */}
                            {user?.role !== 'owner' && user?.role !== 'admin' && (
                                <div className="relative overflow-hidden rounded-3xl border border-[#c99b43]/30 bg-gradient-to-br from-[#0b2141] via-[#122b52] to-[#0b2141] p-6 text-white shadow-xl sm:p-8">
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
                                                Upgrade to an Owner account to list houses, apartments, or vehicles, manage tenant requests, and earn rental income.
                                            </p>
                                        </div>
                                        <Link
                                            to="/become-owner"
                                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f3cd7a] to-[#c68c2b] px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition hover:scale-105"
                                        >
                                            Apply to Become Owner
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Data Export */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Archive</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Download a copy of your personal tenant records, bookings history, and security preferences.
                                </p>

                                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Download Personal Archive (JSON)
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Includes profile data, contact details, active bookings, and security settings.
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

                            {/* Cache & Danger Zone */}
                            <div className="rounded-3xl border border-red-200 bg-red-50/30 p-6 shadow-sm dark:border-red-900/40 dark:bg-red-950/10 sm:p-8 space-y-5">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    <h3 className="text-lg font-bold">Session & Data Controls</h3>
                                </div>

                                <div className="divide-y divide-red-200/60 dark:divide-red-900/40">
                                    {/* Clear Cache */}
                                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Reset Local Preferences
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Clears locally cached theme and card density back to default.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setClearCacheModalOpen(true)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Reset Preferences
                                        </button>
                                    </div>

                                    {/* Sign Out */}
                                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Log Out of All Sessions
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Terminates active browser sessions and requires password login next time.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLogoutModalOpen(true)}
                                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                                        >
                                            <LogOut className="h-3.5 w-3.5" />
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CONFIRMATION MODAL: LOG OUT */}
            <AnimatePresence>
                {logoutModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setLogoutModalOpen(false)}
                            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                                    <LogOut className="h-6 w-6" />
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                                    Confirm Session Logout
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                    Are you sure you want to sign out of your account? You will need to log back in to manage your bookings and rentals.
                                </p>

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setLogoutModalOpen(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setLogoutModalOpen(false)
                                            await logout()
                                            navigate('/login')
                                        }}
                                        className="rounded-xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                                    >
                                        Log Out Now
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* CONFIRMATION MODAL: RESET PREFERENCES */}
            <AnimatePresence>
                {clearCacheModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setClearCacheModalOpen(false)}
                            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs"
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                    <RotateCcw className="h-6 w-6" />
                                </div>

                                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                                    Reset Local Preferences?
                                </h3>
                                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                    This will reset your theme and card density back to their platform defaults.
                                </p>

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setClearCacheModalOpen(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClearCache}
                                        className="rounded-xl bg-[#c99b43] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#b08838]"
                                    >
                                        Confirm Reset
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}