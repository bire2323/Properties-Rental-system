import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowDownRight,
    Building2,
    CheckCircle2,
    ChevronDown,
    MoreHorizontal,
    Search,
    Sparkles,
} from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import {
    Button,
    Card,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui'
import { getAllProperties, deleteProperty } from '../../api/admin/adminApi'
import { getImageUrl } from '../../api/mediaHelper'

const defaultImage = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'

const formatPrice = (value) => {
    if (value === null || value === undefined || value === '') return 'Price not set'
    const numericValue = Number(value)
    if (Number.isNaN(numericValue)) return value
    return `ETB ${numericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

const formatDate = (value) => {
    if (!value) return 'Recently'
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStatusClasses = (status) => {
    if (status === 'Available') return 'bg-emerald-100 text-emerald-700'
    if (status === 'Rented') return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
}

const mapProperty = (property) => ({
    id: property.id ?? `prop-${Math.random().toString(36).slice(2, 9)}`,
    name: property.title || property.property_name || 'Untitled Property',
    owner: property.owner_name || property.owner_email || 'Unknown Owner',
    type: property.listing_type === 'house' ? 'House' : property.listing_type === 'car' ? 'Car' : 'Property',
    location: property.location || property.city || property.address || 'Location not provided',
    price: formatPrice(property.price),
    status: property.is_available ? 'Available' : 'Rented',
    date: formatDate(property.created_at),
    image: getImageUrl(property.main_image) || getImageUrl(property.images?.[0]) || defaultImage,
    isAvailable: property.is_available,
})

function Properties() {
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [visibleCount, setVisibleCount] = useState(5)
    const [openMenuId, setOpenMenuId] = useState(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [propertyToDelete, setPropertyToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const { isDark } = useTheme()

    async function loadProperties() {
        setLoading(true)
        setError('')
        try {
            const filters = {}
            if (typeFilter !== 'all') {
                filters.type = typeFilter === 'House' ? 'house' : 'car'
            }
            if (statusFilter !== 'all') {
                filters.is_available = statusFilter === 'Available' ? 'true' : 'false'
            }
            const response = await getAllProperties(filters)
            const items = Array.isArray(response) ? response : response.results || []
            setProperties(items.map(mapProperty))
        } catch (err) {
            console.error('Error fetching properties:', err)
            setError(err.message || 'Unable to load properties.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProperties()
    }, [typeFilter, statusFilter])

    const filteredProperties = useMemo(() => {
        return properties.filter((property) => {
            if (!searchTerm) return true
            const term = searchTerm.toLowerCase()
            return (
                property.name.toLowerCase().includes(term)
                || property.owner.toLowerCase().includes(term)
                || property.location.toLowerCase().includes(term)
            )
        })
    }, [properties, searchTerm])

    useEffect(() => {
        setVisibleCount(5)
    }, [searchTerm, typeFilter, statusFilter])

    const displayedProperties = filteredProperties.slice(0, visibleCount)
    const hasMoreProperties = filteredProperties.length > visibleCount

    const statCards = [
        { label: 'All Properties', value: properties.length.toLocaleString(), icon: Building2 },
        { label: 'Available', value: properties.filter((item) => item.isAvailable).length.toLocaleString(), icon: CheckCircle2 },
        { label: 'Rented', value: properties.filter((item) => !item.isAvailable).length.toLocaleString(), icon: ArrowDownRight },
    ]

    const handleDeleteClick = (property) => {
        setPropertyToDelete(property)
        setDeleteDialogOpen(true)
        setOpenMenuId(null)
    }

    const handleConfirmDelete = async () => {
        if (!propertyToDelete) return
        setDeleting(true)
        try {
            await deleteProperty(propertyToDelete.id)
            setProperties((prev) => prev.filter((p) => p.id !== propertyToDelete.id))
            setDeleteDialogOpen(false)
            setPropertyToDelete(null)
        } catch (err) {
            console.error('Delete failed:', err)
            setError(err.message || 'Failed to delete property.')
        } finally {
            setDeleting(false)
        }
    }

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false)
        setPropertyToDelete(null)
    }

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="min-w-0 flex-1 overflow-x-hidden">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full min-w-0 max-w-full overflow-x-hidden px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Properties
                        </h1>
                    </div>

                    <div className="mb-8 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-3">
                        {statCards.map((item) => {
                            const Icon = item.icon
                            return (
                                <Card key={item.label} className={`min-w-0 p-2 sm:p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`truncate text-[10px] font-medium uppercase tracking-wide sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {item.label}
                                            </p>
                                            <p className={`mt-2 break-words text-xl font-bold sm:mt-3 sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {item.value}
                                            </p>
                                        </div>
                                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    <Card className={`overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                        <div className="p-6">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="relative w-full xl:max-w-md">
                                    <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                    <Input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Search property, owner or location..."
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
                                            value={typeFilter}
                                            onChange={(event) => setTypeFilter(event.target.value)}
                                            className={`w-full appearance-none bg-transparent pr-5 text-sm outline-none ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                                            style={isDark ? { backgroundColor: '#0f172a' } : { backgroundColor: '#f8fafc' }}
                                        >
                                            <option value="all">All</option>
                                            <option value="House">House</option>
                                            <option value="Car">Car</option>
                                        </select>
                                        <ChevronDown className="h-4 w-4" />
                                    </div>

                                    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                                        <select
                                            value={statusFilter}
                                            onChange={(event) => setStatusFilter(event.target.value)}
                                            className={`w-full appearance-none bg-transparent pr-5 text-sm outline-none ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                                            style={isDark ? { backgroundColor: '#0f172a' } : { backgroundColor: '#f8fafc' }}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="Available">Available</option>
                                            <option value="Rented">Rented</option>
                                        </select>
                                        <ChevronDown className="h-4 w-4" />
                                    </div>

                                </div>
                            </div>

                            {loading ? (
                                <div className="mt-6 space-y-3">
                                    {[...Array(5)].map((_, index) => (
                                        <div key={index} className={`h-16 animate-pulse rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {error}
                                </div>
                            ) : (
                                <>
                                    <div className={`mt-6 overflow-hidden rounded-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className={isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}>
                                                    <TableRow>
                                                        <TableHead className="px-6 py-4">Property</TableHead>
                                                        <TableHead className="px-6 py-4">Owner</TableHead>
                                                        <TableHead className="px-6 py-4">Type</TableHead>
                                                        <TableHead className="px-6 py-4">Status</TableHead>
                                                        <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className={isDark ? 'bg-slate-900' : 'bg-white'}>
                                                    {filteredProperties.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                                                                No properties found
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        displayedProperties.map((property) => (
                                                            <TableRow key={property.id} className={isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}>
                                                                <TableCell className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <img src={property.image} alt={property.name} className="h-11 w-11 rounded-lg object-cover" />
                                                                        <div>
                                                                            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{property.name}</div>
                                                                            <div className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{property.date}</div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className={`px-6 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{property.owner}</TableCell>
                                                                <TableCell className={`px-6 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{property.type}</TableCell>
                                                                <TableCell className="px-6 py-4">
                                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(property.status)}`}>
                                                                        {property.status}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-4">
                                                                    <div className="flex items-center justify-end">
                                                                        <DropdownMenu open={openMenuId === property.id} onOpenChange={(open) => setOpenMenuId(open ? property.id : null)}>
                                                                            <DropdownMenuTrigger
                                                                                variant="outline"
                                                                                size="icon-sm"
                                                                                className={isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : ''}
                                                                            >
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem onClick={() => {
                                                                                    navigate(`/admin-dashboard/properties/${property.id}`)
                                                                                    setOpenMenuId(null)
                                                                                }}>
                                                                                    View Detail
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem variant="destructive" onClick={() => handleDeleteClick(property)}>
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
                                        </div>
                                    </div>

                                    {filteredProperties.length > 0 && (
                                        <div className="mt-4 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setVisibleCount((prev) => (prev >= filteredProperties.length ? 5 : filteredProperties.length))}
                                            >
                                                {hasMoreProperties ? 'View more' : 'View less'}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                </main>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) handleCancelDelete() }}>
                <DialogContent className={isDark ? 'border-slate-700 bg-slate-900 text-white' : ''}>
                    <DialogHeader>
                        <DialogTitle className={isDark ? 'text-white' : ''}>Delete Property</DialogTitle>
                        <DialogDescription className={isDark ? 'text-slate-400' : ''}>
                            Are you sure you want to delete &quot;{propertyToDelete?.name}&quot;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelDelete}
                            disabled={deleting}
                            className={isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : ''}
                        >
                            No
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Yes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Properties
