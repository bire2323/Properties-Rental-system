import { useEffect, useMemo, useState } from 'react'
import {
    ArrowDownRight,
    ArrowUpRight,
    Download,
    MoreHorizontal,
    Search,
    Sparkles,
    WalletCards,
    CheckCircle2,
    XCircle,
    Clock3,
    Building2,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { Select } from '../../components/ui'
import { getAdminPayments } from '../../api/admin/adminApi'

const getStatusClasses = (status) => {
    if (status === 'Successful') return 'bg-emerald-100 text-emerald-700'
    if (status === 'Pending') return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
}

function Payments() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('All Status')
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('All Payment Methods')
    const [visibleCount, setVisibleCount] = useState(3)
    const [paymentRows, setPaymentRows] = useState([])
    const [loading, setLoading] = useState(true)
    const { isDark } = useTheme()

    useEffect(() => {
        const loadPayments = async () => {
            try {
                setLoading(true)
                const data = await getAdminPayments()
                setPaymentRows(data)
            } catch (error) {
                console.error('Error loading payments:', error)
                setPaymentRows([])
            } finally {
                setLoading(false)
            }
        }

        loadPayments()
    }, [])

    const totalRevenue = useMemo(() => {
        return paymentRows.reduce((sum, payment) => {
            const amount = Number(String(payment.amount).replace(/[^\d.-]/g, '')) || 0
            return sum + amount
        }, 0)
    }, [paymentRows])

    const successfulPayments = useMemo(() => {
        return paymentRows.filter((payment) => payment.status === 'Successful').reduce((sum, payment) => {
            const amount = Number(String(payment.amount).replace(/[^\d.-]/g, '')) || 0
            return sum + amount
        }, 0)
    }, [paymentRows])

    const pendingPayments = useMemo(() => {
        return paymentRows.filter((payment) => payment.status === 'Pending').reduce((sum, payment) => {
            const amount = Number(String(payment.amount).replace(/[^\d.-]/g, '')) || 0
            return sum + amount
        }, 0)
    }, [paymentRows])

    const failedPayments = useMemo(() => {
        return paymentRows.filter((payment) => payment.status === 'Failed').reduce((sum, payment) => {
            const amount = Number(String(payment.amount).replace(/[^\d.-]/g, '')) || 0
            return sum + amount
        }, 0)
    }, [paymentRows])

    const statCards = [
        { label: 'Total Revenue', value: `ETB ${totalRevenue.toLocaleString('en-US')}`, icon: WalletCards, tone: 'text-blue-600', bg: 'bg-blue-100 text-blue-600' },
        { label: 'Successful Payments', value: `ETB ${successfulPayments.toLocaleString('en-US')}`, icon: CheckCircle2, tone: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-600' },
        { label: 'Pending Payments', value: `ETB ${pendingPayments.toLocaleString('en-US')}`, icon: Clock3, tone: 'text-amber-600', bg: 'bg-amber-100 text-amber-600' },
        { label: 'Failed Payments', value: `ETB ${failedPayments.toLocaleString('en-US')}`, icon: XCircle, tone: 'text-red-600', bg: 'bg-red-100 text-red-600' },
    ]

    const filteredPayments = useMemo(() => {
        return paymentRows.filter((payment) => {
            const matchesSearch =
                !searchTerm ||
                payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                payment.method.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === 'All Status' || payment.status === statusFilter
            const matchesMethod =
                paymentMethodFilter === 'All Payment Methods' || payment.method === paymentMethodFilter

            return matchesSearch && matchesStatus && matchesMethod
        })
    }, [paymentMethodFilter, paymentRows, searchTerm, statusFilter])

    const displayedPayments = filteredPayments.slice(0, visibleCount)
    const hasMore = filteredPayments.length > visibleCount
    const hasLess = visibleCount > 3

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="min-w-0 flex-1 overflow-x-hidden">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center gap-2 text-sm">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Dashboard</span>
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
                        <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>Payments</span>
                    </div>

                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Payments</h1>
                        <button
                            type="button"
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>

                    {paymentRows.length > 0 && (
                        <div className="mb-6 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 md:grid-cols-2 xl:grid-cols-4">
                            {statCards.map((item) => {
                                const Icon = item.icon
                                const isUp = item.trend === 'up'

                                return (
                                    <div key={item.label} className={`min-w-0 rounded-md border p-2 shadow-sm sm:p-3 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-md ${item.bg}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className={`flex items-center gap-1 text-[10px] font-semibold ${item.tone}`}>
                                                {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {item.change}
                                            </div>
                                        </div>
                                        <div className={`mt-2 truncate text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {item.label}
                                        </div>
                                        <div className={`mt-1 break-words text-xl font-bold tracking-[-0.03em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {item.value}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className="p-6">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="relative w-full min-w-[220px] xl:max-w-md">
                                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(event) => {
                                            setSearchTerm(event.target.value)
                                            setVisibleCount(3)
                                        }}
                                        placeholder="Search transactions..."
                                        className={`w-full rounded-lg border px-3 py-2.5 pl-10 pr-11 text-sm outline-none transition ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-slate-600' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-slate-300'}`}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Search transactions"
                                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#C99B43] text-white shadow-sm transition hover:brightness-110"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={statusFilter}
                                        onChange={(event) => {
                                            setStatusFilter(event.target.value)
                                            setVisibleCount(3)
                                        }}
                                        options={['All Status', 'Successful', 'Pending', 'Failed']}
                                        className={isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}
                                    />

                                    <Select
                                        value={paymentMethodFilter}
                                        onChange={(event) => {
                                            setPaymentMethodFilter(event.target.value)
                                            setVisibleCount(3)
                                        }}
                                        options={['All Payment Methods', 'Visa Card', 'Mobile Money', 'Bank Transfer']}
                                        className={isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}
                                    />
                                </div>
                            </div>

                            <div className={`mt-6 overflow-hidden rounded-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left">
                                        <thead className={`text-xs uppercase tracking-wider ${isDark ? 'border-b border-slate-700 bg-slate-800 text-slate-400' : 'border-b border-slate-200 bg-slate-50 text-slate-500'}`}>
                                            <tr>
                                                <th className="px-6 py-4">Transaction ID</th>
                                                <th className="px-6 py-4">Payer</th>
                                                <th className="px-6 py-4">Type</th>
                                                <th className="px-6 py-4">Property</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Method</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-slate-700 bg-slate-900' : 'divide-slate-200 bg-white'}`}>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={9} className={`px-6 py-10 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        Loading payments...
                                                    </td>
                                                </tr>
                                            ) : displayedPayments.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className={`px-6 py-10 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        No transactions found
                                                    </td>
                                                </tr>
                                            ) : (
                                                displayedPayments.map((payment) => (
                                                    <tr key={payment.id} className={`transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                                                        <td className={`px-4 py-3 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{payment.id}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                                                                    <Building2 className="h-3.5 w-3.5" />
                                                                </div>
                                                                <div>
                                                                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{payment.payer}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{payment.type}</td>
                                                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{payment.property}</td>
                                                        <td className={`px-4 py-3 text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{payment.amount}</td>
                                                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{payment.method}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClasses(payment.status)}`}>
                                                                {payment.status}
                                                            </span>
                                                        </td>
                                                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            <div>{payment.date}</div>
                                                            <div className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{payment.time}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-end">
                                                                <button
                                                                    type="button"
                                                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                                                    aria-label="Open payment actions"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className={`mt-4 flex items-center justify-end gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {hasMore && (
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount((count) => Math.min(count + 3, filteredPayments.length))}
                                        className={`rounded-lg border px-3 py-2 font-medium transition ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        View more
                                    </button>
                                )}
                                {hasLess && (
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount(3)}
                                        className={`rounded-lg border px-3 py-2 font-medium transition ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        View less
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Payments
