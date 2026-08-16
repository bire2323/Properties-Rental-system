import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getAllProperties, deleteProperty } from '../../api/property/propertyApi'
import PropertyToolbar from './components/PropertyToolbar'
import PropertyGrid from './components/PropertyGrid'
import PropertyList from './components/PropertyList'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'

const DRAFT_STORAGE_KEY = 'property_add_draft'

function readSavedDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const form = parsed?.form
        if (!form) return null

        return {
            id: 'draft',
            property_name: form.property_name || 'Draft property',
            listing_type: form.listing_type || 'house',
            status: 'draft',
            price: form.price || 0,
            city: form.city || '',
            region: form.region || '',
            kebele: form.kebele || '',
            isDraft: true,
            main_image: null,
            images: [],
            _draftLabel: 'Draft property',
        }
    } catch {
        return null
    }
}

export default function OwnerProperties() {
    const navigate = useNavigate()
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [propertyType, setPropertyType] = useState('all')
    const [availability, setAvailability] = useState('all')
    const [viewMode, setViewMode] = useState('grid')
    const [draftProperty, setDraftProperty] = useState(null)

    useEffect(() => {
        setDraftProperty(readSavedDraft())
    }, [])

    useEffect(() => {
        async function loadProperties() {
            setLoading(true)
            setError(null)
            try {
                const data = await getAllProperties()
                const results = Array.isArray(data) ? data : data.results || []
                setProperties(results)
            } catch (err) {
                setError(err.message || 'Unable to load properties.')
            } finally {
                setLoading(false)
            }
        }
        loadProperties()
    }, [])

    const handleDelete = async (id) => {
        try {
            await deleteProperty(id)
            setProperties((prev) => prev.filter((p) => p.id !== id))
        } catch (err) {
            console.error('Delete failed', err)
            setError(err.message || 'Unable to delete property.')
        }
    }

    const { user } = useAuth()

    const ownerProperties = useMemo(() => {
        return properties.filter((property) => property.owner_email === user?.email)
    }, [properties, user])

    const filteredProperties = useMemo(() => {
        return ownerProperties.filter((property) => {
            const matchesSearch = [property.property_name, property.city, property.region, property.kebele, property.listing_type]
                .filter(Boolean)
                .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
            const matchesType = propertyType === 'all' || property.listing_type === propertyType
            const isAvail = property.status === 'active'
            const matchesAvailability =
                availability === 'all' ||
                (availability === 'available' && isAvail) ||
                (availability === 'unavailable' && !isAvail)
            return matchesSearch && matchesType && matchesAvailability
        })
    }, [ownerProperties, searchTerm, propertyType, availability])

    return (
        <div className="space-y-8">
            <PropertyToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                propertyType={propertyType}
                onPropertyTypeChange={setPropertyType}
                availability={availability}
                onAvailabilityChange={setAvailability}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onAddProperty={() => navigate('/owner/properties/add')}
            />

            {loading ? (
                <LoadingSkeleton />
            ) : error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
                    <p className="font-semibold">Unable to load properties.</p>
                    <p className="mt-2">{error}</p>
                </div>
            ) : !filteredProperties.length ? (
                <EmptyState
                    title="No matching properties"
                    description="Try changing your filters or add a new property."
                    action={
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties/add')}
                            className="rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                        >
                            Add Property
                        </button>
                    }
                />
            ) : viewMode === 'list' ? (
                <PropertyList properties={filteredProperties} onDelete={handleDelete} />
            ) : (
                <PropertyGrid properties={filteredProperties} onDelete={handleDelete} />
            )}

            {draftProperty && (
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Draft property</h3>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                            Draft
                        </span>
                    </div>
                    <PropertyGrid
                        properties={[draftProperty]}
                        onDelete={null}
                        isDraftMode={true}
                    />
                </div>
            )}
        </div>
    )
}
