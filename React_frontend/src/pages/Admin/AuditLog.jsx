import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Activity,
    AlertTriangle,
    Bell,
    Bug,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Filter,
    Info,
    Loader2,
    Lock,
    Search,
    ShieldAlert,
    Target,
    Trash2,
    User,
    UserRound,
    Wallet,
    X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import useDebounce from '../../hooks/useDebounce'
import { bulkDeleteAuditLogs, deleteAuditLog, getAuditLogs, getAuditLogDetail, getAuditLogSummary } from '../../api/admin/auditApi'
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Input,
    Select,
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell,
} from '../../components/ui'
import { toast } from '../../components/ui/toaster'
import { cn } from '../../lib/utils'

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'authentication', label: 'Authentication' },
    { value: 'user', label: 'User' },
    { value: 'booking', label: 'Booking' },
    { value: 'payment', label: 'Payment' },
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'admin', label: 'Admin' },
    { value: 'security', label: 'Security' },
    { value: 'system', label: 'System' },
    { value: 'notification', label: 'Notification' },
    { value: 'other', label: 'Other' },
]

const SEVERITIES = [
    { value: '', label: 'All Severities' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' },
]

const RESULTS = [
    { value: '', label: 'All Results' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
]

const TARGET_TYPES = [
    { value: '', label: 'All Objects' },
    { value: 'user', label: 'User' },
    { value: 'booking', label: 'Booking' },
    { value: 'payment', label: 'Payment' },
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'refund', label: 'Refund' },
    { value: 'payout', label: 'Payout' },
    { value: 'region', label: 'Region' },
    { value: 'city', label: 'City' },
    { value: 'category', label: 'Category' },
    { value: 'system', label: 'System' },
]

const RANGES = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom Range…' },
]

const DELETE_PERIODS = [
    { value: 'today', label: "Delete Today's Logs", description: 'All events from the current calendar day.' },
    { value: '7d', label: 'Delete Last 7 Days', description: 'All events from the previous 7 days, including today.' },
    { value: 'last_week', label: 'Delete Last Week', description: 'All events from the previous completed calendar week.' },
    { value: 'last_month', label: 'Delete Last Month', description: 'All events from the previous completed calendar month.' },
]

const getCategoryMeta = (category) => {
    const map = {
        authentication: { label: 'Authentication', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' },
        user: { label: 'User', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
        booking: { label: 'Booking', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
        payment: { label: 'Payment', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
        property: { label: 'Property', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
        vehicle: { label: 'Vehicle', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' },
        admin: { label: 'Admin', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
        security: { label: 'Security', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
        system: { label: 'System', color: 'bg-slate-200 text-slate-700 dark:bg-slate-700 text-slate-300' },
        notification: { label: 'Notification', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300' },
        other: { label: 'Other', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    }
    return map[category] || map.other
}

const getSeverityMeta = (severity) => {
    const map = {
        info: { label: 'Info', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
        warning: { label: 'Warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
        error: { label: 'Error', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', dot: 'bg-red-500' },
        critical: { label: 'Critical', color: 'bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:text-rose-300', dot: 'bg-rose-600' },
    }
    return map[severity] || map.info
}

const getResultMeta = (result) => {
    if (result === 'success') {
        return { label: 'Success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' }
    }
    return { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' }
}

const formatAction = (action) => {
    if (!action) return ''
    return action
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

const formatTimestamp = (iso, isDark) => {
    if (!iso) return ''
    const date = new Date(iso)
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return { time, date: formatted }
}

const getCategoryIcon = (category) => {
    const map = {
        authentication: User,
        user: UserRound,
        booking: ClipboardList,
        payment: Wallet,
        property: Activity,
        vehicle: Activity,
        admin: ShieldAlert,
        security: Lock,
        system: Bug,
        notification: Bell,
        other: Info,
    }
    return map[category] || Info
}

function FilterChip({ label, onClear, isDark }) {
    return (
        <span className={cn(
            'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
            isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
        )}>
            {label}
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClear() }}
                className={cn(
                    'ml-0.5 rounded p-0.5 transition',
                    isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                )}
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    )
}

function MobileFilterGroup({ label, isDark, children }) {
    return (
        <div>
            <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>
                {label}
            </label>
            {children}
        </div>
    )
}

function AuditLog() {
    const defaultPageSize = 5
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { isDark } = useTheme()

    // Data state
    const [events, setEvents] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(defaultPageSize)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [actions, setActions] = useState([])
    const [summary, setSummary] = useState({})

    // Filter state
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')
    const [action, setAction] = useState('')
    const [severity, setSeverity] = useState('')
    const [result, setResult] = useState('')
    const [actor, setActor] = useState('')
    const [targetType, setTargetType] = useState('')
    const [range, setRange] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const debouncedSearch = useDebounce(search, 400)

    // UI state
    const [detailEvent, setDetailEvent] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState(null)
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

    // Bulk-delete state
    const [bulkDeletePeriod, setBulkDeletePeriod] = useState(null)
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [bulkDeleting, setBulkDeleting] = useState(false)
    const [bulkDeleteError, setBulkDeleteError] = useState(null)

    const fetchSummary = useCallback(() => {
        getAuditLogSummary().then(setSummary).catch(() => { })
    }, [])

    const fetchEvents = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const params = {
                page,
                page_size: pageSize,
                search: debouncedSearch,
                category,
                action,
                severity,
                result,
                actor,
                target_type: targetType,
                range: range === 'custom' ? '' : range,
                date_from: dateFrom,
                date_to: dateTo,
            }
            const data = await getAuditLogs(params)
            setEvents(data.events || [])
            setTotalCount(data.totalCount || 0)
            setTotalPages(data.totalPages || 1)
            if (data.actions?.length) {
                setActions((prev) => {
                    const merged = new Set([...prev, ...data.actions])
                    return [...merged]
                })
            }
        } catch (err) {
            console.error('Failed to load audit logs:', err)
            setError(err.message || 'Failed to load audit logs.')
            setEvents([])
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, debouncedSearch, category, action, severity, result, actor, targetType, range, dateFrom, dateTo])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    useEffect(() => {
        fetchSummary()
    }, [fetchSummary])

    const hasActiveFilters = Boolean(
        category || action || severity || result || actor || targetType || range || dateFrom || dateTo || debouncedSearch
    )

    const resetFilters = () => {
        setSearch('')
        setCategory('')
        setAction('')
        setSeverity('')
        setResult('')
        setActor('')
        setTargetType('')
        setRange('')
        setDateFrom('')
        setDateTo('')
        setPage(1)
    }

    const activeDeletePeriod = bulkDeletePeriod
        ? DELETE_PERIODS.find((p) => p.value === bulkDeletePeriod)
        : null

    const openBulkDelete = (period) => {
        setBulkDeletePeriod(period)
        setBulkDeleteError(null)
        setBulkDeleteOpen(true)
    }

    const confirmBulkDelete = async () => {
        if (!bulkDeletePeriod) return
        setBulkDeleting(true)
        setBulkDeleteError(null)
        try {
            const result = await bulkDeleteAuditLogs(bulkDeletePeriod)
            const count = result?.deleted_count ?? 0
            const label = activeDeletePeriod?.label || bulkDeletePeriod
            if (count > 0) {
                toast.success(`${count} audit ${count === 1 ? 'event' : 'events'} deleted from ${label}.`)
            } else {
                toast.info(`No audit events were found for ${label}.`)
            }
            setBulkDeleteOpen(false)
            setBulkDeletePeriod(null)
            setPage(1)
            fetchEvents()
            fetchSummary()
        } catch (err) {
            setBulkDeleteError(err.message || 'Failed to delete audit logs.')
        } finally {
            setBulkDeleting(false)
        }
    }

    const openDetail = async (eventId) => {
        setDetailLoading(true)
        setDetailError(null)
        // Show a lightweight version from the list immediately
        const listEvent = events.find((e) => e.id === eventId)
        setDetailEvent(listEvent || null)
        try {
            const full = await getAuditLogDetail(eventId)
            setDetailEvent((prev) => ({ ...(prev || {}), ...full }))
        } catch (err) {
            console.error('Failed to load audit detail:', err)
            setDetailError(err.message || 'Failed to load event details.')
        } finally {
            setDetailLoading(false)
        }
    }

    const closeDetail = () => {
        setDetailEvent(null)
        setDetailError(null)
    }

    const deleteEvent = async () => {
        await deleteAuditLog(detailEvent.id)
        setEvents((prev) => prev.filter((item) => item.id !== detailEvent.id))
        setTotalCount((count) => Math.max(0, count - 1))
        fetchSummary()
        closeDetail()
    }

    const goToPage = (p) => {
        const next = Math.min(Math.max(1, p), totalPages)
        setPage(next)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const showMoreEvents = () => {
        setPageSize((size) => size + defaultPageSize)
        setPage(1)
    }

    const showLessEvents = () => {
        setPageSize(defaultPageSize)
        setPage(1)
    }

    // Derived
    const actionOptions = useMemo(
        () => actions.sort().map((a) => ({ value: a, label: formatAction(a) })),
        [actions]
    )

    const summaryCards = [
        { label: 'Events Today', value: summary.events_today ?? 0, icon: Activity, color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
        { label: 'Failed Today', value: summary.failed_today ?? 0, icon: AlertTriangle, color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
        { label: 'Security Warnings', value: summary.security_warnings ?? 0, icon: ShieldAlert, color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
        { label: 'Payment Errors', value: summary.payment_errors ?? 0, icon: Wallet, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
        { label: 'Admin Actions', value: summary.admin_actions ?? 0, icon: User, color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
        { label: 'System Errors', value: summary.system_errors ?? 0, icon: Bug, color: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
    ]

    const renderDesktopRow = (event) => {
        const catMeta = getCategoryMeta(event.category)
        const sevMeta = getSeverityMeta(event.severity)
        const resMeta = getResultMeta(event.result)
        const { time, date } = formatTimestamp(event.created_at)
        return (
            <TableRow
                key={event.id}
                className={cn('cursor-pointer transition', isDark ? 'hover:bg-slate-800/60 border-slate-800/50' : 'hover:bg-slate-50/80 border-slate-100')}
                onClick={() => openDetail(event.id)}
            >
                <TableCell><div><div className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>{time}</div><div className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>{date}</div></div></TableCell>
                <TableCell>
                    <div className={cn('text-sm font-medium', isDark ? 'text-slate-100' : 'text-slate-800')}>
                        {event.actor_display || 'System'}
                    </div>
                    {event.actor_role && <div className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>{event.actor_role}</div>}
                </TableCell>
                <TableCell>
                    <div className={cn('text-sm font-medium', isDark ? 'text-slate-100' : 'text-slate-800')}>{formatAction(event.action)}</div>
                    {event.description && <div className={cn('max-w-[260px] truncate text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>{event.description}</div>}
                </TableCell>
                <TableCell>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', catMeta.color)}>
                        {catMeta.label}
                    </span>
                </TableCell>
                <TableCell>
                    <div className={cn('text-sm font-medium', isDark ? 'text-slate-100' : 'text-slate-800')}>
                        {event.target_display || event.target_id || '—'}
                    </div>
                    {event.target_type && <div className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>{event.target_type}</div>}
                </TableCell>
                <TableCell>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', sevMeta.color)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', sevMeta.dot)} />
                        {sevMeta.label}
                    </span>
                </TableCell>
                <TableCell>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', resMeta.color)}>
                        {resMeta.label}
                    </span>
                </TableCell>
                <TableCell>
                    <button className={cn('rounded-lg border px-2.5 py-1 text-xs font-semibold transition', isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300')}>
                        Details
                    </button>
                </TableCell>
            </TableRow>
        )
    }

    const renderMobileCard = (event, index) => {
        const catMeta = getCategoryMeta(event.category)
        const sevMeta = getSeverityMeta(event.severity)
        const resMeta = getResultMeta(event.result)
        const { time, date } = formatTimestamp(event.created_at)
        return (
            <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                onClick={() => openDetail(event.id)}
                className={cn(
                    'cursor-pointer rounded-2xl border p-4 transition',
                    isDark ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900 shadow-lg shadow-black/5' : 'border-slate-200 bg-white hover:shadow-md shadow-sm'
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', catMeta.color)}>
                            <ClipboardList className="h-4 w-4" />
                        </div>
                        <div>
                            <div className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                                {formatAction(event.action)}
                            </div>
                            <div className={cn('mt-0.5 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                                {event.actor_display || 'System'} · {time} {date}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', resMeta.color)}>
                            {resMeta.label}
                        </span>
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', sevMeta.color)}>
                            {sevMeta.label}
                        </span>
                    </div>
                </div>

                {event.description && (
                    <p className={cn('mt-3 line-clamp-2 text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-500')}>
                        {event.description}
                    </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', catMeta.color)}>
                        {catMeta.label}
                    </span>
                    <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        {event.target_type} · {event.target_display || event.target_id || '—'}
                    </span>
                </div>
            </motion.article>
        )
    }

    return (
        <div className={cn('min-h-screen flex', isDark ? 'bg-slate-950' : 'bg-slate-50')}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="min-w-0 flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={cn('mx-auto w-full px-4 py-6 sm:px-5 lg:px-8', isDark ? 'bg-slate-950' : 'bg-slate-50')}>
                    {/* Header */}
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className={cn('flex items-center gap-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                                <span>Dashboard</span>
                                <span>/</span>
                                <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>Audit Log</span>
                            </div>
                            <h1 className={cn('mt-2 text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                                Audit Log
                            </h1>
                            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                                Historical record of all important platform activity.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMobileFiltersOpen(true)}
                            className={cn('lg:hidden rounded-xl gap-1.5', isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {[category, action, severity, result, targetType, range, dateFrom, dateTo, debouncedSearch].filter(Boolean).length}
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Summary cards */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                        {summaryCards.map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className={cn('rounded-2xl border p-4 transition', isDark ? 'border-slate-800 bg-slate-900/80 shadow-lg shadow-black/5 hover:bg-slate-900' : 'border-slate-200 bg-white shadow-sm hover:shadow-md')}>
                                <div className={cn('mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl', color)}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>{value}</div>
                                <div className={cn('mt-0.5 text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop filters */}
                    <div className={cn(
                        'mb-4 hidden rounded-2xl border p-5 lg:block',
                        isDark ? 'border-slate-800 bg-slate-900/80 shadow-lg shadow-black/5' : 'border-slate-200 bg-white shadow-sm'
                    )}>
                        {/* Header row */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className={cn('flex items-center gap-2 text-sm font-semibold', isDark ? 'text-slate-200' : 'text-slate-700')}>
                                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                                    <Filter className={cn('h-3.5 w-3.5', isDark ? 'text-slate-400' : 'text-slate-500')} />
                                </div>
                                Filters
                                {hasActiveFilters && (
                                    <span className={cn('ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold', isDark ? 'bg-[#3b7cb8]/20 text-[#5ba3e0]' : 'bg-[#255070]/10 text-[#255070]')}>
                                        {[category, action, severity, result, targetType, range, dateFrom, dateTo, debouncedSearch].filter(Boolean).length}
                                    </span>
                                )}
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={resetFilters}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                                        isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    )}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Filter controls row 1: search + primary filters */}
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[200px] flex-1 sm:min-w-[260px]">
                                <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>Search</label>
                                <div className="relative">
                                    <Search className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                                    <Input
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                        placeholder="Search events, actors, targets..."
                                        className={cn(
                                            'rounded-xl border-slate-200 bg-white pl-9 focus:border-[#255070] focus:ring-[#255070]/20',
                                            'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500',
                                            'dark:focus:border-[#3b7cb8] dark:focus:ring-[#3b7cb8]/20'
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="w-[160px]">
                                <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>Category</label>
                                <Select options={CATEGORIES} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} />
                            </div>
                            <div className="w-[160px]">
                                <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>Action</label>
                                <Select options={actionOptions} value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} placeholder="All Actions" />
                            </div>
                            <div className="w-[130px]">
                                <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>Severity</label>
                                <Select options={SEVERITIES} value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }} />
                            </div>
                            <div className="w-[130px]">
                                <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>Result</label>
                                <Select options={RESULTS} value={result} onChange={(e) => { setResult(e.target.value); setPage(1) }} />
                            </div>
                            <div className="w-[150px]">
                                <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>Object Type</label>
                                <Select options={TARGET_TYPES} value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1) }} />
                            </div>
                        </div>

                        {/* Filter controls row 2: date range */}
                        <div className={cn('mt-3 flex flex-wrap items-end gap-3 border-t pt-3', isDark ? 'border-slate-800' : 'border-slate-100')}>
                            <div className="w-[160px]">
                                <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>Date Range</label>
                                <Select options={RANGES} value={range} onChange={(e) => { setRange(e.target.value); setPage(1) }} />
                            </div>
                            {range === 'custom' && (
                                <>
                                    <div className="w-[170px]">
                                        <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>From</label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                                            className={cn(
                                                'rounded-xl border-slate-200 bg-white focus:border-[#255070] focus:ring-[#255070]/20',
                                                'dark:border-slate-600 dark:bg-slate-800 dark:text-white',
                                                'dark:focus:border-[#3b7cb8] dark:focus:ring-[#3b7cb8]/20'
                                            )}
                                        />
                                    </div>
                                    <div className="w-[170px]">
                                        <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>To</label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                                            className={cn(
                                                'rounded-xl border-slate-200 bg-white focus:border-[#255070] focus:ring-[#255070]/20',
                                                'dark:border-slate-600 dark:bg-slate-800 dark:text-white',
                                                'dark:focus:border-[#3b7cb8] dark:focus:ring-[#3b7cb8]/20'
                                            )}
                                        />
                                    </div>
                                    <div className={cn('rounded-xl border px-3.5 py-2.5 text-xs', isDark ? 'border-slate-700 bg-slate-800/50 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500')}>
                                        {dateFrom && dateTo
                                            ? <>Events between <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{dateFrom}</strong> and <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{dateTo}</strong></>
                                            : 'Pick start and end dates'}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Active filter chips */}
                        {hasActiveFilters && (
                            <div className={cn('mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3', isDark ? 'border-slate-800' : 'border-slate-100')}>
                                <span className={cn('text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>Active:</span>
                                {debouncedSearch && (
                                    <FilterChip label={`Search: "${debouncedSearch}"`} onClear={() => { setSearch(''); setPage(1) }} isDark={isDark} />
                                )}
                                {category && (
                                    <FilterChip label={`Category: ${CATEGORIES.find(c => c.value === category)?.label || category}`} onClear={() => { setCategory(''); setPage(1) }} isDark={isDark} />
                                )}
                                {action && (
                                    <FilterChip label={`Action: ${formatAction(action)}`} onClear={() => { setAction(''); setPage(1) }} isDark={isDark} />
                                )}
                                {severity && (
                                    <FilterChip label={`Severity: ${SEVERITIES.find(s => s.value === severity)?.label || severity}`} onClear={() => { setSeverity(''); setPage(1) }} isDark={isDark} />
                                )}
                                {result && (
                                    <FilterChip label={`Result: ${RESULTS.find(r => r.value === result)?.label || result}`} onClear={() => { setResult(''); setPage(1) }} isDark={isDark} />
                                )}
                                {targetType && (
                                    <FilterChip label={`Type: ${TARGET_TYPES.find(t => t.value === targetType)?.label || targetType}`} onClear={() => { setTargetType(''); setPage(1) }} isDark={isDark} />
                                )}
                                {range && (
                                    <FilterChip label={`Range: ${RANGES.find(r => r.value === range)?.label || range}`} onClear={() => { setRange(''); setPage(1) }} isDark={isDark} />
                                )}
                                {dateFrom && (
                                    <FilterChip label={`From: ${dateFrom}`} onClear={() => { setDateFrom(''); setPage(1) }} isDark={isDark} />
                                )}
                                {dateTo && (
                                    <FilterChip label={`To: ${dateTo}`} onClear={() => { setDateTo(''); setPage(1) }} isDark={isDark} />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile filters drawer */}
                    <AnimatePresence>
                        {mobileFiltersOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
                                    onClick={() => setMobileFiltersOpen(false)}
                                />
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                    className={cn(
                                        'fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col lg:hidden',
                                        isDark ? 'bg-slate-950 border-l border-slate-800' : 'bg-white border-l border-slate-200'
                                    )}
                                >
                                    {/* Sticky header */}
                                    <div className={cn('flex items-center justify-between border-b px-5 py-4', isDark ? 'border-slate-800' : 'border-slate-200')}>
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                                                <Filter className={cn('h-3.5 w-3.5', isDark ? 'text-slate-400' : 'text-slate-500')} />
                                            </div>
                                            <h2 className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>Filters</h2>
                                            {hasActiveFilters && (
                                                <span className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold', isDark ? 'bg-[#3b7cb8]/20 text-[#5ba3e0]' : 'bg-[#255070]/10 text-[#255070]')}>
                                                    {[category, action, severity, result, targetType, range, dateFrom, dateTo, debouncedSearch].filter(Boolean).length}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setMobileFiltersOpen(false)}
                                            className={cn('rounded-xl p-2 transition', isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')}
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Scrollable filter body */}
                                    <div className="flex-1 overflow-y-auto px-5 py-4">
                                        <div className="space-y-5">
                                            <MobileFilterGroup label="Search" isDark={isDark}>
                                                <div className="relative">
                                                    <Search className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                                                    <Input
                                                        value={search}
                                                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                                        placeholder="Search events..."
                                                        className={cn(
                                                            'rounded-xl border-slate-200 bg-white pl-9 focus:border-[#255070] focus:ring-[#255070]/20',
                                                            'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500',
                                                            'dark:focus:border-[#3b7cb8] dark:focus:ring-[#3b7cb8]/20'
                                                        )}
                                                    />
                                                </div>
                                            </MobileFilterGroup>

                                            <MobileFilterGroup label="Category" isDark={isDark}>
                                                <Select options={CATEGORIES} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} />
                                            </MobileFilterGroup>

                                            <MobileFilterGroup label="Action" isDark={isDark}>
                                                <Select options={actionOptions} value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} placeholder="All Actions" />
                                            </MobileFilterGroup>

                                            <div className="grid grid-cols-2 gap-3">
                                                <MobileFilterGroup label="Severity" isDark={isDark}>
                                                    <Select options={SEVERITIES} value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }} />
                                                </MobileFilterGroup>
                                                <MobileFilterGroup label="Result" isDark={isDark}>
                                                    <Select options={RESULTS} value={result} onChange={(e) => { setResult(e.target.value); setPage(1) }} />
                                                </MobileFilterGroup>
                                            </div>

                                            <MobileFilterGroup label="Actor" isDark={isDark}>
                                                <Input
                                                    value={actor}
                                                    onChange={(e) => { setActor(e.target.value); setPage(1) }}
                                                    placeholder="User, admin, or system"
                                                    className={cn(
                                                        'rounded-xl border-slate-200 bg-white focus:border-[#255070] focus:ring-[#255070]/20',
                                                        'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500',
                                                        'dark:focus:border-[#3b7cb8] dark:focus:ring-[#3b7cb8]/20'
                                                    )}
                                                />
                                            </MobileFilterGroup>

                                            <MobileFilterGroup label="Object Type" isDark={isDark}>
                                                <Select options={TARGET_TYPES} value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1) }} />
                                            </MobileFilterGroup>

                                            <div className={cn('border-t pt-5', isDark ? 'border-slate-800' : 'border-slate-100')}>
                                                <MobileFilterGroup label="Date Range" isDark={isDark}>
                                                    <Select options={RANGES} value={range} onChange={(e) => { setRange(e.target.value); setPage(1) }} />
                                                </MobileFilterGroup>
                                                <div className="mt-3 grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>From</label>
                                                        <Input
                                                            type="date"
                                                            value={dateFrom}
                                                            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                                                            className={cn(
                                                                'rounded-xl border-slate-200 bg-white focus:border-[#255070] focus:ring-[#255070]/20',
                                                                'dark:border-slate-600 dark:bg-slate-800 dark:text-white',
                                                                'dark:focus:border-[#3b7cb8] dark:focus:ring-[#3b7cb8]/20'
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>To</label>
                                                        <Input
                                                            type="date"
                                                            value={dateTo}
                                                            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                                                            className={cn(
                                                                'rounded-xl border-slate-200 bg-white focus:border-[#255070] focus:ring-[#255070]/20',
                                                                'dark:border-slate-600 dark:bg-slate-800 dark:text-white',
                                                                'dark:focus:border-[#3b7cb8] dark:focus:ring-[#3b7cb8]/20'
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sticky footer */}
                                    <div className={cn('flex items-center gap-3 border-t px-5 py-4', isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white')}>
                                        <Button variant="outline" onClick={resetFilters} className={cn('flex-1 rounded-xl', isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
                                            Reset all
                                        </Button>
                                        <Button onClick={() => setMobileFiltersOpen(false)} className="flex-1 rounded-xl bg-[#255070] text-white hover:bg-[#1c4159]">
                                            Apply filters
                                        </Button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Content */}
                    <div className={cn('overflow-hidden rounded-2xl border shadow-sm', isDark ? 'border-slate-800 bg-slate-900/80 shadow-lg shadow-black/5' : 'border-slate-200 bg-white shadow-sm')}>
                        {/* Toolbar */}
                        <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5', isDark ? 'border-slate-800' : 'border-slate-100')}>
                            <div className="flex items-center gap-3">
                                <div className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                                    {loading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#255070] dark:text-[#5ba3e0]" />
                                            Loading...
                                        </span>
                                    ) : (
                                        <span>
                                            <strong className={isDark ? 'text-white' : 'text-slate-900'}>{totalCount}</strong>{' '}
                                            event{totalCount !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                {pageSize > defaultPageSize && (
                                    <button
                                        onClick={showLessEvents}
                                        disabled={loading}
                                        className={cn(
                                            'text-xs font-medium transition',
                                            isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                                        )}
                                    >
                                        Show less
                                    </button>
                                )}
                                {totalCount > pageSize && !loading && (
                                    <button
                                        onClick={showMoreEvents}
                                        className="text-xs font-medium text-[#255070] transition hover:text-[#1c4159] dark:text-[#5ba3e0] dark:hover:text-[#7bb8e8]"
                                    >
                                        Show more
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        variant="destructive"
                                        size="sm"
                                        disabled={loading}
                                        className={cn('rounded-xl', isDark ? 'border-red-500/30' : 'border-red-200')}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Logs
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-72">
                                        <div className={cn('px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                            Bulk delete audit logs
                                        </div>
                                        <DropdownMenuSeparator />
                                        {DELETE_PERIODS.map((period) => (
                                            <DropdownMenuItem
                                                key={period.value}
                                                onClick={() => openBulkDelete(period.value)}
                                                className="flex-col items-start gap-0.5 !py-2.5"
                                            >
                                                <span className="text-sm font-medium">{period.label}</span>
                                                <span className={cn('text-xs leading-snug', isDark ? 'text-slate-400' : 'text-slate-500')}>{period.description}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className={cn('flex items-center gap-1 rounded-xl border p-0.5', isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50')}>
                                    <button
                                        onClick={() => goToPage(page - 1)}
                                        disabled={page <= 1 || loading}
                                        className={cn('rounded-lg p-1.5 transition', isDark ? 'text-slate-400 hover:bg-slate-700 disabled:opacity-30' : 'text-slate-500 hover:bg-white disabled:opacity-30')}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className={cn('min-w-[60px] text-center text-xs font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => goToPage(page + 1)}
                                        disabled={page >= totalPages || loading}
                                        className={cn('rounded-lg p-1.5 transition', isDark ? 'text-slate-400 hover:bg-slate-700 disabled:opacity-30' : 'text-slate-500 hover:bg-white disabled:opacity-30')}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className={cn('w-full', isDark ? 'bg-slate-900/80' : 'bg-white')}>
                                <thead>
                                    <tr className={cn('border-b', isDark ? 'border-slate-800' : 'border-slate-100')}>
                                        {['Time', 'Actor', 'Action', 'Category', 'Target', 'Severity', 'Result', 'Details'].map((h) => (
                                            <th key={h} className={cn('px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {error ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center">
                                                <div className={cn('mb-2 text-sm font-medium', isDark ? 'text-red-300' : 'text-red-600')}>{error}</div>
                                                <button onClick={fetchEvents} className={cn('text-xs font-semibold underline', isDark ? 'text-blue-300' : 'text-blue-600')}>Try again</button>
                                            </td>
                                        </tr>
                                    ) : events.length === 0 && !loading ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-16 text-center">
                                                <div className={cn('mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                                                    <ClipboardList className={cn('h-6 w-6', isDark ? 'text-slate-500' : 'text-slate-400')} />
                                                </div>
                                                <div className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>No audit events found</div>
                                                <div className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                                    {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Audit events will appear here as platform activity occurs.'}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        events.map(renderDesktopRow)
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="space-y-3 p-3 md:hidden">
                            {error ? (
                                <div className={cn('rounded-xl border p-8 text-center', isDark ? 'border-red-500/30' : 'border-red-200')}>
                                    <div className={cn('mb-2 text-sm font-medium', isDark ? 'text-red-300' : 'text-red-600')}>{error}</div>
                                    <button onClick={fetchEvents} className={cn('text-xs font-semibold underline', isDark ? 'text-blue-300' : 'text-blue-600')}>Try again</button>
                                </div>
                            ) : events.length === 0 && !loading ? (
                                <div className={cn('rounded-xl border p-8 text-center', isDark ? 'border-slate-800' : 'border-slate-200')}>
                                    <div className={cn('mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full', isDark ? 'bg-slate-800' : 'bg-slate-100')}>
                                        <ClipboardList className={cn('h-6 w-6', isDark ? 'text-slate-500' : 'text-slate-400')} />
                                    </div>
                                    <div className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>No audit events found</div>
                                    <div className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                        {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Audit events will appear here as platform activity occurs.'}
                                    </div>
                                </div>
                            ) : (
                                events.map(renderMobileCard)
                            )}
                        </div>
                    </div>

                    {/* Mobile pagination */}
                    <div className={cn('mt-4 flex items-center justify-between rounded-2xl border px-4 py-3 md:hidden', isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white')}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => goToPage(page - 1)}
                            disabled={page <= 1 || loading}
                            className={cn('gap-1.5 rounded-xl', isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50')}
                        >
                            <ChevronLeft className="h-4 w-4" /> Prev
                        </Button>
                        <span className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                            {page} of {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => goToPage(page + 1)}
                            disabled={page >= totalPages || loading}
                            className={cn('gap-1.5 rounded-xl', isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50')}
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </main>
            </div>

            {/* Bulk delete confirmation */}
            <Dialog open={bulkDeleteOpen} onOpenChange={(open) => {
                if (!bulkDeleting) {
                    setBulkDeleteOpen(open)
                    if (!open) setBulkDeletePeriod(null)
                }
            }}>
                <DialogContent showCloseButton={!bulkDeleting}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-red-500" />
                            {activeDeletePeriod?.label || 'Delete audit logs'}
                        </DialogTitle>
                        <DialogDescription>
                            <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                                This will {activeDeletePeriod?.description?.toLowerCase() || 'permanently delete audit records.'}
                            </p>
                            <p className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                This action is permanent and cannot be undone. Delete only if you're certain these records are no longer needed for audit or compliance purposes.
                            </p>
                        </DialogDescription>
                    </DialogHeader>

                    {bulkDeleteError && (
                        <div className={cn('rounded-lg border p-3 text-sm', isDark ? 'border-red-500/30 text-red-300' : 'border-red-200 text-red-600')}>
                            {bulkDeleteError}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmBulkDelete} disabled={bulkDeleting}>
                            {bulkDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {bulkDeleting ? 'Deleting...' : 'Yes, delete permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details drawer */}
            <AnimatePresence>
                {detailEvent && (
                    <AuditDetailDrawer
                        event={detailEvent}
                        loading={detailLoading}
                        error={detailError}
                        onClose={closeDetail}
                        onDelete={deleteEvent}
                        isDark={isDark}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function AuditDetailDrawer({ event, loading, error, onClose, onDelete, isDark }) {
    const catMeta = getCategoryMeta(event.category)
    const sevMeta = getSeverityMeta(event.severity)
    const resMeta = getResultMeta(event.result)
    const formatted = formatTimestamp(event.created_at)
    const [deleteConfirming, setDeleteConfirming] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteError, setDeleteError] = useState(null)

    const handleDelete = async () => {
        setDeleteLoading(true)
        setDeleteError(null)
        try {
            await onDelete()
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete audit event.')
            setDeleteLoading(false)
        }
    }

    const renderJsonBlock = (obj) => {
        if (!obj || typeof obj !== 'object') {
            return <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>—</span>
        }
        const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '')
        if (entries.length === 0) {
            return <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-400')}>—</span>
        }
        return (
            <pre className={cn(
                'overflow-x-auto rounded-lg p-3 text-xs leading-relaxed',
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'
            )}>
                {Object.entries(obj).map(([key, value]) => {
                    const display = typeof value === 'object' ? JSON.stringify(value) : String(value)
                    return (
                        <div key={key} className="grid grid-cols-[minmax(0,120px)_1fr] gap-2">
                            <span className={cn('font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>{key}</span>
                            <span className="break-all">{display}</span>
                        </div>
                    )
                })}
            </pre>
        )
    }

    const Section = ({ title, children }) => (
        <div className="mb-5">
            <h3 className={cn('mb-2 text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-500')}>{title}</h3>
            {children}
        </div>
    )

    const Row = ({ label, value }) => (
        <div className="mb-1.5 grid grid-cols-[minmax(0,110px)_1fr] gap-2">
            <span className={cn('text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>{label}</span>
            <span className={cn('break-all text-xs', isDark ? 'text-slate-200' : 'text-slate-800')}>{value || '—'}</span>
        </div>
    )

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className={cn(
                    'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l',
                    isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                )}
            >
                <div className={cn('flex items-center justify-between border-b px-4 py-4', isDark ? 'border-slate-800' : 'border-slate-200')}>
                    <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-slate-900')}>Event Details</h2>
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className={cn('h-4 w-4 animate-spin', isDark ? 'text-slate-400' : 'text-slate-500')} />}
                        <button type="button" onClick={onClose} className={cn('rounded-lg p-1.5 transition', isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')}>
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {error && (
                        <div className={cn('mb-4 rounded-lg border p-3 text-sm', isDark ? 'border-red-500/30 text-red-300' : 'border-red-200 text-red-600')}>
                            {error}
                        </div>
                    )}

                    {/* Event badges */}
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', catMeta.color)}>
                            {catMeta.label}
                        </span>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', sevMeta.color)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', sevMeta.dot)} />
                            {sevMeta.label}
                        </span>
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', resMeta.color)}>
                            {resMeta.label}
                        </span>
                    </div>

                    {/* Event */}
                    <Section title="Event">
                        <Row label="Action" value={formatAction(event.action)} />
                        <Row label="Timestamp" value={`${formatted.date} ${formatted.time}`} />
                        <Row label="Category" value={catMeta.label} />
                        <Row label="Severity" value={sevMeta.label} />
                        <Row label="Result" value={resMeta.label} />
                        <Row label="Correlation ID" value={event.correlation_id} />
                    </Section>

                    {/* Actor */}
                    <Section title="Actor">
                        <Row label="Name" value={event.actor_display || 'System'} />
                        <Row label="Role" value={event.actor_role || 'system'} />
                        {event.actor_email && <Row label="Email" value={event.actor_email} />}
                        {event.actor_user_id && <Row label="User ID" value={event.actor_user_id} />}
                    </Section>

                    {/* Target */}
                    <Section title="Target">
                        <Row label="Type" value={event.target_type || '—'} />
                        <Row label="ID / Reference" value={event.target_id || '—'} />
                        <Row label="Display" value={event.target_display || '—'} />
                    </Section>

                    {/* Description */}
                    {event.description && (
                        <Section title="Description">
                            <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-300' : 'text-slate-700')}>{event.description}</p>
                        </Section>
                    )}

                    {/* State change */}
                    {(Object.keys(event.previous_state || {}).length > 0 || Object.keys(event.new_state || {}).length > 0) && (
                        <Section title="State Change">
                            <div className="space-y-2">
                                {Object.keys(event.previous_state || {}).length > 0 && (
                                    <div>
                                        <div className={cn('mb-1 text-xs font-semibold', isDark ? 'text-slate-500' : 'text-slate-500')}>Previous</div>
                                        {renderJsonBlock(event.previous_state)}
                                    </div>
                                )}
                                {Object.keys(event.new_state || {}).length > 0 && (
                                    <div>
                                        <div className={cn('mb-1 text-xs font-semibold', isDark ? 'text-slate-500' : 'text-slate-500')}>New</div>
                                        {renderJsonBlock(event.new_state)}
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Reason */}
                    {event.reason && (
                        <Section title="Reason">
                            <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-300' : 'text-slate-700')}>{event.reason}</p>
                        </Section>
                    )}

                    {/* Technical */}
                    <Section title="Technical">
                        <Row label="IP Address" value={event.ip_address || '—'} />
                        <Row label="User Agent" value={event.user_agent || '—'} />
                    </Section>

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <Section title="Metadata">
                            {renderJsonBlock(event.metadata)}
                        </Section>
                    )}

                    {event.error_message && (
                        <Section title="Error">
                            <p className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-600')}>{event.error_message}</p>
                        </Section>
                    )}

                    {deleteError && (
                        <div className={cn('mb-3 rounded-lg border p-3 text-sm', isDark ? 'border-red-500/30 text-red-300' : 'border-red-200 text-red-600')}>
                            {deleteError}
                        </div>
                    )}

                    <div className={cn('mt-6 border-t pt-4', isDark ? 'border-slate-800' : 'border-slate-200')}>
                        {!deleteConfirming ? (
                            <Button type="button" variant="destructive" onClick={() => setDeleteConfirming(true)} disabled={deleteLoading}>
                                <Trash2 className="h-4 w-4" />
                                Delete event
                            </Button>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn('text-sm font-semibold', isDark ? 'text-slate-200' : 'text-slate-700')}>Are you sure?</span>
                                <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                                    {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Yes, delete
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setDeleteConfirming(false)} disabled={deleteLoading}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    )
}

export default AuditLog
