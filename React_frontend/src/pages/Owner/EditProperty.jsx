import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPropertyById, updateProperty } from '../../api/property/propertyApi'
import FeatureMultiSelect from '../../components/property/FeatureMultiSelect'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'

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
                    property_name: data.property_name || '',
                    description: data.description || '',
                    price: data.price || '',
                    security_deposit: data.security_deposit || '',
                    listing_type: data.listing_type || 'house',
                    rental_unit: data.rental_unit || 'monthly',
                    address: data.address || '',
                    city: data.city || '',
                    country: data.country || '',
                    house_detail: data.house_detail || {},
                    car_detail: data.car_detail || {},
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

    const isHouse = form?.listing_type === 'house'

    const specificFields = useMemo(() => {
        if (!form) return []
        if (isHouse) {
            return [
                { name: 'bedrooms', label: 'Bedrooms', type: 'number' },
                { name: 'bathrooms', label: 'Bathrooms', type: 'number' },
                { name: 'area_sqft', label: 'Area (sqft)', type: 'number' },
                { name: 'furnishing', label: 'Furnishing (e.g. furnished, unfurnished)', type: 'text' },
                { name: 'floor_number', label: 'Floor Number', type: 'number' },
                { name: 'room_number', label: 'Room Number', type: 'number' },
            ]
        }
        return [
            { name: 'brand', label: 'Brand', type: 'text' },
            { name: 'model', label: 'Model', type: 'text' },
            { name: 'year', label: 'Year', type: 'number' },
            { name: 'mileage', label: 'Mileage', type: 'number' },
            { name: 'fuel_type', label: 'Fuel Type', type: 'text' },
            { name: 'seating_capacity', label: 'Seating Capacity', type: 'number' },
        ]
    }, [form, isHouse])

    const handleFieldChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSpecificChange = (key, value) => {
        const detailKey = isHouse ? 'house_detail' : 'car_detail'
        setForm((prev) => ({
            ...prev,
            [detailKey]: {
                ...prev[detailKey],
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
            payload.append('property_name', form.property_name)
            payload.append('description', form.description)
            payload.append('price', form.price)
            payload.append('security_deposit', form.security_deposit || '')
            payload.append('listing_type', form.listing_type)
            payload.append('rental_unit', form.rental_unit)
            payload.append('address', form.address)
            payload.append('city', form.city)
            payload.append('country', form.country)
            
            if (isHouse) {
                payload.append('house_detail', JSON.stringify(form.house_detail))
            } else {
                payload.append('car_detail', JSON.stringify(form.car_detail))
            }
            
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
                                Property Name
                                <Input value={form.property_name} onChange={(event) => handleFieldChange('property_name', event.target.value)} placeholder="Property Name" />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                City
                                <Input value={form.city} onChange={(event) => handleFieldChange('city', event.target.value)} placeholder="City" />
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
                                Address
                                <Input value={form.address} onChange={(event) => handleFieldChange('address', event.target.value)} placeholder="Address" />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Country
                                <Input value={form.country} onChange={(event) => handleFieldChange('country', event.target.value)} placeholder="Country" />
                            </label>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Listing Type
                                <select
                                    value={form.listing_type}
                                    disabled
                                    className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 cursor-not-allowed"
                                >
                                    <option value="house">House</option>
                                    <option value="car">Car</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Listing type cannot be changed.</p>
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Price
                                <Input value={form.price} onChange={(event) => handleFieldChange('price', event.target.value)} type="number" placeholder="25000" />
                            </label>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Rental Unit
                                <select
                                    value={form.rental_unit}
                                    onChange={(event) => handleFieldChange('rental_unit', event.target.value)}
                                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                >
                                    <option value="hourly">Per Hour</option>
                                    <option value="daily">Per Day</option>
                                    <option value="weekly">Per Week</option>
                                    <option value="monthly">Per Month</option>
                                    <option value="yearly">Per Year</option>
                                </select>
                            </label>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Security deposit
                                <Input value={form.security_deposit} onChange={(event) => handleFieldChange('security_deposit', event.target.value)} type="number" placeholder="5000" />
                            </label>
                        </div>
                        
                        <div>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Replace images
                                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                            </label>
                        </div>
                    </section>
                    
                    <section className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isHouse ? 'House details' : 'Car details'}</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {specificFields.map((field) => {
                                const detailKey = isHouse ? 'house_detail' : 'car_detail'
                                return (
                                    <label key={field.name} className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                        {field.label}
                                        <Input
                                            value={form[detailKey][field.name] ?? ''}
                                            onChange={(event) => handleSpecificChange(field.name, event.target.value)}
                                            type={field.type}
                                            placeholder={field.label}
                                        />
                                    </label>
                                )
                            })}
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
