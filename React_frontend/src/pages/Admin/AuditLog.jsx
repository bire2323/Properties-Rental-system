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
import { deleteAuditLog, getAuditLogs, getAuditLogDetail, getAuditLogSummary } from '../../api/admin/auditApi'
import { Button, Input, Select, Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '../../components/ui'
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
                range,
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
                className={cn('cursor-pointer', isDark ? 'hover:bg-slate-800/60 border-slate-800' : 'hover:bg-slate-50 border-slate-100')}
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
                    <button className={cn('rounded-lg border px-2.5 py-1 text-xs font-semibold transition', isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
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
                    'cursor-pointer rounded-xl border p-4 transition',
                    isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800/60' : 'border-slate-200 bg-white hover:bg-slate-50'
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
                            className={cn('lg:hidden', isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700')}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {hasActiveFilters && <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />}
                        </Button>
                    </div>

                    {/* Summary cards */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                        {summaryCards.map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className={cn('rounded-xl border p-3 sm:p-4', isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
                                <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg', color)}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-slate-900')}>{value}</div>
                                <div className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop filters */}
                    <div className={cn(
                        'mb-4 hidden rounded-xl border p-4 lg:block',
                        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                    )}>
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-3">
                                <div className="relative">
                                    <Search className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                                    <Input
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                        placeholder="Search events..."
                                        className={cn('pl-9', isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900')}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <Select options={CATEGORIES} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} />
                            </div>
                            <div className="col-span-2">
                                <Select options={actionOptions} value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} placeholder="All Actions" />
                            </div>
                            <div className="col-span-1">
                                <Select options={SEVERITIES} value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }} />
                            </div>
                            <div className="col-span-1">
                                <Select options={RESULTS} value={result} onChange={(e) => { setResult(e.target.value); setPage(1) }} />
                            </div>
                            <div className="col-span-1">
                                <Select options={TARGET_TYPES} value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1) }} />
                            </div>
                            <div className="col-span-2">
                                <Select options={RANGES} value={range} onChange={(e) => { setRange(e.target.value); setPage(1) }} />
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <div className="mt-3 flex items-center justify-between">
                                <span className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                                    Showing {events.length} of {totalCount} events
                                </span>
                                <button onClick={resetFilters} className={cn('text-xs font-semibold', isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700')}>
                                    Clear all filters
                                </button>
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
                                    transition={{ type: 'tween', duration: 0.25 }}
                                    className={cn(
                                        'fixed inset-y-0 right-0 z-50 w-[88%] max-w-sm overflow-y-auto p-4 lg:hidden',
                                        isDark ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-slate-200'
                                    )}
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-slate-900')}>Filters</h2>
                                        <button onClick={() => setMobileFiltersOpen(false)} className={cn('rounded-lg p-1.5', isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100')}>
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>Search</label>
                                            <div className="relative">
                                                <Search className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                                                <Input
                                                    value={search}
                                                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                                    placeholder="Search events..."
                                                    className={cn('pl-9', isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50')}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>Category</label>
                                            <Select options={CATEGORIES} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} />
                                        </div>
                                        <div>
                                            <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>Action</label>
                                            <Select options={actionOptions} value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} placeholder="All Actions" />
                                        </div>
                                        <div>
                                            <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>Severity</label>
                                            <Select options={SEVERITIES} value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }} />
                                        </div>
                                        <div>
                                            <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>Result</label>
                                            <Select options={RESULTS} value={result} onChange={(e) => { setResult(e.target.value); setPage(1) }} />
                                        </div>
                                        <div>
                                            <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>Actor</label>
                                            <Input
                                                value={actor}
                                                onChange={(e) => { setActor(e.target.value); setPage(1) }}
                                                placeholder="User, admin, or system"
                                                className={isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50'}
                                            />
                                        </div>
                                        <div>
                                            <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>Object Type</label>
                                            <Select options={TARGET_TYPES} value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1) }} />
                                        </div>
                                        <div>
                                            <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>Date Range</label>
                                            <Select options={RANGES} value={range} onChange={(e) => { setRange(e.target.value); setPage(1) }} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>From</label>
                                                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className={isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50'} />
                                            </div>
                                            <div>
                                                <label className={cn('mb-1.5 block text-xs font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>To</label>
                                                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className={isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50'} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <Button variant="outline" onClick={resetFilters} className={isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'}>
                                                Reset
                                            </Button>
                                            <Button onClick={() => setMobileFiltersOpen(false)} className="bg-[#255070] text-white hover:bg-[#1c4159]">
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Content */}
                    <div className={cn('overflow-hidden rounded-xl border shadow-sm', isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
                        {/* Toolbar */}
                        <div className={cn('flex items-center justify-between gap-3 border-b px-4 py-3', isDark ? 'border-slate-800' : 'border-slate-200')}>
                            <div className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                                {loading ? (
                                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</span>
                                ) : (
                                    <span><strong className={isDark ? 'text-white' : 'text-slate-900'}>{totalCount}</strong> events</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {pageSize > defaultPageSize && (
                                    <Button variant="outline" size="sm" onClick={showLessEvents} disabled={loading}>
                                        View less
                                    </Button>
                                )}
                                {totalCount > pageSize && (
                                    <Button variant="outline" size="sm" onClick={showMoreEvents} disabled={loading}>
                                        View more
                                    </Button>
                                )}
                                <button
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page <= 1 || loading}
                                    className={cn('rounded-lg border p-1.5 transition', isDark ? 'border-slate-700 text-slate-300 disabled:opacity-40' : 'border-slate-200 text-slate-600 disabled:opacity-40')}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className={cn('px-2 text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>{page} / {totalPages}</span>
                                <button
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page >= totalPages || loading}
                                    className={cn('rounded-lg border p-1.5 transition', isDark ? 'border-slate-700 text-slate-300 disabled:opacity-40' : 'border-slate-200 text-slate-600 disabled:opacity-40')}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className={cn('w-full', isDark ? 'bg-slate-900' : 'bg-white')}>
                                <thead>
                                    <tr className={cn('border-b', isDark ? 'border-slate-800' : 'border-slate-200')}>
                                        {['Time', 'Actor', 'Action', 'Category', 'Target', 'Severity', 'Result', 'Details'].map((h) => (
                                            <th key={h} className={cn('px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>
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
                    <div className="mt-4 flex items-center justify-between md:hidden">
                        <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1 || loading} className={isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}>
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>Page {page} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading} className={isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}>
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </main>
            </div>

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
