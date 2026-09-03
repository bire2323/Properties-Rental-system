import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    Banknote,
    Bell,
    CalendarDays,
    Clock,
    FileText,
    House,
    Loader2,
    MapPin,
    Phone,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { deleteAdminNotification, getAdminNotificationDetail, markAdminNotificationViewed } from '../../api/admin/adminApi'

function NotificationDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [notification, setNotification] = useState(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    const [error, setError] = useState(null)
    const [deleteError, setDeleteError] = useState(null)

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getAdminNotificationDetail(id)
                markAdminNotificationViewed(id)
                setSelectedImageIndex(0)
                setNotification({ ...data, status: data.status === 'New' ? '' : data.status })
            } catch (err) {
                console.error('Failed to fetch notification detail:', err)
                setError('Failed to load notification details.')
                setNotification(null)
            } finally {
                setLoading(false)
            }
        }
        if (id) {
            fetchDetail()
        }
    }, [id])

    const getStatusClass = (status) => {
        const map = {
            New: isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600',
            Received: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600',
            Confirmed: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600',
            Info: isDark ? 'bg-slate-600/20 text-slate-300' : 'bg-slate-100 text-slate-600',
        }
        return map[status] || (isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600')
    }

    const selectedImage = notification?.images?.[selectedImageIndex] || notification?.image

    const handleDelete = async () => {
        if (!notification || deleting) return
        setDeleting(true)
        setDeleteError(null)
        try {
            await deleteAdminNotification(notification.id)
            navigate('/admin-dashboard/notifications')
        } catch (err) {
            console.error('Failed to delete notification:', err)
            setDeleteError(err.message || 'Failed to delete notification.')
            setDeleting(false)
        }
    }

    return (
        <div className={`min-h-screen flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            {showDeleteConfirmation && notification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-notification-title"
                        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}
                    >
                        <h2 id="delete-notification-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Are you sure?
                        </h2>
                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            This notification will be permanently deleted from the database.
                        </p>
                        {deleteError && (
                            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                {deleteError}
                            </p>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirmation(false)}
                                disabled={deleting}
                                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />
                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin-dashboard/notifications')}
                            className={`inline-flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Notifications
                        </button>
                    </div>

                    <div className={`overflow-hidden rounded-2xl border shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notification Detail</h2>
                            {!loading && notification && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    disabled={deleting}
                                    title="Delete notification"
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                        </div>

                        <div className="p-5">
                            {loading ? (
                                <div className={`flex items-center justify-center p-16 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <span className="ml-3">Loading notification details...</span>
                                </div>
                            ) : error || !notification ? (
                                <div className={`rounded-xl border border-dashed p-12 text-center ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                    <div className="mb-2 font-semibold">{error || 'Notification not found.'}</div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/admin-dashboard/notifications')}
                                        className="mt-4 text-sm text-blue-600 hover:underline"
                                    >
                                        Back to notifications
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {deleteError && (
                                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                                            {deleteError}
                                        </div>
                                    )}
                                    <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? 'bg-[#dfeaff] text-[#1d4f85]' : 'bg-[#dfeaff] text-[#1d4f85]'}`}>
                                                    {notification.type === 'Property' ? <House className="h-5 w-5" /> : notification.type === 'Payment' ? <ShieldCheck className="h-5 w-5" /> : notification.type === 'Booking' ? <Bell className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <div className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                        {notification.title}
                                                    </div>
                                                    <div className={`mt-1 flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        <span>{notification.info}</span>
                                                        <span>•</span>
                                                        <span>{notification.date}</span>
                                                        <span>{notification.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {notification.status && (
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(notification.status)}`}>
                                                    {notification.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`mt-6 rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                        <div className="mb-5 flex items-center gap-3">
                                            <FileText className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                                            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notification Information</h3>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {[
                                                ['Notification ID', notification.id],
                                                ['Type', notification.type],
                                                ['Status', notification.status || 'Viewed'],
                                                ['Info', notification.info],
                                                ['Sender', notification.sender],
                                                ['Email', notification.email],
                                                ['Phone', notification.phone],
                                                ['Date', notification.date],
                                                ['Time', notification.time],
                                            ].map(([label, value]) => (
                                                <div key={label} className={`rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
                                                    <div className={`mt-1 break-words font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{value || 'Unavailable'}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={`mt-3 rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Details</div>
                                            <div className={`mt-1 whitespace-pre-wrap break-words ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{notification.details || 'No additional details.'}</div>
                                        </div>
                                    </div>

                                    {notification.title === 'New user registration' && notification.registeredUser && (
                                        <div className={`mt-6 rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                            <div className="mb-5 flex items-center gap-3">
                                                <UserRound className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                                                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Registered User Details</h3>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {[
                                                    ['User ID', notification.registeredUser.id],
                                                    ['First Name', notification.registeredUser.first_name],
                                                    ['Last Name', notification.registeredUser.last_name],
                                                    ['Full Name', `${notification.registeredUser.first_name || ''} ${notification.registeredUser.last_name || ''}`.trim()],
                                                    ['Email', notification.registeredUser.email],
                                                    ['Role', notification.registeredUser.role_display || notification.registeredUser.role],
                                                    ['Auth Provider', notification.registeredUser.auth_provider],
                                                    ['Verified', notification.registeredUser.is_verified ? 'Yes' : 'No'],
                                                    ['Joined', notification.registeredUser.created_at],
                                                ].map(([label, value]) => (
                                                    <div key={label} className={`rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
                                                        <div className={`mt-1 break-words font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{value || 'Unavailable'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            {notification.registeredUser.profile && (
                                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                    {[
                                                        ['Phone', notification.registeredUser.profile.phone_number],
                                                        ['Date of Birth', notification.registeredUser.profile.date_of_birth],
                                                        ['Address', notification.registeredUser.profile.address],
                                                        ['City', notification.registeredUser.profile.city],
                                                        ['Country', notification.registeredUser.profile.country],
                                                    ].map(([label, value]) => (
                                                        <div key={label} className={`rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
                                                            <div className={`mt-1 break-words font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{value || 'Unavailable'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {notification.type === 'Booking' && (
                                        <div className="mt-6 space-y-6">
                                            {/* Booking Summary Card */}
                                            <div className={`overflow-hidden rounded-2xl border p-6 ${isDark ? 'border-blue-800/50 bg-gradient-to-br from-blue-900/20 to-blue-800/10' : 'border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50'}`}>
                                                <div className="mb-4 flex items-center gap-3">
                                                    <Clock className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                                    <h3 className={`text-lg font-bold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>Booking Summary</h3>
                                                </div>
                                                <div className={`grid gap-4 text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                                    <div className="flex items-center justify-between rounded-lg bg-white/30 px-4 py-3 dark:bg-slate-700/30">
                                                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Check-in</span>
                                                        <span className="font-semibold">{notification.checkInDate}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg bg-white/30 px-4 py-3 dark:bg-slate-700/30">
                                                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Check-out</span>
                                                        <span className="font-semibold">{notification.checkOutDate}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg bg-white/30 px-4 py-3 dark:bg-slate-700/30">
                                                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Total Amount</span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{notification.totalAmount}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg bg-white/30 px-4 py-3 dark:bg-slate-700/30">
                                                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Payment Status</span>
                                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>
                                                            {notification.paymentStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Guest & Property Grid */}
                                            <div className="grid gap-6 md:grid-cols-2">
                                                {/* Guest Information */}
                                                <div className={`overflow-hidden rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                                    <div className="mb-5 flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                                            <UserRound className="h-5 w-5" />
                                                        </div>
                                                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Guest Details</h3>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 rounded-lg bg-slate-50/50 p-3 dark:bg-slate-700/50">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-sm font-bold text-white">
                                                                {notification.tenantName.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className={`truncate font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.tenantName}</div>
                                                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{notification.email}</div>
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-3 rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                            <Phone className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                                            <div>
                                                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Phone</div>
                                                                <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{notification.tenantPhone}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payment Information */}
                                                <div className={`overflow-hidden rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                                    <div className="mb-5 flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                                                            <Banknote className="h-5 w-5" />
                                                        </div>
                                                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Payment Details</h3>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className={`rounded-lg border-2 border-dashed p-4 text-center ${isDark ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-emerald-300 bg-emerald-50'}`}>
                                                            <div className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Total Amount</div>
                                                            <div className={`text-2xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{notification.totalAmount}</div>
                                                        </div>
                                                        <div className={`flex items-center gap-3 rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                                                            <div>
                                                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Payment Method</div>
                                                                <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{notification.paymentMethod}</div>
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-3 rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                                                            <div>
                                                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</div>
                                                                <div className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>
                                                                    {notification.paymentStatus}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Property Card */}
                                            <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                                <div className="relative flex min-h-[20rem] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 p-3 dark:from-slate-800 dark:to-slate-700">
                                                    <img src={selectedImage} alt={notification.propertyTitle} className="max-h-[28rem] w-full object-contain transition duration-300" />
                                                    <div className="absolute right-4 top-4">
                                                        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${isDark ? 'bg-emerald-500/80 text-white' : 'bg-emerald-500/90 text-white'}`}>
                                                            {notification.propertyStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                                {notification.images.length > 1 && (
                                                    <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-5">
                                                        {notification.images.map((image, index) => (
                                                            <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImageIndex(index)} className={`aspect-[4/3] overflow-hidden rounded-lg border-2 bg-slate-100 transition hover:scale-[1.02] dark:bg-slate-700 ${selectedImageIndex === index ? 'border-emerald-500 shadow-md' : 'border-transparent'}`}>
                                                                <img loading="lazy" src={image} alt={`${notification.propertyTitle} ${index + 1}`} className="h-full w-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="p-6">
                                                    <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.propertyTitle}</h3>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <MapPin className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{notification.propertyAddress}</span>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <Phone className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{notification.ownerPhone || 'Owner phone unavailable'}</span>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                                        <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                                                            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Bedrooms</div>
                                                            <div className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.bedrooms}</div>
                                                        </div>
                                                        <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                                                            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Bathrooms</div>
                                                            <div className={`mt-1 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.bathrooms}</div>
                                                        </div>
                                                        <div className={`rounded-xl p-3 text-center ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                                                            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Size</div>
                                                            <div className={`mt-1 text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.size}</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                                                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Nightly Rate</div>
                                                        <div className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{notification.nightlyPrice}</div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                    {notification.type === 'Property' && (
                                        <div className="mt-6 space-y-6">
                                            {/* Property Header */}
                                            <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                                <div className="relative flex min-h-[22rem] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 p-3 dark:from-slate-800 dark:to-slate-700">
                                                    <img src={selectedImage} alt={notification.propertyTitle} className="max-h-[32rem] w-full object-contain transition duration-300" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                                    <div className="absolute bottom-4 left-4 right-4">
                                                        <div className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${isDark ? 'bg-emerald-500/80 text-white' : 'bg-emerald-500/90 text-white'}`}>
                                                            ✓ {notification.propertyStatus}
                                                        </div>
                                                    </div>
                                                </div>
                                                {notification.images.length > 1 && (
                                                    <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-5">
                                                        {notification.images.map((image, index) => (
                                                            <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImageIndex(index)} className={`aspect-[4/3] overflow-hidden rounded-lg border-2 bg-slate-100 transition hover:scale-[1.02] dark:bg-slate-700 ${selectedImageIndex === index ? 'border-emerald-500 shadow-md' : 'border-transparent'}`}>
                                                                <img loading="lazy" src={image} alt={`${notification.propertyTitle} ${index + 1}`} className="h-full w-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="p-6">
                                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.propertyTitle}</h2>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <MapPin className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                                        <span className={`text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{notification.propertyAddress}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Listing-specific details */}
                                            {notification.listingType === 'car' ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        ['Brand', notification.carBrand],
                                                        ['Model', notification.carModel],
                                                        ['Year', notification.carYear],
                                                        ['Mileage', notification.carMileage ? `${notification.carMileage} km` : ''],
                                                        ['Fuel Type', notification.carFuelType],
                                                        ['Seats', notification.carSeatingCapacity],
                                                    ].map(([label, value]) => (
                                                        <div key={label} className={`rounded-xl border p-4 text-center ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                                                            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</div>
                                                            <div className={`mt-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        ['Bedrooms', notification.bedrooms],
                                                        ['Bathrooms', notification.bathrooms],
                                                        ['Size', notification.size],
                                                        ['Rate', notification.nightlyPrice],
                                                    ].map(([label, value]) => (
                                                        <div key={label} className={`rounded-xl border p-4 text-center ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                                                            <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</div>
                                                            <div className={`mt-2 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Owner & Pricing */}
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className={`overflow-hidden rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                                    <div className="mb-5 flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                                            <UserRound className="h-5 w-5" />
                                                        </div>
                                                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Owner Information</h3>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 rounded-lg bg-slate-50/50 p-3 dark:bg-slate-700/50">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-sm font-bold text-white">
                                                                {notification.owner.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className={`truncate font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.owner}</div>
                                                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Property Owner</div>
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-3 rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                            <Phone className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                                            <div>
                                                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Contact</div>
                                                                <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{notification.ownerPhone || notification.phone}</div>
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-3 rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                            <CalendarDays className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                                            <div>
                                                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Added On</div>
                                                                <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{notification.addedDate}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`overflow-hidden rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                                    <div className="mb-5 flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                                                            <Banknote className="h-5 w-5" />
                                                        </div>
                                                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pricing</h3>
                                                    </div>
                                                    <div className={`rounded-lg border-2 border-dashed p-4 text-center ${isDark ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-emerald-300 bg-emerald-50'}`}>
                                                        <div className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Nightly Rate</div>
                                                        <div className={`text-2xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{notification.nightlyPrice}</div>
                                                    </div>
                                                    <div className="mt-4 space-y-3">
                                                        <div className={`flex items-center justify-between rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Status</span>
                                                            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                                                                {notification.propertyStatus}
                                                            </span>
                                                        </div>
                                                        <div className={`flex items-center justify-between rounded-lg p-3 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                                                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Added On</span>
                                                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{notification.addedDate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                                                <div className="mb-4 flex items-center gap-3">
                                                    <FileText className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                                                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Property Description</h3>
                                                </div>
                                                <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {notification.details}
                                                </p>
                                            </div>

                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default NotificationDetail
