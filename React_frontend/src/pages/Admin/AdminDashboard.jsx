
import { useState, useEffect } from 'react'
import {
    Building2,
    CheckCircle2,
    CircleUserRound,
    Clock3,
    FileText,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import AdminStatCard from './components/AdminStatCard'
import PropertyOverviewChart from './components/PropertyOverviewChart'
import PendingApprovalsSection from './components/PendingApprovalsSection'
import RecentUsersSection from './components/RecentUsersSection'
import RecentPropertiesSection from './components/RecentPropertiesSection'
import RecentReportsSection from './components/RecentReportsSection'
import { Card } from '../../components/ui'
import {
    getAdminDashboardStats,
    getPendingApprovals,
    getPropertyOverviewData,
    getRecentUsers,
    getRecentReports,
} from '../../api/admin/adminApi'

function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [dashboardData, setDashboardData] = useState(null)
    const [chartData, setChartData] = useState(null)
    const [pendingApprovals, setPendingApprovals] = useState([])
    const [recentUsers, setRecentUsers] = useState([])
    const [recentReports, setRecentReports] = useState([])

    useEffect(() => {
        async function loadDashboardData() {
            setLoading(true)
            setError(null)
            try {
                const [stats, overview, pending, users, reports] = await Promise.all([
                    getAdminDashboardStats(),
                    getPropertyOverviewData(),
                    getPendingApprovals(),
                    getRecentUsers(),
                    getRecentReports(),
                ])

                setDashboardData(stats)
                setChartData(overview)
                setPendingApprovals(pending)
                setRecentUsers(users)
                setRecentReports(reports)
            } catch (err) {
                setError(err.message || 'Failed to load dashboard data')
                console.error('Dashboard error:', err)
            } finally {
                setLoading(false)
            }
        }

        loadDashboardData()
    }, [])

    const statCards = dashboardData
        ? [
            {
                label: 'Total Users',
                value: dashboardData.userStats.totalUsers.toString(),
                icon: CircleUserRound,
                iconBg: 'bg-[#e9f1ff] text-[#3a74ff]',
            },
            {
                label: 'Total Properties',
                value: dashboardData.propertyStats.totalProperties.toString(),
                icon: Building2,
                iconBg: 'bg-[#ebf7ff] text-[#3da1ff]',
            },
            {
                label: 'Pending Approvals',
                value: dashboardData.propertyStats.pendingApprovals.toString(),
                icon: Clock3,
                iconBg: 'bg-[#fff3d6] text-[#f0b229]',
            },
            {
                label: 'Active Rentals',
                value: dashboardData.propertyStats.rentedProperties.toString(),
                icon: CheckCircle2,
                iconBg: 'bg-[#eafaf1] text-[#29b66f]',
            },
            {
                label: 'Reports',
                value: recentReports.length.toString(),
                icon: FileText,
                iconBg: 'bg-[#ffe9e9] text-[#d84a4a]',
            },
        ]
        : []

    return (
        <div className="min-h-screen flex lg:flex">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className="mx-auto max-w-[1700px] px-4 py-6 sm:px-5 lg:px-8">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold tracking-[-0.04em]">
                            Dashboard
                        </h1>
                    </div>

                    {loading ? (
                        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5 mb-8">
                            {[...Array(5)].map((_, i) => (
                                <Card key={i} className="p-4">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                                        <div className="h-8 bg-muted rounded animate-pulse"></div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="mb-8 rounded-lg p-4 text-sm bg-destructive/10 text-destructive">
                            <p className="font-semibold">Error loading dashboard</p>
                            <p className="mt-2">{error}</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5 mb-8">
                            {statCards.map((item) => (
                                <AdminStatCard key={item.label} {...item} />
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr] mb-8">
                            <Card className="p-6 h-64 animate-pulse bg-muted/50"></Card>
                            <Card className="p-6 h-64 animate-pulse bg-muted/50"></Card>
                        </div>
                    ) : (
                        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr] mb-8">
                            <PropertyOverviewChart chartData={chartData} />
                            <PendingApprovalsSection
                                pendingCount={dashboardData?.propertyStats.pendingApprovals}
                                pendingApprovals={pendingApprovals}
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="grid gap-6 xl:grid-cols-3">
                            {[...Array(3)].map((_, i) => (
                                <Card key={i} className="p-6 h-96 animate-pulse bg-muted/50"></Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-6 xl:grid-cols-3">
                            <RecentUsersSection recentUsers={recentUsers} />
                            <RecentPropertiesSection recentProperties={dashboardData?.recentProperties} />
                            <RecentReportsSection recentReports={recentReports} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default AdminDashboard