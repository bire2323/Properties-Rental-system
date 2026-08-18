import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Calendar, ChevronLeft, ChevronRight, Home, Loader2, MapPin, Phone, User } from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { Button, Card } from '../../components/ui'
import { getPropertyById } from '../../api/admin/adminApi'
import { getImageUrl } from '../../api/mediaHelper'

const defaultImage = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'

const formatDate = (value) => {
    if (!value) return 'Recently'
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getStatusClasses = (status) => {
    if (status === 'Available') return 'bg-emerald-100 text-emerald-700'
    if (status === 'Rented') return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
}

function AdminPropertyDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [property, setProperty] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        async function loadProperty() {
            setLoading(true)
            setError('')
            try {
                const response = await getPropertyById(id)
                setProperty(response)
            } catch (err) {
                console.error('Error fetching property:', err)
                setError(err.message || 'Unable to load property.')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            loadProperty()
        }
    }, [id])

    if (loading) {
        return (
            <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1">
                    <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />
                    <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                        <div className="flex justify-center items-center h-96">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    if (error || !property) {
        return (
            <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1">
                    <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />
                    <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/admin-dashboard/properties')}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </div>
                        <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                {error || 'Property not found.'}
                            </div>
                        </Card>
                    </main>
                </div>
            </div>
        )
    }

    const propertyName = property.property_name || property.title || 'Untitled Property'
    const status = property.is_available ? 'Available' : 'Rented'
    const type = property.listing_type === 'house' ? 'House' : property.listing_type === 'car' ? 'Car' : 'Property'
    const ownerName = property.owner_name || property.owner_email || 'Unknown Owner'
    const createdDate = formatDate(property.created_at)

    // Get all images
    const allImages = property.images && property.images.length > 0
        ? property.images.map(img => getImageUrl(img)).filter(Boolean)
        : []
    const currentImage = allImages[currentImageIndex] || defaultImage

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
    }

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
    }

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/admin-dashboard/properties')}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <h1 className={`text-3xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Property Details
                            </h1>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Image Gallery Card */}
                            <Card className={`overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <div className="relative bg-slate-200 dark:bg-slate-800">
                                    {/* Main Image */}
                                    <img
                                        src={currentImage}
                                        alt={propertyName}
                                        className="h-96 w-full object-cover"
                                    />

                                    {/* Image Counter */}
                                    {allImages.length > 1 && (
                                        <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm font-medium">
                                            {currentImageIndex + 1} / {allImages.length}
                                        </div>
                                    )}

                                    {/* Navigation Buttons */}
                                    {allImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePrevImage}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition"
                                            >
                                                <ChevronLeft className="h-6 w-6" />
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition"
                                            >
                                                <ChevronRight className="h-6 w-6" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Image Thumbnails */}
                                {allImages.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto p-3">
                                        {allImages.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentImageIndex(index)}
                                                className={`flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden transition ${index === currentImageIndex
                                                        ? 'ring-2 ring-blue-500 opacity-100'
                                                        : 'opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {/* Property Title Card */}
                            <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {propertyName}
                                </h2>
                                <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {property.address && property.city ? `${property.address}, ${property.city}` : property.city || 'Location not provided'}
                                </p>
                            </Card>

                            {/* Description Card */}
                            <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <h3 className={`mb-3 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Description
                                </h3>
                                <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {property.description || 'No description provided.'}
                                </p>
                            </Card>

                            {/* Property Details Card */}
                            <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <h3 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {property.price && (
                                        <div>
                                            <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Price
                                            </p>
                                            <p className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {property.currency || 'ETB'} {parseFloat(property.price).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {property.rental_unit && (
                                        <div>
                                            <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Rental Unit
                                            </p>
                                            <p className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {property.rental_unit.charAt(0).toUpperCase() + property.rental_unit.slice(1)}
                                            </p>
                                        </div>
                                    )}
                                    {property.security_deposit && (
                                        <div>
                                            <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Security Deposit
                                            </p>
                                            <p className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {property.currency || 'ETB'} {parseFloat(property.security_deposit).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Location Card */}
                            <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <h3 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Location
                                </h3>
                                <div className="space-y-3">
                                    {property.address && (
                                        <div className="flex gap-2">
                                            <MapPin className={`h-5 w-5 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{property.address}</span>
                                        </div>
                                    )}
                                    {property.city && (
                                        <div className="flex gap-2">
                                            <Building2 className={`h-5 w-5 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                                                {property.city}{property.region ? `, ${property.region}` : ''}
                                                {property.kebele ? `, ${property.kebele}` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Features Card */}
                            {property.features && property.features.length > 0 && (
                                <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <h3 className={`mb-4 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        Features
                                    </h3>
                                    <div className="grid gap-2 grid-cols-2">
                                        {property.features.map((feature, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center gap-2 rounded-lg p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}
                                            >
                                                <span className="text-lg">✓</span>
                                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                                                    {typeof feature === 'string' ? feature : feature.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            {/* Status & Type Card */}
                            <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <div className="space-y-4">
                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Status
                                        </p>
                                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(status)}`}>
                                            {status}
                                        </span>
                                    </div>

                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Property Type
                                        </p>
                                        <p className={`mt-2 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {type}
                                        </p>
                                    </div>

                                    <div>
                                        <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Listed On
                                        </p>
                                        <p className={`mt-2 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {createdDate}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Owner Card */}
                            <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <h3 className={`mb-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Owner Information
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                                            {ownerName}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* Property Type Details */}
                            {property.house_detail && (
                                <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <h3 className={`mb-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        House Details
                                    </h3>
                                    <div className="space-y-3">
                                        {property.house_detail.bedrooms && (
                                            <div>
                                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Bedrooms
                                                </p>
                                                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {property.house_detail.bedrooms}
                                                </p>
                                            </div>
                                        )}
                                        {property.house_detail.bathrooms && (
                                            <div>
                                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Bathrooms
                                                </p>
                                                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {property.house_detail.bathrooms}
                                                </p>
                                            </div>
                                        )}
                                        {property.house_detail.area_sqft && (
                                            <div>
                                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Area (sqft)
                                                </p>
                                                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {property.house_detail.area_sqft}
                                                </p>
                                            </div>
                                        )}
                                        {property.house_detail.furnishing && (
                                            <div>
                                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Furnishing
                                                </p>
                                                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {property.house_detail.furnishing.replace('_', ' ').charAt(0).toUpperCase() + property.house_detail.furnishing.slice(1)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {property.car_detail && (
                                <Card className={`p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <h3 className={`mb-4 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        Vehicle Details
                                    </h3>
                                    <div className="space-y-3">
                                        {property.car_detail.brand && (
                                            <div>
                                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Brand
                                                </p>
                                                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {property.car_detail.brand}
                                                </p>
                                            </div>
                                        )}
                                        {property.car_detail.model && (
                                            <div>
                                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Model
                                                </p>
                                                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {property.car_detail.model}
                                                </p>
                                            </div>
                                        )}
                                        {property.car_detail.year && (
                                            <div>
                                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Year
                                                </p>
                                                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {property.car_detail.year}
                                                </p>
                                            </div>
                                        )}
                                        {property.car_detail.seating_capacity && (
                                            <div>
                                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Seating Capacity
                                                </p>
                                                <p className={`mt-1 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                    {property.car_detail.seating_capacity}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AdminPropertyDetail
