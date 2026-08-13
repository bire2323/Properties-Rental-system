
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPropertyById, updateProperty } from '../../api/property/propertyApi'
import FeatureMultiSelect from '../../components/property/FeatureMultiSelect'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'
import { Eye, Pencil, Trash2 } from 'lucide-react'

export default function EditProperty() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [property, setProperty] = useState(null)
    const [form, setForm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function loadProperty() {
            setLoading(true)
            setError(null)
            try {
                const data = await getPropertyById(id)
                setProperty(data)
                setForm({
                    title: data.title || '',
                    description: data.description || '',
                    price: data.price || '',
                    security_deposit: data.security_deposit || '',
                    property_type: data.property_type || 'house',
                    location: data.location || '',
                    specific: data.specific || {},
                    images: [],
                    selectedFeatures: data.features || [],
                })
            } catch (err) {
                setError(err.message || 'Unable to load property.')
            } finally {
                setLoading(false)
            }
        }
        loadProperty()
    }, [id])

    const isHouse = form?.property_type === 'house'

    const specificFields = useMemo(() => {
        if (!form) return []
        if (isHouse) {
            return [
                { name: 'bedrooms', label: 'Bedrooms', type: 'number' },
                { name: 'bathrooms', label: 'Bathrooms', type: 'number' },
                { name: 'area_sqft', label: 'Area (sqft)', type: 'number' },
                { name: 'has_garage', label: 'Garage', type: 'checkbox' },
                { name: 'furnishing_status', label: 'Furnishing', type: 'text' },
            ]
        }
        return [
            { name: 'brand', label: 'Brand', type: 'text' },
            { name: 'car_model', label: 'Model', type: 'text' },
            { name: 'year', label: 'Year', type: 'number' },
            { name: 'mileage', label: 'Mileage', type: 'number' },
            { name: 'fuel_type', label: 'Fuel Type', type: 'text' },
            { name: 'transmission', label: 'Transmission', type: 'text' },
            { name: 'seating_capacity', label: 'Seating Capacity', type: 'number' },
        ]
    }, [form, isHouse])

    const handleFieldChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSpecificChange = (key, value) => {
        setForm((prev) => ({
            ...prev,
            specific: {
                ...prev.specific,
                [key]: value,
            },
        }))
    }

    const handleImageChange = (event) => {
        setForm((prev) => ({ ...prev, images: Array.from(event.target.files) }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!form) return
        setSaving(true)
        setError(null)

        try {
            const payload = new FormData()
            payload.append('title', form.title)
            payload.append('description', form.description)
            payload.append('price', form.price)
            payload.append('security_deposit', form.security_deposit)
            payload.append('property_type', form.property_type)
            payload.append('location', form.location)
            payload.append('specific', JSON.stringify(form.specific))
            payload.append(
                'feature_ids',
                JSON.stringify(form.selectedFeatures.map((feature) => feature.id))
            )
            if (form.images.length) {
                form.images.forEach((file) => {
                    payload.append('images', file)
                })
            }

            await updateProperty(id, payload)
            navigate(`/owner/properties/${id}`)
        } catch (err) {
            setError(err.message || 'Unable to update property.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <LoadingSkeleton />
    }

    if (error) {
        return (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
                <p className="font-semibold">Unable to load property.</p>
                <p className="mt-2">{error}</p>
            </div>
        )
    }

    if (!property || !form) {
        return <EmptyState title="Property not found" description="This property could not be loaded." />
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit property</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Update the listing details and save your changes.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <section className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Basic information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Title
                                <Input value={form.title} onChange={(event) => handleFieldChange('title', event.target.value)} placeholder="Property title" />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Location
                                <Input value={form.location} onChange={(event) => handleFieldChange('location', event.target.value)} placeholder="Addis Ababa" />
                            </label>
                        </div>
                        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                            Description
                            <textarea
                                rows={5}
                                value={form.description}
                                onChange={(event) => handleFieldChange('description', event.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Property type
                                <select
                                    value={form.property_type}
                                    onChange={(event) => handleFieldChange('property_type', event.target.value)}
                                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                >
                                    <option value="house">House</option>
                                    <option value="car">Car</option>
                                </select>
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Price
                                <Input value={form.price} onChange={(event) => handleFieldChange('price', event.target.value)} type="number" placeholder="25000" />
                            </label>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Security deposit
                                <Input value={form.security_deposit} onChange={(event) => handleFieldChange('security_deposit', event.target.value)} type="number" placeholder="5000" />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Replace images
                                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                            </label>
                        </div>
                    </section>
                    <section className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isHouse ? 'House details' : 'Car details'}</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {specificFields.map((field) => (
                                <label key={field.name} className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    {field.label}
                                    {field.type === 'checkbox' ? (
                                        <input
                                            type="checkbox"
                                            checked={Boolean(form.specific[field.name])}
                                            onChange={(event) => handleSpecificChange(field.name, event.target.checked)}
                                            className="h-5 w-5 rounded border-slate-300 text-[#c99b43] focus:ring-[#c99b43] dark:border-slate-600"
                                        />
                                    ) : (
                                        <Input
                                            value={form.specific[field.name] ?? ''}
                                            onChange={(event) => handleSpecificChange(field.name, event.target.value)}
                                            type={field.type}
                                            placeholder={field.label}
                                        />
                                    )}
                                </label>
                            ))}
                        </div>
                    </section>
                    <section className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Features & amenities</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Update the amenities available at this property.
                        </p>
                        <FeatureMultiSelect
                            selectedFeatures={form.selectedFeatures}
                            onChange={(selectedFeatures) =>
                                setForm((prev) => ({ ...prev, selectedFeatures }))
                            }
                        />
                    </section>
                </div>
                <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Update property</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Submit changes when ready. Backend image replacement is supported if you upload new files.</p>
                    </div>
                    {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
                    <div className="space-y-4">
                        <Button type="submit" disabled={saving} className="w-full">
                            {saving ? 'Saving...' : 'Save changes'}
                        </Button>
                        <button
                            type="button"
                            onClick={() => navigate(`/owner/properties/${id}`)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                    </div>
                </aside>
            </form>
        </div>
    )
}
