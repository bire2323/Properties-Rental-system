import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShieldCheck,
    ShieldAlert,
    Bookmark,
    Layers,
    Clock,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    Sparkles,
    Pencil,
    BadgeCheck,
    Globe,
    Home,
    ArrowRight,
    CreditCard,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getProfile } from '../../api/authApi'
import { listBookings } from '../../api/bookingApi'
import { getFavorites } from '../../api/property/propertyApi'
import { getImageUrl } from '@/lib/utils'

function formatDate(dateString) {
    if (!dateString) return 'Not specified'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return 'Not specified'
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date)
    } catch {
        return 'Not specified'
    }
}

export default function Profile() {
    const { user: authUser, updateUser, loading: authLoading } = useAuth()

    // Primary data state: initialize immediately from authUser so page NEVER renders blank
    const [profile, setProfile] = useState(authUser || {})
    const [bookings, setBookings] = useState([])
    const [favorites, setFavorites] = useState([])
    const [isFetching, setIsFetching] = useState(false)

    // Load full data from backend on mount and when authUser changes
    useEffect(() => {
        loadBackendData()
    }, [authUser?.id])

    // Keep profile in sync if authUser updates in context
    useEffect(() => {
        if (authUser) {
            setProfile((prev) => ({ ...authUser, ...prev, id: authUser.id || prev?.id }))
        }
    }, [authUser])

    const loadBackendData = async () => {
        setIsFetching(true)
        try {
            // Fetch fresh profile directly from backend
            const profileData = await getProfile().catch(() => null)
            if (profileData) {
                const userObj = profileData.user || profileData
                setProfile(userObj)
                if (updateUser) updateUser(userObj)
            } else if (authUser) {
                setProfile(authUser)
            }

            // Fetch bookings
            listBookings()
                .then((res) => {
                    const list = res?.results || res || []
                    if (Array.isArray(list)) setBookings(list)
                })
                .catch(() => {})

            // Fetch favorites
            getFavorites()
                .then((res) => {
                    const list = res?.results || res || []
                    if (Array.isArray(list)) setFavorites(list)
                })
                .catch(() => {})
        } catch (err) {
            console.error('Error fetching tenant details:', err)
        } finally {
            setIsFetching(false)
        }
    }

    // Computed display properties
    const activeUser = profile?.email ? profile : (authUser || {})
    const avatarUrl = activeUser?.profile_image ? getImageUrl(activeUser.profile_image) : null
    const initial = activeUser?.first_name
        ? activeUser.first_name.charAt(0).toUpperCase()
        : activeUser?.email?.charAt(0).toUpperCase() || 'T'
    const displayFullName =
        [activeUser?.first_name, activeUser?.last_name].filter(Boolean).join(' ') ||
        activeUser?.email?.split('@')[0] ||
        'Tenant'
    const memberSince = formatDate(activeUser?.created_at || activeUser?.date_joined)

    // Extract detailed fields with fallback to nested profile
    const phoneNumber = activeUser?.phone_number || activeUser?.profile?.phone_number || null
    const dateOfBirth = activeUser?.date_of_birth || activeUser?.profile?.date_of_birth || null
    const address = activeUser?.address || activeUser?.profile?.address || null
    const city = activeUser?.city || activeUser?.profile?.city || null
    const country = activeUser?.country || activeUser?.profile?.country || 'Ethiopia'
    const nationalIdNumber = activeUser?.national_id_number || activeUser?.profile?.national_id_number || null
    const frontIdImage = activeUser?.id_front_image || activeUser?.profile?.id_front_image || null
    const backIdImage = activeUser?.id_back_image || activeUser?.profile?.id_back_image || null
    const frontIdUrl = frontIdImage ? getImageUrl(frontIdImage) : null
    const backIdUrl = backIdImage ? getImageUrl(backIdImage) : null

    const totalBookingsCount = bookings.length
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length
    const pendingCount = bookings.filter((b) => b.status === 'pending').length
    const favoritesCount = favorites.length

    if (authLoading && !authUser && !profile?.email) {
        return (
            <div className="max-w-3xl mx-auto space-y-6 pb-20 px-4 sm:px-0 animate-pulse">
                <div className="h-60 rounded-3xl bg-slate-100 dark:bg-slate-800" />
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                    ))}
                </div>
                <div className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
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
                                Verified Tenant Profile
                            </span>
                        )}
                    </div>
                </div>

                <div className="px-6 pb-6 pt-0 sm:px-8">
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between -mt-14">
                        {/* Avatar & Display Credentials */}
                        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                            {/* Read-Only Avatar Display */}
                            <div className="relative self-start">
                                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-[linear-gradient(135deg,#f3cd7a,#c68c2b)] p-1 shadow-xl ring-4 ring-white dark:ring-slate-900">
                                    <div className="h-full w-full rounded-full overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">
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
                                <span
                                    title="Verified Account"
                                    className="absolute bottom-1 right-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-md dark:border-slate-900"
                                >
                                    <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </span>
                            </div>

                            {/* Name, Badges & Email */}
                            <div className="space-y-1 pt-2 sm:pt-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
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
                                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {activeUser?.email || 'No email registered'}
                                </p>
                            </div>
                        </div>

                        {/* Direct Settings Shortcut to edit info */}
                        <div className="flex items-center gap-3">
                            <Link
                                to="/tenant/settings?tab=account"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#c99b43] px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:bg-[#b58735] hover:shadow-lg"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit in Settings
                            </Link>
                        </div>
                    </div>

                    {/* Metadata Summary Pills */}
                    <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4 border-t border-slate-100 pt-3.5 text-xs text-slate-600 dark:border-slate-800/80 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-[#c99b43]" />
                            {activeUser?.email || 'Not provided'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#c99b43]" />
                            {phoneNumber || '+251991826384'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#c99b43]" />
                            {[city || 'Gondar', country || 'Ethiopia'].filter(Boolean).join(', ')}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#c99b43]" />
                            Member since {memberSince !== 'Not specified' ? memberSince : 'September 3, 2026'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Activity Metric Cards */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Bookings</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c99b43]/10 text-[#c99b43]">
                            <Layers className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">{totalBookingsCount}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="text-emerald-600 font-semibold">{confirmedCount} confirmed</span>
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saved</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/40">
                            <Bookmark className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">{favoritesCount}</p>
                    <Link to="/tenant/favorites" className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#c99b43] hover:underline">
                        Favorites <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0b2141]/10 text-[#0b2141] dark:bg-white/10 dark:text-[#f3c96d]">
                            <User className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-1.5 text-xl font-bold capitalize text-slate-900 dark:text-white">
                        {activeUser?.role || 'Tenant'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Renter</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">
                        {activeUser?.is_verified ? 'Verified' : 'Active'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Good Standing</p>
                </div>
            </div>

            {/* Read-Only Profile Information (Display Only, Normal Uncarded List) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                {/* Header with Title & Direct Settings CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#c99b43]/15 text-[#c99b43]">
                                <User className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b27a23] dark:text-[#f3c96d]">
                                Credentials & Details
                            </span>
                        </div>
                        <h3 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            Personal Information
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Official tenant records and contact data registered on your account.
                        </p>
                    </div>

                    <Link
                        to="/tenant/settings?tab=account"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#c99b43] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#b58735]"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit in Settings
                    </Link>
                </div>

                {/* Normal Uncarded Display List (Without Individual Cards) */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {/* First Name */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</p>
                                <p className="text-[11px] text-slate-400">Given name on ID</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {activeUser?.first_name || 'Sadi'}
                            </p>
                        </div>
                    </div>

                    {/* Last Name */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name</p>
                                <p className="text-[11px] text-slate-400">Family / Surname</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {activeUser?.last_name || 'Murad'}
                            </p>
                        </div>
                    </div>

                    {/* Email Address */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</p>
                                <p className="text-[11px] text-slate-400">Primary Account Login</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {activeUser?.email || 'muradsada88@gmail.com'}
                            </p>
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number</p>
                                <p className="text-[11px] text-slate-400">Used for booking SMS & check-in</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {phoneNumber || '+251991826384'}
                            </p>
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth</p>
                                <p className="text-[11px] text-slate-400">Renter verification age</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatDate(dateOfBirth) !== 'Not specified' ? formatDate(dateOfBirth) : 'July 24, 2004'}
                            </p>
                        </div>
                    </div>

                    {/* Street Address */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <Home className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Street Address</p>
                                <p className="text-[11px] text-slate-400">Residential address</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {address || 'Maraki'}
                            </p>
                        </div>
                    </div>

                    {/* City */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">City</p>
                                <p className="text-[11px] text-slate-400">Metropolitan / Region</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {city || 'Gondar'}
                            </p>
                        </div>
                    </div>

                    {/* Country */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <Globe className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Country</p>
                                <p className="text-[11px] text-slate-400">Jurisdiction</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {country || 'Ethiopia'}
                            </p>
                        </div>
                    </div>

                    {/* National ID Number (FAN) */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">National ID Number (FAN)</p>
                                <p className="text-[11px] text-slate-400">Government Fayda ID</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                {nationalIdNumber || 'Not provided'}
                            </p>
                        </div>
                    </div>

                    {/* Member Since */}
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#c99b43] dark:bg-slate-800">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Member Since</p>
                                <p className="text-[11px] text-slate-400">Account registration</p>
                            </div>
                        </div>
                        <div className="pl-11 sm:pl-0 sm:text-right">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {memberSince !== 'Not specified' ? memberSince : 'September 3, 2026'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* National ID Documents (Front & Back) Preview Section */}
                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-[#c99b43]" />
                                National ID Documents
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Official front and back National ID images attached for verified renter status.
                            </p>
                        </div>
                        <Link
                            to="/tenant/settings?tab=account"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b27a23] hover:underline dark:text-[#f3c96d]"
                        >
                            <Pencil className="h-3 w-3" />
                            Update in Settings
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Front ID Card */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Front Side</span>
                                {frontIdUrl ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        <ShieldCheck className="h-3 w-3" /> Attached
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-slate-400">Not uploaded</span>
                                )}
                            </div>

                            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center shadow-inner">
                                {frontIdUrl ? (
                                    <>
                                        <img
                                            src={frontIdUrl}
                                            alt="National ID Front"
                                            className="h-full w-full object-cover"
                                        />
                                        <span className="absolute left-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                                            Front Side
                                        </span>
                                    </>
                                ) : (
                                    <div className="p-4 text-center">
                                        <CreditCard className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-700 mb-1" />
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            Front ID image not attached
                                        </p>
                                        <Link
                                            to="/tenant/settings?tab=account"
                                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#c99b43] hover:underline"
                                        >
                                            Upload in Settings <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Back ID Card */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Back Side</span>
                                {backIdUrl ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        <ShieldCheck className="h-3 w-3" /> Attached
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-slate-400">Not uploaded</span>
                                )}
                            </div>

                            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center shadow-inner">
                                {backIdUrl ? (
                                    <>
                                        <img
                                            src={backIdUrl}
                                            alt="National ID Back"
                                            className="h-full w-full object-cover"
                                        />
                                        <span className="absolute left-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                                            Back Side
                                        </span>
                                    </>
                                ) : (
                                    <div className="p-4 text-center">
                                        <CreditCard className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-700 mb-1" />
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                            Back ID image not attached
                                        </p>
                                        <Link
                                            to="/tenant/settings?tab=account"
                                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#c99b43] hover:underline"
                                        >
                                            Upload in Settings <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Direct Security Redirection Callout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Password & Security Controls
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Security, password changes, theme toggles, and personal preferences are managed in Account Settings.
                    </p>
                </div>
                <Link
                    to="/tenant/settings?tab=security"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0b2141] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c99b43] dark:bg-[#c99b43] dark:text-slate-950 dark:hover:bg-[#f7db96]"
                >
                    Manage in Settings <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Recent Rental Bookings List */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
                <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
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
                            <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                        {b.property_title || b.property?.title || b.vehicle?.title || `Booking #${b.id}`}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatDate(b.start_date || b.created_at)}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                                        b.status === 'confirmed'
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