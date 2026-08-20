import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search,
    ShieldCheck,
    MoreVertical,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../../components/ui'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '../../components/ui/dropdown-menu'
import { getOwnerVerificationList, updateOwnerVerificationStatus } from '../../api/admin/adminApi'

function formatDate(value) {
    if (!value) return 'Recently'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Recently'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getStatusClasses(statusValue, isDark) {
    const normalized = statusValue?.toLowerCase()

    if (normalized === 'approved') {
        return isDark ? 'text-emerald-400' : 'text-emerald-700'
    }
    if (normalized === 'rejected') {
        return isDark ? 'text-rose-400' : 'text-rose-700'
    }
    if (normalized === 'suspended') {
        return isDark ? 'text-slate-300' : 'text-slate-700'
    }

    return isDark ? 'text-amber-400' : 'text-amber-700'
}

function Verification() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [rows, setRows] = useState([])
    const [search, setSearch] = useState('')
    const [visibleCount, setVisibleCount] = useState(5)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [rejectionTarget, setRejectionTarget] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [saving, setSaving] = useState(false)
    const navigate = useNavigate()
    const { isDark } = useTheme()

    useEffect(() => {
        let active = true

        const loadRows = async () => {
            setLoading(true)
            setError('')

            try {
                const data = await getOwnerVerificationList(search)
                if (active) {
                    setRows(data)
                    setVisibleCount(5)
                }
            } catch (err) {
                if (active) {
                    setError(err.message || 'Unable to load verification requests.')
                    setRows([])
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        loadRows()
        return () => {
            active = false
        }
    }, [search])

    const displayedRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount])
    const hasMoreRows = rows.length > visibleCount

    const handleDecision = async (id, status, reason = '') => {
        setSaving(true)
        setError('')
        try {
            await updateOwnerVerificationStatus(id, status, reason)
            setRows((currentRows) =>
                currentRows.map((row) =>
                    row.id === id ? { ...row, status: status === 'approved' ? 'Approved' : 'Rejected', status_value: status, rejection_reason: reason } : row,
                ),
            )
        } catch (err) {
            setError(err.message || 'Unable to update verification status.')
        } finally {
            setSaving(false)
        }
    }

    const openRejectionDialog = (id) => {
        setRejectionTarget(id)
        setRejectionReason('')
    }

    const submitRejection = () => {
        const reason = rejectionReason.trim()
        if (!reason) {
            setError('Please enter a rejection reason.')
            return
        }
        handleDecision(rejectionTarget, 'rejected', reason)
        setRejectionTarget(null)
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
                        <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>Verification</span>
                    </div>

                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Verification</h1>
                    </div>

                    <div className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className="p-6">
                            <div className="relative w-full">
                                <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                <input
                                    type="text"
                                    placeholder="Search verification requests..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className={`w-full rounded-lg border px-3 py-2.5 pl-10 text-sm outline-none transition ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-slate-600' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-300'}`}
                                />
                            </div>

                            {error && (
                                <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                                    {error}
                                </div>
                            )}

                            <div className={`mt-6 overflow-hidden rounded-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left">
                                        <thead className={`text-xs uppercase tracking-wider ${isDark ? 'border-b border-slate-700 bg-slate-800 text-slate-400' : 'border-b border-slate-200 bg-slate-50 text-slate-500'}`}>
                                            <tr>
                                                <th className="px-6 py-4">Owner</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Document</th>
                                                <th className="px-6 py-4">Registered Date</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-slate-700 bg-slate-900' : 'divide-slate-200 bg-white'}`}>
                                            {!loading && displayedRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className={`px-6 py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        No verification requests found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                displayedRows.map((row) => (
                                                    <tr key={row.id} className={`transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img src={row.image || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'} alt={row.owner} className="h-10 w-10 rounded-full object-cover" />
                                                                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                    {row.owner}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            {row.email}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <ShieldCheck className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                                                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                                                                    {row.document || 'Document'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            {formatDate(row.registeredDate || row.created_at)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-xs font-semibold ${getStatusClasses(row.status_value || row.status, isDark)}`}>
                                                                {row.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        className={isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => navigate(`/admin-dashboard/verification/${row.id}`)}>
                                                                            View Details
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleDecision(row.id, 'approved')}>
                                                                            Approve
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => openRejectionDialog(row.id)}>
                                                                            Reject
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {!loading && rows.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setVisibleCount((prev) => (prev >= rows.length ? 5 : rows.length))}
                                    >
                                        {hasMoreRows ? 'View more' : 'View less'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Dialog open={Boolean(rejectionTarget)} onOpenChange={(open) => { if (!open) setRejectionTarget(null) }}>
                        <DialogContent className={isDark ? 'border-slate-700 bg-slate-900 text-white' : ''}>
                            <DialogHeader>
                                <DialogTitle className={isDark ? 'text-white' : ''}>Reject Verification</DialogTitle>
                                <DialogDescription className={isDark ? 'text-slate-400' : ''}>
                                    Enter the reason that will be saved with this rejection.
                                </DialogDescription>
                            </DialogHeader>
                            <textarea
                                value={rejectionReason}
                                onChange={(event) => setRejectionReason(event.target.value)}
                                placeholder="Rejection reason"
                                rows={4}
                                autoFocus
                                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-400'}`}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setRejectionTarget(null)} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button type="button" variant="destructive" onClick={submitRejection} disabled={saving}>
                                    {saving ? 'Saving...' : 'Reject User'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    )
}

export default Verification
