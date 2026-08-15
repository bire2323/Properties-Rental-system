import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProperty } from '../../api/property/propertyApi'
import FeatureMultiSelect from '../../components/property/FeatureMultiSelect'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

const initialData = {
    property_name: '',
    description: '',
    price: '',
    security_deposit: '',
    listing_type: 'house',
    rental_unit: 'monthly',
    address: '',
    city: '',
    country: '',
    house_detail: {},
    car_detail: {},
    images: [],
    selectedFeatures: [],
}

export default function AddProperty() {
    const navigate = useNavigate()
    const [form, setForm] = useState(initialData)
    const [fieldErrors, setFieldErrors] = useState({})
    const [generalError, setGeneralError] = useState(null)
    const [loading, setLoading] = useState(false)

    const isHouse = form.listing_type === 'house'

    const specificFields = useMemo(() => {
        if (isHouse) {
            return [
                { name: 'bedrooms', label: 'Bedrooms', type: 'number', required: true },
                { name: 'bathrooms', label: 'Bathrooms', type: 'number', required: true },
                { name: 'area_sqft', label: 'Area (sqft)', type: 'number', required: true },
                { name: 'furnishing', label: 'Furnishing (e.g. furnished, unfurnished)', type: 'text', required: true },
                { name: 'floor_number', label: 'Floor Number', type: 'number', required: false },
                { name: 'room_number', label: 'Room Number', type: 'number', required: false },
            ]
        }
        return [
            { name: 'brand', label: 'Brand', type: 'text', required: true },
            { name: 'model', label: 'Model', type: 'text', required: true },
            { name: 'year', label: 'Year', type: 'number', required: true },
            { name: 'mileage', label: 'Mileage', type: 'number', required: false },
            { name: 'fuel_type', label: 'Fuel Type', type: 'text', required: false },
            { name: 'seating_capacity', label: 'Seating Capacity', type: 'number', required: true },
        ]
    }, [isHouse])

    const handleFieldChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        if (fieldErrors[key]) {
            setFieldErrors((prev) => ({ ...prev, [key]: '' }))
        }
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
        if (fieldErrors[`${detailKey}.${key}`]) {
            setFieldErrors((prev) => ({ ...prev, [`${detailKey}.${key}`]: '' }))
        }
    }

    const handleImageChange = (event) => {
        const files = Array.from(event.target.files)
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        const invalidFiles = files.filter(f => !validTypes.includes(f.type))
        if (invalidFiles.length) {
            setFieldErrors(prev => ({
                ...prev,
                images: 'Only JPEG, PNG, WebP and GIF images are allowed.'
            }))
            return
        }
        const maxSize = 5 * 1024 * 1024
        const oversized = files.filter(f => f.size > maxSize)
        if (oversized.length) {
            setFieldErrors(prev => ({
                ...prev,
                images: 'Images must be less than 5MB each.'
            }))
            return
        }
        setForm((prev) => ({ ...prev, images: files }))
        setFieldErrors(prev => ({ ...prev, images: '' }))
    }

    const validateForm = () => {
        const errors = {}

        const trimmedTitle = form.property_name.trim()
        if (!trimmedTitle) errors.property_name = 'Property name is required.'
        else if (trimmedTitle.length < 3) errors.property_name = 'Must be at least 3 characters.'

        const trimmedCity = form.city.trim()
        if (!trimmedCity) errors.city = 'City is required.'

        const priceValue = form.price.trim() === '' ? '' : form.price
        if (priceValue === '') {
            errors.price = 'Price is required.'
        } else {
            const priceNum = parseFloat(priceValue)
            if (isNaN(priceNum) || priceNum <= 0) {
                errors.price = 'Price must be a valid number greater than 0.'
            }
        }

        const requiredSpecific = specificFields.filter(f => f.required)
        const detailKey = isHouse ? 'house_detail' : 'car_detail'
        
        for (const field of requiredSpecific) {
            const val = form[detailKey][field.name]
            const trimmed = val?.toString().trim() || ''
            if (!trimmed) {
                errors[`${detailKey}.${field.name}`] = `${field.label} is required.`
            } else if (field.type === 'number') {
                const num = parseFloat(trimmed)
                if (isNaN(num) || num < 0) {
                    errors[`${detailKey}.${field.name}`] = `${field.label} must be a valid positive number.`
                }
            }
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setGeneralError(null)

        if (!validateForm()) {
            return
        }

        setLoading(true)

        try {
            const payload = new FormData()
            payload.append('property_name', form.property_name.trim())
            payload.append('description', form.description.trim())
            payload.append('price', parseFloat(form.price).toFixed(2))
            payload.append('security_deposit', form.security_deposit ? parseFloat(form.security_deposit).toFixed(2) : '')
            payload.append('listing_type', form.listing_type)
            payload.append('rental_unit', form.rental_unit)
            payload.append('address', form.address.trim())
            payload.append('city', form.city.trim())
            payload.append('country', form.country.trim())
            
            if (isHouse) {
                payload.append('house_detail', JSON.stringify(form.house_detail))
            } else {
                payload.append('car_detail', JSON.stringify(form.car_detail))
            }
            
            payload.append(
                'feature_ids',
                JSON.stringify(form.selectedFeatures.map((feature) => feature.id))
            )

            form.images.forEach((file) => {
                payload.append('images', file)
            })

            await createProperty(payload)
            navigate('/owner/properties')
        } catch (err) {
            setGeneralError(err.message || 'Unable to create property.')
        } finally {
            setLoading(false)
        }
    }

    const renderError = (key) => {
        const msg = fieldErrors[key]
        if (!msg) return null
        return <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{msg}</p>
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add Property</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create a new listing using the current property fields.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <section className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Basic information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    Property Name
                                    <Input
                                        name="property_name"
                                        value={form.property_name}
                                        onChange={(e) => handleFieldChange('property_name', e.target.value)}
                                        placeholder="Property Name"
                                        className={fieldErrors.property_name ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {renderError('property_name')}
                                </label>
                            </div>
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    City
                                    <Input
                                        name="city"
                                        value={form.city}
                                        onChange={(e) => handleFieldChange('city', e.target.value)}
                                        placeholder="City"
                                        className={fieldErrors.city ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {renderError('city')}
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Description
                                <textarea
                                    rows={5}
                                    value={form.description}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    placeholder="Brief description of the property"
                                />
                            </label>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    Address
                                    <Input
                                        value={form.address}
                                        onChange={(e) => handleFieldChange('address', e.target.value)}
                                        placeholder="Address"
                                    />
                                </label>
                            </div>
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    Country
                                    <Input
                                        value={form.country}
                                        onChange={(e) => handleFieldChange('country', e.target.value)}
                                        placeholder="Country"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    Listing Type
                                    <select
                                        value={form.listing_type}
                                        onChange={(e) => handleFieldChange('listing_type', e.target.value)}
                                        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        <option value="house">House</option>
                                        <option value="car">Car</option>
                                    </select>
                                </label>
                            </div>
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    Price
                                    <Input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.price}
                                        onChange={(e) => handleFieldChange('price', e.target.value)}
                                        placeholder="25000"
                                        className={fieldErrors.price ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {renderError('price')}
                                </label>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    Rental Unit
                                    <select
                                        value={form.rental_unit}
                                        onChange={(e) => handleFieldChange('rental_unit', e.target.value)}
                                        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                    >
                                        <option value="hourly">Per Hour</option>
                                        <option value="daily">Per Day</option>
                                        <option value="weekly">Per Week</option>
                                        <option value="monthly">Per Month</option>
                                        <option value="yearly">Per Year</option>
                                    </select>
                                </label>
                            </div>
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    Security Deposit
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.security_deposit}
                                        onChange={(e) => handleFieldChange('security_deposit', e.target.value)}
                                        placeholder="5000"
                                    />
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                Images
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                />
                                {renderError('images')}
                            </label>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isHouse ? 'House details' : 'Car details'}</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {specificFields.map((field) => {
                                const detailKey = isHouse ? 'house_detail' : 'car_detail'
                                const errorKey = `${detailKey}.${field.name}`
                                const hasError = !!fieldErrors[errorKey]
                                return (
                                    <div key={field.name}>
                                        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                            {field.label}
                                            {field.required && <span className="text-red-500">*</span>}
                                            <Input
                                                name={errorKey}
                                                value={form[detailKey][field.name] ?? ''}
                                                onChange={(e) => handleSpecificChange(field.name, e.target.value)}
                                                type={field.type}
                                                placeholder={field.label}
                                                className={hasError ? 'border-red-500 focus:border-red-500' : ''}
                                            />
                                            {renderError(errorKey)}
                                        </label>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Features & amenities</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Select amenities available at this property. Search and pick multiple features.
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
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Need help?</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Use the form above to create a new listing. Only supported fields are shown.</p>
                    </div>

                    {generalError && (
                        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            {generalError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Creating...' : 'Create property'}
                        </Button>
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties')}
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