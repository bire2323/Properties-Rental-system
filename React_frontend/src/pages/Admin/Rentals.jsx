import { useState, useEffect } from 'react'
import {
    ChevronDown,
    MoreHorizontal,
    Search,
    Sparkles,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui'
import { getAllRentals } from '../../api/admin/adminApi'

const getStatusClasses = (status) => {
    if (status === 'Active') {
        return 'bg-emerald-100 text-emerald-700'
    }
    if (status === 'Completed') {
        return 'bg-emerald-100 text-emerald-700'
    }
    if (status === 'Cancelled') {
        return 'bg-red-100 text-red-700'
    }
    return 'bg-amber-100 text-amber-700'
}

function Rentals() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [openMenuId, setOpenMenuId] = useState(null)
    const [visibleCount, setVisibleCount] = useState(5)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [rentals, setRentals] = useState([])
    const { isDark } = useTheme()

    useEffect(() => {
        async function loadRentals() {
            setLoading(true)
            setError(null)
            try {
                const data = await getAllRentals()
                setRentals(data)
            } catch (err) {
                setError(err.message || 'Failed to load rentals')
                console.error('Rentals error:', err)
            } finally {
                setLoading(false)
            }
        }

        loadRentals()
    }, [])

    const displayedRentals = rentals.slice(0, visibleCount)
    const hasMoreRentals = rentals.length > visibleCount

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Rentals</h1>
                    </div>

                    {loading ? (
                        <div className="rounded-lg p-8 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
                            <p className={`mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading rentals...</p>
                        </div>
                    ) : error ? (
                        <div className={`mb-8 rounded-lg p-4 text-sm ${isDark ? 'bg-red-950 text-red-200' : 'bg-red-50 text-red-700'}`}>
                            <p className="font-semibold">Error loading rentals</p>
                            <p className="mt-2">{error}</p>
                        </div>
                    ) : (
                        <>
                            <Card className={`overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <div className="p-6">
                                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="relative w-full xl:max-w-md">
                                            <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                            <Input
                                                type="text"
                                                placeholder="Search by tenant, property or ID..."
                                                className={`pr-12 pl-10 ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#C99B43] text-white shadow-sm transition hover:brightness-110"
                                                aria-label="Sparkles action"
                                            >
                                                <Sparkles className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                                                <select
                                                    defaultValue="all"
                                                    className={`w-full appearance-none bg-transparent pr-5 text-sm outline-none ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                                                    style={isDark ? { backgroundColor: '#0f172a' } : { backgroundColor: '#f8fafc' }}
                                                >
                                                    <option value="all">All Status</option>
                                                    <option value="Active">Active</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                                <ChevronDown className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`mt-6 overflow-hidden rounded-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className={isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}>
                                                    <TableRow>
                                                        <TableHead className="px-6 py-4">Rental</TableHead>
                                                        <TableHead className="px-6 py-4">Tenant</TableHead>
                                                        <TableHead className="px-6 py-4">Property</TableHead>
                                                        <TableHead className="px-6 py-4">Amount</TableHead>
                                                        <TableHead className="px-6 py-4">Status</TableHead>
                                                        <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className={isDark ? 'bg-slate-900' : 'bg-white'}>
                                                    {displayedRentals.map((rental) => (
                                                        <TableRow key={rental.id} className={isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}>
                                                            <TableCell className={`px-6 py-4 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rental.id}</TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <div>
                                                                    <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rental.tenant}</div>
                                                                    <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{rental.tenantPhone}</div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <img src={rental.image} alt={rental.property} className="h-11 w-11 rounded-lg object-cover" />
                                                                    <div>
                                                                        <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rental.property}</div>
                                                                        <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{rental.location}</div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className={`px-6 py-4 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                {rental.amount}
                                                                <span className={`ml-1 text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{rental.amountPeriod}</span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(rental.status)}`}>
                                                                    {rental.status}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex items-center justify-end">
                                                                    <div className="relative">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon-sm"
                                                                            onClick={() => setOpenMenuId(openMenuId === rental.id ? null : rental.id)}
                                                                            className={isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : ''}
                                                                        >
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>

                                                                        {openMenuId === rental.id && (
                                                                            <div className={`absolute right-0 z-10 mt-2 w-48 rounded-lg border shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`block w-full rounded-t-lg px-4 py-2.5 text-left text-sm font-medium transition ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                                                                    onClick={() => {
                                                                                        console.log('View Detail:', rental.id)
                                                                                        setOpenMenuId(null)
                                                                                    }}
                                                                                >
                                                                                    View Detail
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`block w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
                                                                                    onClick={() => {
                                                                                        console.log('Complete:', rental.id)
                                                                                        setOpenMenuId(null)
                                                                                    }}
                                                                                >
                                                                                    Complete
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`block w-full rounded-b-lg px-4 py-2.5 text-left text-sm font-medium text-red-600 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
                                                                                    onClick={() => {
                                                                                        console.log('Cancel:', rental.id)
                                                                                        setOpenMenuId(null)
                                                                                    }}
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {rentals.length > 0 && (
                                        <div className="mt-4 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setVisibleCount((prev) => (prev >= rentals.length ? 5 : rentals.length))}
                                            >
                                                {hasMoreRentals ? 'View more' : 'View less'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Rentals
