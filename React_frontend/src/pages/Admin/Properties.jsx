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
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui'
import { getAllProperties } from '../../api/admin/adminApi'
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
    id: property.id,
    name: property.title || property.property_name || 'Untitled Property',
    owner: property.owner_name || property.owner_email || 'Unknown Owner',
    type: property.property_type === 'house' ? 'House' : property.property_type === 'car' ? 'Car' : 'Property',
    location: property.location || 'Location not provided',
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
    const { isDark } = useTheme()

    useEffect(() => {
        async function loadProperties() {
            setLoading(true)
            setError('')
            try {
                const response = await getAllProperties()
                const items = Array.isArray(response) ? response : response.results || []
                setProperties(items.map(mapProperty))
            } catch (err) {
                console.error('Error fetching properties:', err)
                setError(err.message || 'Unable to load properties.')
            } finally {
                setLoading(false)
            }
        }

        loadProperties()
    }, [])

    const filteredProperties = useMemo(() => {
        return properties.filter((property) => {
            const matchesSearch = !searchTerm
                || property.name.toLowerCase().includes(searchTerm.toLowerCase())
                || property.owner.toLowerCase().includes(searchTerm.toLowerCase())
                || property.location.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesType = typeFilter === 'all' || property.type === typeFilter
            const matchesStatus = statusFilter === 'all' || property.status === statusFilter

            return matchesSearch && matchesType && matchesStatus
        })
    }, [properties, searchTerm, typeFilter, statusFilter])

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

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Properties
                        </h1>
                    </div>

                    <div className="mb-8 grid gap-3 md:grid-cols-3 xl:grid-cols-3">
                        {statCards.map((item) => {
                            const Icon = item.icon
                            return (
                                <Card key={item.label} className={`p-4 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {item.label}
                                            </p>
                                            <p className={`mt-3 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {item.value}
                                            </p>
                                        </div>
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                                            <Icon className="h-5 w-5" />
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

                                    {/* Top Menu Dropdown */}
                                    {openMenuId && (
                                        <div className={`absolute right-6 top-20 z-20 w-48 rounded-lg border shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                                            {properties.find(p => p.id === openMenuId) && (
                                                <div className={`border-b px-4 py-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Selected</p>
                                                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{properties.find(p => p.id === openMenuId)?.name}</p>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                className={`block w-full px-4 py-2.5 text-left text-sm font-medium transition ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                                onClick={() => {
                                                    navigate(`/admin-dashboard/properties/${openMenuId}`)
                                                    setOpenMenuId(null)
                                                }}
                                            >
                                                View Detail
                                            </button>
                                            <button
                                                type="button"
                                                className={`block w-full rounded-b-lg px-4 py-2.5 text-left text-sm font-medium text-red-600 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
                                                onClick={() => {
                                                    console.log('Delete property:', openMenuId)
                                                    setOpenMenuId(null)
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
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
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon-sm"
                                                                            onClick={() => setOpenMenuId(openMenuId === property.id ? null : property.id)}
                                                                            className={isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : ''}
                                                                        >
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
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
        </div>
    )
}

export default Properties
