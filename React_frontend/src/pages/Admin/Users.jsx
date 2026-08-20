import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Building2,
    MoreHorizontal,
    Search,
    Sparkles,
    UserRound,
    Users as UsersIcon,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import AdminStatCard from './components/AdminStatCard'
import { useTheme } from '../../hooks/useTheme'
import { deleteAdminUser, getAllUsers, getUserStatisticsForUsersPage, resetAdminUserLogin } from '../../api/admin/adminApi'
import {
    Button,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    Card,
} from '../../components/ui'

const getStatusClasses = (status) => {
    if (status === 'Active') {
        return 'bg-emerald-100 text-emerald-700'
    }
    return 'bg-amber-100 text-amber-700'
}

function Users() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [openMenuId, setOpenMenuId] = useState(null)
    const [userToDelete, setUserToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [resettingUserId, setResettingUserId] = useState(null)
    const { isDark } = useTheme()
    const navigate = useNavigate()

    // State for data fetching
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCustomers: 0,
        totalOwners: 0,
    })
    const [users, setUsers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [visibleCount, setVisibleCount] = useState(5)
    const [totalCount, setTotalCount] = useState(0)

    const pageSize = 500

    // Fetch users data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch user statistics and users list in parallel
                const [statsData, usersData] = await Promise.all([
                    getUserStatisticsForUsersPage(),
                    getAllUsers({
                        search: searchQuery,
                        role: roleFilter,
                        page: 1,
                        page_size: pageSize,
                    }),
                ])

                setStats(statsData)
                setUsers(usersData.users || [])
                setTotalCount(usersData.totalCount || 0)
                setVisibleCount(5)
            } catch (err) {
                console.error('Error fetching users page data:', err)
                setError(err.message || 'Failed to load users data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [searchQuery, roleFilter])

    const statCards = [
        {
            label: 'Total Users',
            value: stats.totalUsers.toString(),
            icon: UsersIcon,
            iconBg: 'bg-[#e9f1ff] text-[#3a74ff]',
        },
        {
            label: 'Customers',
            value: stats.totalCustomers.toString(),
            icon: UserRound,
            iconBg: 'bg-[#f8e8ee] text-[#d1468d]',
        },
        {
            label: 'Property Owners',
            value: stats.totalOwners.toString(),
            icon: Building2,
            iconBg: 'bg-[#ebf7ff] text-[#3da1ff]',
        },
    ]

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
        setVisibleCount(5)
    }

    const handleRoleFilterChange = (role) => {
        setRoleFilter(role)
        setVisibleCount(5)
    }

    const displayedUsers = users.slice(0, visibleCount)
    const hasMoreUsers = users.length > visibleCount

    const handleDeleteUser = async () => {
        if (!userToDelete) return

        try {
            setDeleting(true)
            await deleteAdminUser(userToDelete.id)
            setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userToDelete.id))
            setTotalCount((count) => Math.max(0, count - 1))
            setUserToDelete(null)
        } catch (deleteError) {
            setError(deleteError.message || 'Failed to delete user.')
        } finally {
            setDeleting(false)
        }
    }

    const handleResetUserLogin = async (user) => {
        try {
            setResettingUserId(user.id)
            await resetAdminUserLogin(user.id)
            setUsers((currentUsers) => currentUsers.map((currentUser) => (
                currentUser.id === user.id
                    ? { ...currentUser, status: 'Active', login_blocked: false }
                    : currentUser
            )))
            setOpenMenuId(null)
        } catch (resetError) {
            setError(resetError.message || 'Failed to reset user login access.')
        } finally {
            setResettingUserId(null)
        }
    }

    return (
        <div className="min-h-screen flex lg:flex">
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="min-w-0 flex-1 overflow-x-hidden">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className="mx-auto w-full min-w-0 max-w-full overflow-x-hidden px-4 py-6 sm:px-5 lg:px-8">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold tracking-[-0.04em]">Users</h1>
                    </div>

                    <div className="mb-8 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-3">
                        {statCards.map((item) => (
                            <AdminStatCard key={item.label} {...item} />
                        ))}
                    </div>

                    <Card className="p-6">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between mb-6">
                            <div className="relative w-full xl:max-w-md">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    type="text"
                                    placeholder="Search by name, email or phone..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="h-9 pl-8 pr-11"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#C99B43] text-white shadow-sm transition hover:brightness-110"
                                    aria-label="Sparkles action"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger variant="outline" size="sm">
                                        {roleFilter === 'all' ? 'All Roles' : roleFilter === 'owner' ? 'Owner' : 'Tenant'}
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleRoleFilterChange('all')}>
                                            All Roles
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleFilterChange('tenant')}>
                                            Tenant
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleFilterChange('owner')}>
                                            Owner
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <Card className="mt-6 p-0 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-6 py-4">User</TableHead>
                                        <TableHead className="px-6 py-4">Role</TableHead>
                                        <TableHead className="px-6 py-4">Phone</TableHead>
                                        <TableHead className="px-6 py-4">Status</TableHead>
                                        <TableHead className="px-6 py-4">Joined Date</TableHead>
                                        <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        // Skeleton loading state
                                        Array.from({ length: pageSize }).map((_, idx) => (
                                            <TableRow key={`skeleton-${idx}`}>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                                                        <div className="flex-1">
                                                            <div className="h-4 w-24 rounded bg-muted animate-pulse mb-2"></div>
                                                            <div className="h-3 w-32 rounded bg-muted animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4"><div className="h-4 w-16 rounded bg-muted animate-pulse"></div></TableCell>
                                                <TableCell className="px-6 py-4"><div className="h-4 w-24 rounded bg-muted animate-pulse"></div></TableCell>
                                                <TableCell className="px-6 py-4"><div className="h-6 w-16 rounded-full bg-muted animate-pulse"></div></TableCell>
                                                <TableCell className="px-6 py-4"><div className="h-4 w-20 rounded bg-muted animate-pulse"></div></TableCell>
                                                <TableCell className="px-6 py-4"><div className="h-8 w-8 rounded bg-muted animate-pulse ml-auto"></div></TableCell>
                                            </TableRow>
                                        ))
                                    ) : error ? (
                                        <TableRow>
                                            <TableCell colSpan="6" className="px-6 py-8 text-center">
                                                <div className="text-sm text-muted-foreground">
                                                    <p className="font-medium mb-2">Error loading users</p>
                                                    <p className="text-xs">{error}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan="6" className="px-6 py-8 text-center">
                                                <div className="text-sm text-muted-foreground">No users found</div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        displayedUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
                                                            {user.avatar ? (
                                                                <img src={user.avatar} alt={user.name} className="h-10 w-10 object-cover" />
                                                            ) : (
                                                                user.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold">{user.name}</div>
                                                            <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-sm">{user.role}</TableCell>
                                                <TableCell className="px-6 py-4 text-sm">{user.phone}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(user.status)}`}>
                                                        {user.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-sm">{user.joined}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center justify-end">
                                                        <DropdownMenu open={openMenuId === user.id} onOpenChange={(open) => setOpenMenuId(open ? user.id : null)}>
                                                            <DropdownMenuTrigger variant="ghost" size="icon-sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => {
                                                                    navigate(`/admin-dashboard/users/${user.id}`)
                                                                    setOpenMenuId(null)
                                                                }}>
                                                                    View Detail
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    disabled={resettingUserId === user.id}
                                                                    onClick={() => handleResetUserLogin(user)}
                                                                >
                                                                    {resettingUserId === user.id ? 'Resetting...' : 'Reset / Unblock'}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem variant="destructive" onClick={() => {
                                                                    setUserToDelete(user)
                                                                    setOpenMenuId(null)
                                                                }}>
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>

                        {users.length > 0 && (
                            <div className="mt-4 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setVisibleCount((prev) => (prev >= users.length ? 5 : users.length))}
                                >
                                    {hasMoreUsers ? 'View more' : 'View less'}
                                </Button>
                            </div>
                        )}
                    </Card>
                </main>
            </div>

            {userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Are you sure?</h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Delete {userToDelete.name}? This action cannot be undone.
                        </p>
                        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                        <div className="mt-6 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setUserToDelete(null)} disabled={deleting}>
                                Cancel
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Users
