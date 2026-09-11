import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2, Edit3, ArrowLeft, MapPin, DollarSign, CalendarDays, X } from 'lucide-react'
import { getPropertyById, deleteProperty } from '../../api/property/propertyApi'
import { getImageUrl } from '../../lib/utils'
import { getFeatureIcon } from '../../lib/featureIcons'
import { Button } from '../../components/ui/button'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'

export default function OwnerPropertyDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [property, setProperty] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const [previewImage, setPreviewImage] = useState(null)

    useEffect(() => {
        async function loadProperty() {
            setLoading(true)
            setError(null)
            try {
                const data = await getPropertyById(id)
                setProperty(data)
                console.debug('Loaded property (OwnerPropertyDetails):', data)
            } catch (err) {
                setError(err.message || 'Unable to load property.')
            } finally {
                setLoading(false)
            }
        }

        loadProperty()
    }, [id])

    const handleDelete = async () => {
        if (!property) return
        if (!window.confirm(`Delete property \"${property.property_name}\"? This cannot be undone.`)) {
            return
        }

        setDeleting(true)
        try {
            await deleteProperty(id)
            navigate('/owner/properties')
        } catch (err) {
            setError(err.message || 'Unable to delete property.')
        } finally {
            setDeleting(false)
        }
    }

    const imageUrl =
        property?.main_image?.image ||
        property?.images?.[0]?.image ||
        ''

    const galleryImages = property?.images || []

    const handleImgError = (e) => {
        // Prevent infinite onError loops by clearing the handler before setting a fallback
        try {
            e.currentTarget.onerror = null
            console.warn('Image failed to load:', e.currentTarget.src)
            e.currentTarget.src = 'https://via.placeholder.com/800x600?text=No+Image'
        } catch (err) {
            // ignore
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/owner/properties')}
                        className="text-sm font-medium text-slate-600 transition hover:text-[#c99b43] dark:text-slate-300"
                    >
                        <ArrowLeft className="inline h-4 w-4" /> Back to properties
                    </button>
                    <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Property details</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Review the full listing and manage this property.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="default" onClick={() => navigate(`/owner/properties/${id}/edit`)} disabled={property?.status === 'rented'} title={property?.status === 'rented' ? 'This property is rented and cannot be edited' : undefined}>
                        <Edit3 className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting || property?.status === 'rented'} title={property?.status === 'rented' ? 'This property is rented and cannot be deleted' : undefined}>
                        <Trash2 className="h-4 w-4" />
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {(!loading && !error && property?.status === 'rented') && (
                <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <svg className="h-5 w-5 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <p>
                        <span className="font-semibold">This property is currently rented.</span>{' '}
                        It cannot be edited or deleted until the rental period ends. The renter has paid for this property.
                    </p>
                </div>
            )}

            {loading ? (
                <LoadingSkeleton />
            ) : error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
                    <p className="font-semibold">Unable to load property.</p>
                    <p className="mt-2">{error}</p>
                </div>
            ) : !property ? (
                <EmptyState title="Property not found" description="This property could not be loaded." />
            ) : (

                <>
                    {/* Image Gallery */}
                    <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] transition-shadow duration-500 hover:shadow-[0_32px_100px_rgba(201,155,67,0.15)] dark:border-slate-800 dark:bg-slate-950">
                        <div className="grid gap-3 p-3 lg:grid-cols-[1.7fr_1fr]">

                            {/* Main Image */}
                            <div className="group/main relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                                {getImageUrl(imageUrl) ? (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewImage(getImageUrl(imageUrl))}
                                        className="block h-full w-full cursor-zoom-in"
                                    >
                                        <img
                                            src={getImageUrl(imageUrl)}
                                            alt={property.property_name}
                                            onError={handleImgError}
                                            className="h-80 w-full object-cover transition-all duration-700 ease-out group-hover/main:scale-[1.12] sm:h-[400px] lg:h-[500px]"
                                        />
                                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/main:opacity-100" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(201,155,67,0.08) 100%)' }} />
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/50 via-slate-950/10 to-transparent" />
                                    </button>
                                ) : (
                                    <div className="flex h-[320px] items-center justify-center bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:h-[400px] lg:h-[500px]">
                                        No image available
                                    </div>
                                )}
                            </div>

                            {/* Additional Images */}
                            <div className="grid grid-cols-2 content-start gap-3">
                                {property.images?.slice(0, 8).map((image) => {
                                    const galleryImageUrl = getImageUrl(image.image || image)

                                    return (
                                        <button
                                            key={image.id}
                                            type="button"
                                            onClick={() => setPreviewImage(galleryImageUrl)}
                                            className="group/thumb relative overflow-hidden rounded-xl border-2 border-transparent transition-all duration-300 cursor-zoom-in hover:border-slate-300 dark:hover:border-slate-600"
                                        >
                                            <img
                                                src={galleryImageUrl}
                                                alt={property.property_name}
                                                onError={handleImgError}
                                                className="h-20 md:h-40 w-full object-cover transition-all duration-500 ease-out group-hover/thumb:scale-110"
                                            />
                                            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/thumb:bg-black/10" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Property Information */}
                    <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
                                        <MapPin className="h-4 w-4" />
                                        {[property.city_name, property.region_name, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
                                        <DollarSign className="h-4 w-4" />
                                        ETB {parseFloat(property.price || 0).toLocaleString()}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
                                        <CalendarDays className="h-4 w-4" />
                                        {property.status === 'rented' ? 'Rented' : property.is_available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{property.property_name}</h2>
                                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{property.description}</p>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Created</p>
                                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">{new Date(property.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Updated</p>
                                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">{new Date(property.updated_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Features & amenities</h3>
                                {property.features?.length ? (
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        {property.features.map((feature) => {
                                            const Icon = getFeatureIcon(feature.name)
                                            return (
                                                <div
                                                    key={feature.id}
                                                    className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900"
                                                >
                                                    <Icon className="h-5 w-5 text-[#c99b43]" />
                                                    <span className="font-medium text-slate-900 dark:text-white">{feature.name}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No features listed for this property.</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Property details</h3>
                                <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Type</p>
                                            <p className="mt-2 font-semibold text-slate-900 dark:text-white">{property.listing_type}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Security deposit</p>
                                            <p className="mt-2 font-semibold text-slate-900 dark:text-white">ETB {parseFloat(property.security_deposit || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {(property.house_detail || property.car_detail) && (
                                        <div className="space-y-3">
                                            <p className="text-slate-500 dark:text-slate-400">Specific details</p>
                                            <div className="grid gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                                                {Object.entries(property.listing_type === 'house' ? property.house_detail : property.car_detail).map(([key, value]) => {
                                                    if (key === 'id' || key === 'property') return null;
                                                    if (value === null || value === undefined || value === '') return null;
                                                    return (
                                                        <div key={key} className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                                                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{key.replace('_', ' ')}</p>
                                                            <p className="mt-2 font-semibold text-slate-900 dark:text-white">{String(value)}</p>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {property.company && (
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                                            <p className="text-slate-500 dark:text-slate-400">Company</p>
                                            <p className="mt-2 font-semibold text-slate-900 dark:text-white">{property.company.name}</p>
                                            {property.company.region && <p className="text-sm text-slate-600 dark:text-slate-300">{property.company.region}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative flex max-h-[90vh] w-full max-w-6xl items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black"
                            aria-label="Close preview"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <img
                            src={previewImage}
                            alt={property?.property_name || 'Property preview'}
                            onError={handleImgError}
                            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
