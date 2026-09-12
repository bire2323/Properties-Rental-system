import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Star,
    Search,
    X,
    Loader2,
    AlertTriangle,
    MessageSquareQuote,
    BadgeCheck,
    CheckCircle,
    XCircle,
    EyeOff,
    RotateCcw,
    Eye,
    Pencil,
    Link2,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { toast } from '../../components/ui/toaster'
import { getImageUrl } from '../../lib/utils'
import {
    getAdminTestimonials,
    moderateTestimonial,
} from '../../api/admin/testimonialApi'

const STATUS_META = {
    pending: { label: 'Pending', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
    approved: { label: 'Approved', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
    rejected: { label: 'Rejected', chip: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
    hidden: { label: 'Hidden', chip: 'bg-slate-200 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400', dot: 'bg-slate-400' },
}

function StatusChip({ status }) {
    const meta = STATUS_META[status] || STATUS_META.pending
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    )
}

function StarRating({ rating }) {
    if (rating == null) return <span className="text-xs text-slate-400">No rating</span>
    return (
        <span className="inline-flex items-center gap-0.5" title={`${rating} / 5`}>
            {[1, 2, 3, 4, 5].map((value) => (
                <Star
                    key={value}
                    className={`h-3.5 w-3.5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                />
            ))}
            <span className="ml-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{rating}</span>
        </span>
    )
}

function StatCard({ icon: Icon, label, value, color, isDark }) {
    return (
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                <p className={`mt-0.5 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
            </div>
        </div>
    )
}

function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        if (open) document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative z-10 w-full ${maxWidth} rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700`}>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    )
}

function Field({ label, children }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
            {children}
        </div>
    )
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 flex-shrink-0">{label}</span>
            <span className="text-sm text-slate-700 dark:text-slate-300 text-right">{value || <span className="italic opacity-50">—</span>}</span>
        </div>
    )
}

function ReviewDetail({ item, isDark }) {
    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    {item.user?.profile_image ? (
                        <img src={getImageUrl(item.user.profile_image)} alt={item.user?.name || 'Reviewer'} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-300">
                            {(item.user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.user?.name || 'Anonymous'}</p>
                    <p className="text-xs text-slate-400 truncate">{item.user?.email}</p>
                </div>
                <div className="ml-auto"><StarRating rating={item.rating} /></div>
            </div>

            {item.is_verified_renter && (
                <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified renter
                </span>
            )}

            <p className={`my-3 text-sm leading-relaxed rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-800/50 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                "{item.review_text}"
            </p>

            <DetailRow label="Property" value={`${item.property?.name || '—'} (${item.property?.listing_type || '—'})`} />
            <DetailRow label="Booking ref" value={item.booking_reference && `${item.booking_reference} · ${item.booking_status || ''}`} />
            <DetailRow label="Submitted" value={new Date(item.submitted_at).toLocaleString()} />
            <DetailRow label="Public" value={item.status === 'approved' ? 'Yes' : 'No'} />
            {item.admin_note && <DetailRow label="Admin note" value={item.admin_note} />}
            {item.approved_by && (
                <DetailRow label="Approved by" value={`${item.approved_by.name || item.approved_by.email} on ${new Date(item.approved_at).toLocaleString()}`} />
            )}
        </div>
    )
}

function ManageForm({ item, isDark, onClose, onSaved }) {
    const [status, setStatus] = useState(item.status)
    const [isFeatured, setIsFeatured] = useState(item.is_featured)
    const [displayOrder, setDisplayOrder] = useState(item.display_order ?? 0)
    const [adminNote, setAdminNote] = useState(item.admin_note || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const inputCls = (extra = '') =>
        `w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#255070] focus:outline-none focus:ring-2 focus:ring-[#255070]/20 ${extra}`

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const result = await moderateTestimonial(item.id, {
                status,
                is_featured: isFeatured,
                display_order: Number(displayOrder) || 0,
                admin_note: adminNote,
            })
            const actionLabel = STATUS_META[result.status]?.label || result.status
            toast.success(`Testimonial ${actionLabel.toLowerCase()}.`)
            onSaved()
            onClose()
        } catch (err) {
            setError(err.message || 'Failed to update testimonial.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <Field label="Moderation status">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.keys(STATUS_META).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setStatus(key)}
                            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                                status === key
                                    ? 'border-[#255070] bg-[#255070] text-white'
                                    : isDark
                                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {STATUS_META[key].label}
                        </button>
                    ))}
                </div>
            </Field>

            <Field label="Featured on homepage">
                <button
                    type="button"
                    onClick={() => status === 'approved' && setIsFeatured((val) => !val)}
                    disabled={status !== 'approved'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isFeatured ? 'bg-[#255070]' : 'bg-slate-300 dark:bg-slate-600'} ${status !== 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <p className="mt-1 text-xs text-slate-400">Only testimonials visible on the homepage (status: Approved) can be featured.</p>
            </Field>

            <Field label="Display order">
                <input
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className={inputCls()}
                />
            </Field>

            <Field label="Admin note (internal only)">
                <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className={inputCls()}
                    placeholder="Why was this approved / rejected? Never shown publicly."
                />
            </Field>

            {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#255070] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d405d] disabled:opacity-60">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                </button>
            </div>
        </div>
    )
}

function Skeleton({ isDark }) {
    return (
        <div className={`rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} overflow-hidden`}>
            {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex items-center gap-4 px-4 py-4 border-b last:border-b-0 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className={`h-9 w-9 rounded-lg animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    <div className="flex-1 space-y-2">
                        <div className={`h-4 w-32 rounded animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                        <div className={`h-3 w-20 rounded animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                    </div>
                    <div className={`h-6 w-16 rounded-full animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
            ))}
        </div>
    )
}

export default function Testimonials() {
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [items, setItems] = useState([])
    const [counts, setCounts] = useState({})
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)

    const [statusFilter, setStatusFilter] = useState('')
    const [search, setSearch] = useState('')
    const searchTimeout = useRef(null)

    const [detailItem, setDetailItem] = useState(null)
    const [manageItem, setManageItem] = useState(null)

    const fetchFeed = useCallback((status, searchTerm) => {
        return getAdminTestimonials({
            status: status || '',
            featured: '',
            search: searchTerm || '',
            ordering: '',
            page: 1,
            page_size: 50,
        })
    }, [])

    useEffect(() => {
        let cancelled = false
        fetchFeed(statusFilter, search)
            .then((data) => {
                if (cancelled) return
                setItems(data.results || [])
                setCounts(data.counts || {})
                setError(null)
            })
            .catch((err) => {
                if (cancelled) return
                setError(err.message)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [statusFilter, search, fetchFeed])

    const load = useCallback(async (status, searchTerm) => {
        try {
            const data = await fetchFeed(status, searchTerm)
            setItems(data.results || [])
            setCounts(data.counts || {})
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [fetchFeed])

    const handleSearchChange = (val) => {
        setSearch(val)
        clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => load(statusFilter, val), 400)
    }

    const quickModerate = async (item, payload) => {
        setActionLoading(true)
        try {
            const result = await moderateTestimonial(item.id, payload)
            const actionLabel = STATUS_META[result.status]?.label || result.status
            toast.success(`Testimonial ${actionLabel.toLowerCase()}.`)
            await load(statusFilter, search)
        } catch (err) {
            toast.error(err.message || 'Action failed.')
        } finally {
            setActionLoading(false)
        }
    }

    const filterBtnCls = (active) =>
        `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            active
                ? 'bg-[#255070] text-white'
                : isDark
                    ? 'text-slate-400 hover:bg-slate-700'
                    : 'text-slate-500 hover:bg-slate-100'
        }`

    const statusTabs = [
        { key: '', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
        { key: 'hidden', label: 'Hidden' },
    ]

    return (
        <div className={`flex min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col min-w-0">
                <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#255070]">
                                <MessageSquareQuote className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Testimonials</h1>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Moderate real renter feedback. Only approved testimonials appear on the homepage.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard icon={MessageSquareQuote} label="All" value={counts.all ?? 0} color="bg-[#255070]" isDark={isDark} />
                        <StatCard icon={EyeOff} label="Pending" value={counts.pending ?? 0} color="bg-amber-500" isDark={isDark} />
                        <StatCard icon={CheckCircle} label="Approved" value={counts.approved ?? 0} color="bg-emerald-600" isDark={isDark} />
                        <StatCard icon={Star} label="Featured" value={counts.featured ?? 0} color="bg-blue-600" isDark={isDark} />
                    </div>

                    {/* Toolbar */}
                    <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search reviewer, property, or text…"
                                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#255070] ${isDark ? 'border-slate-600 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-300 bg-slate-50 text-slate-900'}`}
                                />
                            </div>

                            <div className="flex items-center gap-1 ml-auto flex-wrap">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        className={filterBtnCls((statusFilter || '') === tab.key)}
                                        onClick={() => setStatusFilter(tab.key)}
                                    >
                                        {tab.label}
                                        {tab.key && (counts[tab.key] ?? 0) > 0 && ` (${counts[tab.key]})`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="p-4"><Skeleton isDark={isDark} /></div>
                        ) : error ? (
                            <div className="flex flex-col items-center py-16 text-center px-4">
                                <AlertTriangle className={`h-8 w-8 mb-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                                <p className={`font-semibold text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load testimonials</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error}</p>
                                <button onClick={() => load(statusFilter, search)} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                    Retry
                                </button>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-center px-4">
                                <MessageSquareQuote className={`h-10 w-10 mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                                <p className={`font-semibold text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {search || statusFilter
                                        ? 'No testimonials match your filters.'
                                        : 'No reviews yet. Renter feedback becomes pending testimonials automatically.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                                            <th className="px-4 py-3 text-left">Reviewer / Property</th>
                                            <th className="px-4 py-3 text-left">Review</th>
                                            <th className="px-4 py-3 text-center">Rating</th>
                                            <th className="px-4 py-3 text-center">Verified</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                                        {items.map((item) => (
                                            <tr key={item.id} className={`transition ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-9 w-9 flex-shrink-0 overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                                            {item.user?.profile_image ? (
                                                                <img src={getImageUrl(item.user.profile_image)} alt={item.user?.name || ''} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className={`flex h-full w-full items-center justify-center text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                                                                    {(item.user?.name || 'U').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.user?.name || 'Anonymous'}</p>
                                                            <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                {item.property?.name || '—'}
                                                                {item.booking_reference && <span className="ml-1 inline-flex items-center gap-1"><Link2 className="h-3 w-3" />{item.booking_reference}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 max-w-[260px]">
                                                    <button onClick={() => setDetailItem(item)} className="text-left">
                                                        <p className={`line-clamp-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{item.review_text}"</p>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3.5 text-center"><StarRating rating={item.rating} /></td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {item.is_verified_renter ? (
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                                            <BadgeCheck className="h-3 w-3" /> Yes
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-center"><StatusChip status={item.status} /></td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => setDetailItem(item)}
                                                            title="View review"
                                                            className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        {item.status !== 'approved' && (
                                                            <button
                                                                onClick={() => quickModerate(item, { status: 'approved' })}
                                                                disabled={actionLoading}
                                                                title="Approve"
                                                                className={`rounded-lg p-1.5 transition ${isDark ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {item.status === 'approved' && (
                                                            <>
                                                                <button
                                                                    onClick={() => quickModerate(item, { status: 'rejected' })}
                                                                    disabled={actionLoading}
                                                                    title="Reject"
                                                                    className={`rounded-lg p-1.5 transition ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => quickModerate(item, { status: 'hidden' })}
                                                                    disabled={actionLoading}
                                                                    title="Hide"
                                                                    className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                                                                >
                                                                    <EyeOff className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {!['approved', 'pending'].includes(item.status) && (
                                                            <button
                                                                onClick={() => quickModerate(item, { status: 'pending' })}
                                                                disabled={actionLoading}
                                                                title="Restore to pending"
                                                                className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setManageItem(item)}
                                                            title="Manage (feature, order, note)"
                                                            className={`rounded-lg p-1.5 transition ${isDark ? 'text-[#c99b43] hover:bg-slate-700' : 'text-[#a57f2e] hover:bg-slate-100'}`}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Mobile cards */}
                        {!loading && !error && items.length > 0 && (
                            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                                {items.map((item) => (
                                    <div key={item.id} className={`px-4 py-4 ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {item.user?.name || 'Anonymous'}
                                                </p>
                                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.property?.name || '—'}</p>
                                            </div>
                                            <StatusChip status={item.status} />
                                        </div>
                                        <p className={`mt-2 line-clamp-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{item.review_text}"</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <StarRating rating={item.rating} />
                                            <div className="flex gap-1">
                                                <button onClick={() => setDetailItem(item)} className={`rounded-lg p-1.5 ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}><Eye className="h-4 w-4" /></button>
                                                <button onClick={() => setManageItem(item)} className={`rounded-lg p-1.5 ${isDark ? 'text-[#c99b43] hover:bg-slate-700' : 'text-[#a57f2e] hover:bg-slate-100'}`}><Pencil className="h-4 w-4" /></button>
                                                {item.status !== 'approved' && (
                                                    <button onClick={() => quickModerate(item, { status: 'approved' })} className="rounded-lg p-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-4 w-4" /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {!loading && items.length > 0 && (
                        <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Showing {items.length} testimonial{items.length !== 1 ? 's' : ''}. Homepage displays approved ones only.
                        </p>
                    )}
                </main>
            </div>

            <Modal open={detailItem !== null} onClose={() => setDetailItem(null)} title="Review details">
                {detailItem && <ReviewDetail item={detailItem} isDark={isDark} />}
            </Modal>

            <Modal open={manageItem !== null} onClose={() => setManageItem(null)} title="Manage testimonial">
                {manageItem && (
                    <ManageForm
                        item={manageItem}
                        isDark={isDark}
                        onClose={() => setManageItem(null)}
                        onSaved={() => load(statusFilter, search)}
                    />
                )}
            </Modal>
        </div>
    )
}