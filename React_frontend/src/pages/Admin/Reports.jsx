import { useMemo, useState } from 'react'
import {
    CircleAlert,
    MoreHorizontal,
    Search,
    Sparkles,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui'

const reportRows = []

const getStatusClasses = (status) => {
    if (status === 'Resolved') return 'bg-emerald-100 text-emerald-700'
    if (status === 'Reviewed') return 'bg-sky-100 text-sky-700'
    return 'bg-amber-100 text-amber-700'
}

function Reports() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [visibleCount, setVisibleCount] = useState(5)
    const [openMenuId, setOpenMenuId] = useState(null)
    const { isDark } = useTheme()

    const filteredReports = useMemo(() => {
        return reportRows.filter((report) => {
            if (!searchTerm) return true

            return (
                report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.id.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })
    }, [searchTerm])

    const displayedReports = filteredReports.slice(0, visibleCount)
    const hasMoreReports = filteredReports.length > visibleCount

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Reports & Complaints
                        </h1>
                    </div>

                    <Card className={`overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className="p-6">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
                                <div className="relative w-full xl:max-w-md">
                                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                    <Input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Search report, person or ID..."
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
                            </div>

                            <div className={`mt-6 overflow-hidden rounded-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className={isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}>
                                            <TableRow>
                                                <TableHead className="px-6 py-4">Report ID</TableHead>
                                                <TableHead className="px-6 py-4">Reported By</TableHead>
                                                <TableHead className="px-6 py-4">Subject</TableHead>
                                                <TableHead className="px-6 py-4">Status</TableHead>
                                                <TableHead className="px-6 py-4">Date</TableHead>
                                                <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className={isDark ? 'bg-slate-900' : 'bg-white'}>
                                            {displayedReports.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                                                        No reports found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                displayedReports.map((report) => (
                                                    <TableRow key={report.id} className={isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}>
                                                        <TableCell className={`px-6 py-4 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                            {report.id}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                                                                    <CircleAlert className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                        {report.reporter}
                                                                    </div>
                                                                    <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                        {report.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                                {report.subject}
                                                            </div>
                                                            <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                {report.reportedBy}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(report.status)}`}>
                                                                {report.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className={`px-6 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            <div>{report.date}</div>
                                                            <div className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                {report.time}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            <div className="flex items-center justify-end">
                                                                <div className="relative">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon-sm"
                                                                        onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
                                                                        className={isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : ''}
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>

                                                                    {openMenuId === report.id && (
                                                                        <div className={`absolute right-0 z-10 mt-2 w-44 rounded-lg border shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                                                            <button
                                                                                type="button"
                                                                                className={`block w-full rounded-t-lg px-4 py-2.5 text-left text-sm font-medium transition ${isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                                                                onClick={() => setOpenMenuId(null)}
                                                                            >
                                                                                View details
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className={`block w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
                                                                                onClick={() => setOpenMenuId(null)}
                                                                            >
                                                                                Resolve
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className={`block w-full rounded-b-lg px-4 py-2.5 text-left text-sm font-medium text-red-600 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
                                                                                onClick={() => setOpenMenuId(null)}
                                                                            >
                                                                                Reject
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {filteredReports.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setVisibleCount((prev) => (prev >= filteredReports.length ? 5 : filteredReports.length))}
                                    >
                                        {hasMoreReports ? 'View more' : 'View less'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </main>
            </div>
        </div>
    )
}

export default Reports
