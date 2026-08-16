import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2, Edit3, ArrowLeft, MapPin, DollarSign, CalendarDays } from 'lucide-react'
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

    const imageUrl = property?.main_image?.image || property?.images?.[0]?.image || ''

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
                    <Button variant="default" onClick={() => navigate(`/owner/properties/${id}/edit`)}>
                        <Edit3 className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                        <Trash2 className="h-4 w-4" />
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

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
                <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                            {getImageUrl(imageUrl) ? (
                                <img src={getImageUrl(imageUrl)} alt={property.property_name} onError={handleImgError} className="h-80 w-full object-cover" />
                            ) : (
                                <div className="flex h-80 items-center justify-center bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">No image available</div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
                                    <MapPin className="h-4 w-4" />
                                    {[property.city, property.region, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
                                    <DollarSign className="h-4 w-4" />
                                    ETB {parseFloat(property.price || 0).toLocaleString()}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
                                    <CalendarDays className="h-4 w-4" />
                                    {property.is_available ? 'Available' : 'Unavailable'}
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

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Media gallery</h3>
                            <div className="mt-5 grid gap-3">
                                {property.images?.length ? (
                                    property.images.map((image) => (
                                        <img key={image.id} src={getImageUrl(image)} alt={property.property_name} onError={handleImgError} className="h-28 w-full rounded-3xl object-cover" />
                                    ))
                                ) : (
                                    <div className="rounded-3xl bg-slate-100 p-8 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">No additional images</div>
                                )}
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
                </div>
            )}
        </div>
    )
}
