import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShieldCheck,
    ShieldAlert,
    Camera,
    CheckCircle2,
    AlertCircle,
    Save,
    Bookmark,
    Layers,
    Clock,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    Sparkles,
    Settings as SettingsIcon,
    ArrowRight,
    Upload,
    X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getProfile, updateProfile } from '../../api/authApi'
import { listBookings } from '../../api/bookingApi'
import { getFavorites } from '../../api/property/propertyApi'
import { getImageUrl } from '@/lib/utils'

function formatDate(dateString) {
    if (!dateString) return 'N/A'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return 'N/A'
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date)
    } catch {
        return 'N/A'
    }
}

export default function Profile() {
    const { user: authUser, updateUser, loading: authLoading } = useAuth()
    const fileInputRef = useRef(null)

    // Primary data state: initialize immediately from authUser so page NEVER renders blank
    const [profile, setProfile] = useState(authUser || {})
    const [bookings, setBookings] = useState([])
    const [favorites, setFavorites] = useState([])
    const [isFetching, setIsFetching] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [imagePreview, setImagePreview] = useState(null)

    // Form inputs state
    const [formData, setFormData] = useState({
        first_name: authUser?.first_name || '',
        last_name: authUser?.last_name || '',
        email: authUser?.email || '',
        phone_number: authUser?.phone_number || authUser?.profile?.phone_number || '',
        date_of_birth: authUser?.date_of_birth || authUser?.profile?.date_of_birth || '',
        address: authUser?.address || authUser?.profile?.address || '',
        city: authUser?.city || authUser?.profile?.city || '',
        country: authUser?.country || authUser?.profile?.country || '',
    })

    // Feedback notification banner
    const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', text: '' }

    const showNotification = (type, text) => {
        setFeedback({ type, text })
        setTimeout(() => setFeedback(null), 5000)
    }

    // Sync form data whenever profile object updates
    const populateFormData = (userData) => {
        if (!userData) return
        setFormData({
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            phone_number: userData.phone_number || userData.profile?.phone_number || '',
            date_of_birth: userData.date_of_birth || userData.profile?.date_of_birth || '',
            address: userData.address || userData.profile?.address || '',
            city: userData.city || userData.profile?.city || '',
            country: userData.country || userData.profile?.country || '',
        })
    }

    // Load full data from backend on mount and when authUser changes
    useEffect(() => {
        loadBackendData()
    }, [authUser?.id])

    // Update form and profile if authUser changes
    useEffect(() => {
        if (authUser) {
            setProfile((prev) => ({ ...authUser, ...prev, id: authUser.id || prev?.id }))
            populateFormData(authUser)
        }
    }, [authUser])

    const loadBackendData = async () => {
        setIsFetching(true)
        try {
            // Fetch profile directly from backend
            const profileData = await getProfile().catch(() => null)
            if (profileData) {
                const userObj = profileData.user || profileData
                setProfile(userObj)
                populateFormData(userObj)
                if (updateUser) updateUser(userObj)
            } else if (authUser) {
                setProfile(authUser)
                populateFormData(authUser)
            }

            // Fetch bookings directly
            listBookings()
                .then((res) => {
                    const list = res?.results || res || []
                    if (Array.isArray(list)) setBookings(list)
                })
                .catch(() => { })

            // Fetch favorites directly
            getFavorites()
                .then((res) => {
                    const list = res?.results || res || []
                    if (Array.isArray(list)) setFavorites(list)
                })
                .catch(() => { })
        } catch (err) {
            console.error('Error fetching tenant details:', err)
        } finally {
            setIsFetching(false)
        }
    }

    // Handle Image file selection & instant upload
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            showNotification('error', 'Please choose an image file (PNG, JPG, JPEG, WEBP).')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            showNotification('error', 'Image size must be less than 5MB.')
            return
        }

        const preview = URL.createObjectURL(file)
        setImagePreview(preview)

        setUploadingAvatar(true)
        try {
            const uploadPayload = new FormData()
            uploadPayload.append('profile_image', file)

            const response = await updateProfile(uploadPayload)
            const updated = response.user || response
            setProfile(updated)
            if (updateUser) updateUser(updated)
            showNotification('success', 'Profile photo updated successfully!')
        } catch (err) {
            setImagePreview(null)
            showNotification('error', err.message || 'Failed to upload photo.')
        } finally {
            setUploadingAvatar(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Handle saving form details to backend
    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        setFeedback(null)

        try {
            // Build payload with clean values
            const payload = {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                phone_number: formData.phone_number.trim(),
                date_of_birth: formData.date_of_birth ? formData.date_of_birth : null,
                address: formData.address.trim(),
                city: formData.city.trim(),
                country: formData.country.trim(),
            }

            const response = await updateProfile(payload)
            const updated = response.user || response

            setProfile(updated)
            populateFormData(updated)
            if (updateUser) updateUser(updated)
            showNotification('success', 'Profile information updated successfully!')
        } catch (err) {
            showNotification('error', err.message || 'Failed to update profile. Please verify your inputs.')
        } finally {
            setSavingProfile(false)
        }
    }

    // Computed display properties
    const activeUser = profile?.email ? profile : (authUser || {})
    const avatarUrl = imagePreview || (activeUser?.profile_image ? getImageUrl(activeUser.profile_image) : null)
    const initial = activeUser?.first_name ? activeUser.first_name.charAt(0).toUpperCase() : (activeUser?.email?.charAt(0).toUpperCase() || 'T')
    const displayFullName = [activeUser?.first_name, activeUser?.last_name].filter(Boolean).join(' ') || activeUser?.email?.split('@')[0] || 'Tenant'
    const memberSince = formatDate(activeUser?.created_at || activeUser?.date_joined)

    const totalBookingsCount = bookings.length
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length
    const pendingCount = bookings.filter((b) => b.status === 'pending').length
    const favoritesCount = favorites.length

    if (authLoading && !authUser && !profile?.email) {
        return (
            <div className="space-y-6 pb-20 animate-pulse">
                <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                    ))}
                </div>
                <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Notification Alert Banner */}
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

            {/* Profile Hero Card */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                {/* Gradient Header Banner */}
                <div className="h-32 bg-[linear-gradient(135deg,#0b2141_0%,#1e3a63_50%,#c99b43_100%)] dark:bg-[linear-gradient(135deg,#05101e_0%,#0f223d_50%,#916e25_100%)] relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,155,67,0.25),transparent_60%)]" />
                    <div className="absolute right-6 top-4 flex items-center gap-2">
                        {isFetching ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                                <RefreshCw className="h-3 w-3 animate-spin" /> Syncing...
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                <Sparkles className="h-3.5 w-3.5 text-[#f7db96]" />
                                Tenant Profile
                            </span>
                        )}
                    </div>
                </div>

                <div className="px-6 pb-6 pt-0 sm:px-8">
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between -mt-16">
                        {/* Avatar and Basic Details */}
                        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                            {/* Avatar with Camera Trigger */}
                            <div className="relative group self-start">
                                <div className="h-28 w-28 rounded-full bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] p-1 shadow-xl ring-4 ring-white dark:ring-slate-900">
                                    <div className="h-full w-full rounded-full overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-3xl text-slate-900 dark:text-white">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={displayFullName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            initial
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    title="Upload new profile picture"
                                    className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#0b2141] text-[#f7db96] shadow-md transition hover:scale-110 hover:bg-[#c99b43] hover:text-white dark:border-slate-900 dark:bg-[#c99b43] dark:text-white disabled:opacity-60"
                                >
                                    {uploadingAvatar ? (
                                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Name, Badges & Email */}
                            <div className="space-y-1.5 pt-2 sm:pt-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        {displayFullName}
                                    </h1>
                                    <span className="inline-flex items-center rounded-full bg-[#c99b43]/15 px-2.5 py-0.5 text-xs font-semibold text-[#b27a23] dark:text-[#f3c96d]">
                                        Tenant
                                    </span>
                                    {activeUser?.is_verified ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                            <ShieldAlert className="h-3.5 w-3.5" />
                                            Active Renter
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {activeUser?.email || 'No email registered'}
                                </p>
                            </div>
                        </div>

                        {/* Direct Settings Shortcut */}
                        <div className="flex items-center gap-3">
                            <Link
                                to="/tenant/settings"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#c99b43] hover:text-[#c99b43] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <SettingsIcon className="h-4 w-4 text-[#c99b43]" />
                                Account Settings
                            </Link>
                        </div>
                    </div>

                    {/* Metadata Summary Pills */}
                    <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-slate-800/80 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-[#c99b43]" />
                            {activeUser?.email || 'Not provided'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#c99b43]" />
                            {formData.phone_number || 'No phone set'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#c99b43]" />
                            {[formData.city, formData.country].filter(Boolean).join(', ') || 'Location not set'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#c99b43]" />
                            Member since {memberSince}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Activity Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Bookings</p>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c99b43]/10 text-[#c99b43]">
                            <Layers className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalBookingsCount}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="text-emerald-600 font-semibold">{confirmedCount} confirmed</span>
                        {pendingCount > 0 && ` • ${pendingCount} pending`}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saved Favorites</p>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/40">
                            <Bookmark className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{favoritesCount}</p>
                    <Link to="/tenant/favorites" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#c99b43] hover:underline">
                        View favorites <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account Role</p>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b2141]/10 text-[#0b2141] dark:bg-white/10 dark:text-[#f3c96d]">
                            <User className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold capitalize text-slate-900 dark:text-white">
                        {activeUser?.role || 'Tenant'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Standard Renter Account</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account Status</p>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {activeUser?.is_verified ? 'Verified' : 'Active'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Good Standing</p>
                </div>
            </div>

            {/* Editable Profile Information Form Directly Integrated with Backend */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Personal Information & Details
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Directly update your personal details and location. Changes save directly to the database.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* First Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                                placeholder="First Name"
                                required
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                                placeholder="Last Name"
                                required
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        {/* Email Address (Read-only representation) */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Email Address <span className="text-slate-400 text-[10px] font-normal">(Account login)</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-600 outline-none cursor-not-allowed dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400"
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => setFormData((prev) => ({ ...prev, phone_number: e.target.value }))}
                                placeholder="+251 912 345 678"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                value={formData.date_of_birth || ''}
                                onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        {/* Street Address */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Street Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                                placeholder="Street, Sub-city, House #"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                City
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                                placeholder="Addis Ababa"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Country
                            </label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                                placeholder="Ethiopia"
                                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Form Action Controls */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => populateFormData(profile)}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Reset Form
                        </button>
                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#c99b43] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#b58735] disabled:opacity-50"
                        >
                            {savingProfile ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Saving to Database...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Profile Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Direct Security Redirection Callout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Password & Security Controls
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Security, password changes, theme toggles, and alert configurations are managed in Account Settings.
                    </p>
                </div>
                <Link
                    to="/tenant/settings"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0b2141] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c99b43] dark:bg-[#c99b43] dark:text-slate-950 dark:hover:bg-[#f7db96]"
                >
                    Manage Password in Settings <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Recent Rental Bookings List */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Rental Bookings</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Your latest rental applications and confirmed bookings.
                        </p>
                    </div>
                    <Link
                        to="/tenant/bookings"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c99b43] hover:underline"
                    >
                        View All Bookings <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {bookings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                        <Clock className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No bookings yet</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Explore available properties and vehicles to book your first stay!
                        </p>
                        <Link
                            to="/properties"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#c99b43] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#b58735]"
                        >
                            Browse Properties
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bookings.slice(0, 5).map((b) => (
                            <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                        {b.property_title || b.property?.title || b.vehicle?.title || `Booking #${b.id}`}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatDate(b.start_date || b.created_at)}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${b.status === 'confirmed'
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : b.status === 'pending'
                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                >
                                    {b.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}