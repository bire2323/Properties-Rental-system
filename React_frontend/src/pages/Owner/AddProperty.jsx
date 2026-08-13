import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProperty } from '../../api/property/propertyApi'
import FeatureMultiSelect from '../../components/property/FeatureMultiSelect'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

const initialData = {
    title: '',
    description: '',
    price: '',
    security_deposit: '',
    property_type: 'house',
    location: '',
    specific: {},
    images: [],
    selectedFeatures: [],
}

export default function AddProperty() {
    const navigate = useNavigate()
    const [form, setForm] = useState(initialData)
    const [fieldErrors, setFieldErrors] = useState({})
    const [generalError, setGeneralError] = useState(null)
    const [loading, setLoading] = useState(false)

    const isHouse = form.property_type === 'house'

    const specificFields = useMemo(() => {
        if (isHouse) {
            return [
                { name: 'bedrooms', label: 'Bedrooms', type: 'number', required: true },
                { name: 'bathrooms', label: 'Bathrooms', type: 'number', required: true },
                { name: 'area_sqft', label: 'Area (sqft)', type: 'number', required: true },
                { name: 'has_garage', label: 'Garage', type: 'checkbox', required: false },
                { name: 'furnishing_status', label: 'Furnishing', type: 'text', required: false },
            ]
        }
        return [
            { name: 'brand', label: 'Brand', type: 'text', required: true },
            { name: 'car_model', label: 'Model', type: 'text', required: true },
            { name: 'year', label: 'Year', type: 'number', required: true },
            { name: 'mileage', label: 'Mileage', type: 'number', required: true },
            { name: 'fuel_type', label: 'Fuel Type', type: 'text', required: false },
            { name: 'transmission', label: 'Transmission', type: 'text', required: false },
            { name: 'seating_capacity', label: 'Seating Capacity', type: 'number', required: false },
        ]
    }, [isHouse])

    // ─── Field change handlers ──────────────────────────────────────
    const handleFieldChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        // Clear error for this field when user types
        if (fieldErrors[key]) {
            setFieldErrors((prev) => ({ ...prev, [key]: '' }))
        }
    }

    const handleSpecificChange = (key, value) => {
        setForm((prev) => ({
            ...prev,
            specific: {
                ...prev.specific,
                [key]: value,
            },
        }))
        // Clear specific field error
        if (fieldErrors[`specific.${key}`]) {
            setFieldErrors((prev) => ({ ...prev, [`specific.${key}`]: '' }))
        }
    }

    const handleImageChange = (event) => {
        const files = Array.from(event.target.files)
        // Validate file types & size (optional)
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        const invalidFiles = files.filter(f => !validTypes.includes(f.type))
        if (invalidFiles.length) {
            setFieldErrors(prev => ({
                ...prev,
                images: 'Only JPEG, PNG, WebP and GIF images are allowed.'
            }))
            return
        }
        const maxSize = 5 * 1024 * 1024 // 5MB
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

    // ─── Validation ──────────────────────────────────────────────────
    const validateForm = () => {
        const errors = {}

        // 1. Basic fields
        const trimmedTitle = form.title.trim()
        if (!trimmedTitle) errors.title = 'Title is required.'
        else if (trimmedTitle.length < 3) errors.title = 'Title must be at least 3 characters.'

        const trimmedLocation = form.location.trim()
        if (!trimmedLocation) errors.location = 'Location is required.'

        // Price validation
        const priceValue = form.price.trim() === '' ? '' : form.price
        if (priceValue === '') {
            errors.price = 'Price is required.'
        } else {
            const priceNum = parseFloat(priceValue)
            if (isNaN(priceNum) || priceNum <= 0) {
                errors.price = 'Price must be a valid number greater than 0.'
            }
        }

        // 2. Specific fields (based on property type)
        const requiredSpecific = specificFields.filter(f => f.required)
        for (const field of requiredSpecific) {
            const val = form.specific[field.name]
            if (field.type === 'checkbox') {
                // checkbox is optional, no validation needed
                continue
            }
            const trimmed = val?.toString().trim() || ''
            if (!trimmed) {
                errors[`specific.${field.name}`] = `${field.label} is required.`
            } else if (field.type === 'number') {
                const num = parseFloat(trimmed)
                if (isNaN(num) || num < 0) {
                    errors[`specific.${field.name}`] = `${field.label} must be a valid positive number.`
                }
            }
        }

        // 3. Images (optional)
        // No validation required for images

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    // ─── Submit ──────────────────────────────────────────────────────
    const handleSubmit = async (event) => {
        event.preventDefault()
        setGeneralError(null)

        if (!validateForm()) {
            // Scroll to first error
            const firstErrorKey = Object.keys(fieldErrors)[0]
            if (firstErrorKey) {
                const el = document.querySelector(`[name="${firstErrorKey}"]`)
                if (el) el.focus()
            }
            return
        }

        setLoading(true)

        try {
            const payload = new FormData()
            // Trim strings
            payload.append('title', form.title.trim())
            payload.append('description', form.description.trim())
            payload.append('price', parseFloat(form.price).toFixed(2))
            payload.append('security_deposit', form.security_deposit ? parseFloat(form.security_deposit).toFixed(2) : '0.00')
            payload.append('property_type', form.property_type)
            payload.append('location', form.location.trim())
            payload.append('specific', JSON.stringify(form.specific))
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

    // ─── Render Helper ──────────────────────────────────────────────
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
                                    Title
                                    <Input
                                        name="title"
                                        value={form.title}
                                        onChange={(e) => handleFieldChange('title', e.target.value)}
                                        placeholder="Property title"
                                        className={fieldErrors.title ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {renderError('title')}
                                </label>
                            </div>
                            <div>
                                <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                    Location
                                    <Input
                                        name="location"
                                        value={form.location}
                                        onChange={(e) => handleFieldChange('location', e.target.value)}
                                        placeholder="Addis Ababa"
                                        className={fieldErrors.location ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {renderError('location')}
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
                                    Property Type
                                    <select
                                        value={form.property_type}
                                        onChange={(e) => handleFieldChange('property_type', e.target.value)}
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
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{isHouse ? 'House details' : 'Car details'}</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {specificFields.map((field) => {
                                const errorKey = `specific.${field.name}`
                                const hasError = !!fieldErrors[errorKey]
                                return (
                                    <div key={field.name}>
                                        <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                            {field.label}
                                            {field.required && <span className="text-red-500">*</span>}
                                            {field.type === 'checkbox' ? (
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(form.specific[field.name])}
                                                    onChange={(e) => handleSpecificChange(field.name, e.target.checked)}
                                                    className="h-5 w-5 rounded border-slate-300 text-[#c99b43] focus:ring-[#c99b43] dark:border-slate-600"
                                                />
                                            ) : (
                                                <Input
                                                    name={errorKey}
                                                    value={form.specific[field.name] ?? ''}
                                                    onChange={(e) => handleSpecificChange(field.name, e.target.value)}
                                                    type={field.type}
                                                    placeholder={field.label}
                                                    className={hasError ? 'border-red-500 focus:border-red-500' : ''}
                                                />
                                            )}
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