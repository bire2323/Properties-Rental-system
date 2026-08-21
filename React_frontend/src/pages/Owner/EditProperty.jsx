import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Building2,
    Car,
    Plus,
    X,
    Loader2,
    MapPin,
    Navigation,
    ImagePlus
} from 'lucide-react'
import { getPropertyById, updateProperty, getMyManagedCompanies, createProperty } from '../../api/property/propertyApi'
import FeatureMultiSelect from '../../components/property/FeatureMultiSelect'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'
import { useAuth } from '../../hooks/useAuth'

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Rental & Ownership' },
    { id: 3, label: 'Location' },
    { id: 4, label: 'Details' },
    { id: 5, label: 'Features & Images' },
]

const selectClass =
    'h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
const textareaClass =
    'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5'
const errorClass = 'mt-1 text-xs text-red-500 dark:text-red-400'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function resolveImageSrc(img) {
    if (!img) return ''
    const url = typeof img === 'object' ? img.image : img
    if (!url) return ''
    return url.startsWith('http') ? url : `${API_BASE}${url}`
}


// ─── Shared UI helpers ────────────────────────────────────────────────────────

function FormField({ label, required, error, children }) {
    return (
        <div>
            <label className={labelClass}>
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {children}
            {error && <p className={errorClass}>{error}</p>}
        </div>
    )
}

function StepProgress({ currentStep }) {
    const progressWidth = ((currentStep - 1) / (STEPS.length - 1)) * 100

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between sm:hidden">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-sm text-slate-500">{STEPS[currentStep - 1]?.label}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 sm:hidden">
                <div
                    className="h-full rounded-full bg-[#c99b43] transition-all duration-300"
                    style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                />
            </div>

            <div className="hidden sm:block">
                <div className="relative px-2">
                    <div className="absolute left-8 right-8 top-5 h-0.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div
                        className="absolute left-8 top-5 h-0.5 rounded-full bg-[#c99b43] transition-all duration-300"
                        style={{ width: `calc(${progressWidth}% - 3.25rem)` }}
                    />

                    <div className="relative flex items-start justify-between gap-2">
                        {STEPS.map((step) => {
                            const isCompleted = currentStep > step.id
                            const isCurrent = currentStep === step.id

                            return (
                                <div key={step.id} className="flex w-1/5 min-w-0 flex-col items-center">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white shadow-sm dark:bg-slate-950">
                                        {isCompleted ? (
                                            <Check className="h-4 w-4 text-[#c99b43]" />
                                        ) : (
                                            <span
                                                className={`text-sm font-semibold ${isCurrent ? 'text-[#c99b43]' : 'text-slate-400'}`}
                                            >
                                                {step.id}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`mt-2 max-w-[90px] text-center text-[10px] font-medium leading-tight sm:text-[11px] ${isCurrent
                                            ? 'text-[#c99b43]'
                                            : isCompleted
                                                ? 'text-slate-600 dark:text-slate-300'
                                                : 'text-slate-400'
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
const MIN_IMAGES = 3

function getRemainingImageCount(form) {
    if (!form) return 0

    const existingImages = Array.isArray(form.existingImages)
        ? form.existingImages
        : []

    const deletedImageIds = Array.isArray(form.deletedImageIds)
        ? form.deletedImageIds
        : []

    const newImages = Array.isArray(form.newImages)
        ? form.newImages
        : []

    const remainingExistingImages = existingImages.filter(
        (image) => image?.id && !deletedImageIds.includes(image.id)
    )

    return remainingExistingImages.length + newImages.length
}
// ─── Validation ──────────────────────────────────────────────────────────────

function validateStep(step, form) {
    const errors = {}
    if (step === 1) {
        if (!form.property_name?.trim()) errors.property_name = 'Property name is required.'
        else if (form.property_name.trim().length < 3) errors.property_name = 'Must be at least 3 characters.'
        if (!form.description?.trim()) {
            errors.description = 'Description is required.';
        } else if (form.description.trim().length < 30) {
            errors.description = 'Description must be at least 30 characters.';
        }
    }
    if (step === 2) {
        if (!form.price || parseFloat(form.price) <= 0) errors.price = 'Enter a valid price greater than 0.'
        if (form.ownership === 'company' && !form.company) errors.company = 'Please select a company.'
    }
    if (step === 3) {
        if (!form.city?.trim()) errors.city = 'City is required.'
        if (!form.region?.trim()) errors.region = 'Region is required.'
        if (!form.kebele?.trim()) errors.kebele = 'Kebele is required.';
    }
    if (step === 4) {
        if (form.listing_type === 'house') {
            const h = form.house_detail || {}

            // Bedrooms
            if (h.bedrooms === '' || h.bedrooms === null) {
                errors['house_detail.bedrooms'] = 'Bedrooms is required.'
            } else if (Number(h.bedrooms) < 0) {
                errors['house_detail.bedrooms'] =
                    'Bedrooms cannot be negative.'
            }

            // Bathrooms
            if (h.bathrooms === '' || h.bathrooms === null) {
                errors['house_detail.bathrooms'] = 'Bathrooms is required.'
            } else if (Number(h.bathrooms) < 0) {
                errors['house_detail.bathrooms'] =
                    'Bathrooms cannot be negative.'
            }

            // Area
            if (
                h.area_sqft === '' ||
                h.area_sqft === null ||
                Number(h.area_sqft) <= 0
            ) {
                errors['house_detail.area_sqft'] =
                    'Area must be greater than 0.'
            }

            // Total Rooms
            if (
                h.total_rooms === '' ||
                h.total_rooms === null ||
                Number(h.total_rooms) <= 0
            ) {
                errors['house_detail.total_rooms'] =
                    'Total rooms must be greater than 0.'
            }
        }

        if (form.listing_type === 'car') {
            const c = form.car_detail || {}

            if (!c.brand?.trim()) {
                errors['car_detail.brand'] = 'Brand is required.'
            }

            if (!c.model?.trim()) {
                errors['car_detail.model'] = 'Model is required.'
            }

            if (!c.year) {
                errors['car_detail.year'] = 'Year is required.'
            }

            if (Number(c.year) < 1900) {
                errors['car_detail.year'] =
                    'Enter a valid year.'
            }

            if (!c.seating_capacity) {
                errors['car_detail.seating_capacity'] =
                    'Seating capacity is required.'
            } else if (Number(c.seating_capacity) < 1) {
                errors['car_detail.seating_capacity'] =
                    'Seating capacity must be at least 1.'
            }

            if (c.mileage === '' || c.mileage === null) {
                errors['car_detail.mileage'] =
                    'Mileage is required.'
            } else if (Number(c.mileage) < 0) {
                errors['car_detail.mileage'] =
                    'Mileage cannot be negative.'
            }
        }
    }
    if (step === 5) {
        const totalImages = getRemainingImageCount(form)

        if (totalImages < MIN_IMAGES) {
            errors.images =
                `At least ${MIN_IMAGES} images are required. ` +
                `You currently have ${totalImages}.`
        }
    }
    return errors
}

// ─── Build update payload ─────────────────────────────────────────────────────

function buildUpdatePayload(form) {
    const fd = new FormData()
    fd.append('property_name', form.property_name.trim())
    fd.append('description', form.description?.trim() || '')
    fd.append('listing_type', form.listing_type)
    fd.append('price', parseFloat(form.price).toFixed(2))
    fd.append('rental_unit', form.rental_unit)
    if (form.security_deposit) fd.append('security_deposit', parseFloat(form.security_deposit).toFixed(2))
    fd.append('is_available', form.is_available)
    fd.append('status', "active")
    if (form.company) fd.append('company', form.company)
    if (form.address?.trim()) fd.append('address', form.address.trim())
    fd.append('city', form.city.trim())
    fd.append('region', form.region.trim())
    if (form.kebele?.trim()) fd.append('kebele', form.kebele.trim())
    if (form.latitude) fd.append('latitude', form.latitude)
    if (form.longitude) fd.append('longitude', form.longitude)

    if (form.listing_type === 'house') {
        const h = form.house_detail || {}
        const hd = {}
        if (h.bedrooms) hd.bedrooms = parseInt(h.bedrooms)
        if (h.bathrooms) hd.bathrooms = parseInt(h.bathrooms)
        if (h.area_sqft) hd.area_sqft = parseInt(h.area_sqft)
        if (h.furnishing) hd.furnishing = h.furnishing
        if (h.room_number) hd.room_number = parseInt(h.room_number)
        if (h.total_rooms) hd.total_rooms = parseInt(h.total_rooms)
        if (h.distance_from_main_road) hd.distance_from_main_road = h.distance_from_main_road
        if (h.rules_to_follow) hd.rules_to_follow = h.rules_to_follow
        fd.append('house_detail', JSON.stringify(hd))
    } else {
        const c = form.car_detail || {}
        const cd = {}
        if (c.brand) cd.brand = c.brand
        if (c.model) cd.model = c.model
        if (c.year) cd.year = parseInt(c.year)
        if (c.mileage) cd.mileage = parseInt(c.mileage)
        if (c.fuel_type) cd.fuel_type = c.fuel_type
        if (c.seating_capacity) cd.seating_capacity = parseInt(c.seating_capacity)
        fd.append('car_detail', JSON.stringify(cd))
    }

    fd.append('feature_ids', JSON.stringify((form.selectedFeatures || []).map((f) => f.id)))

    // CRITICAL: Send new images ONLY if user actually uploaded them
    if (form.newImages?.length > 0) {
        form.newImages.forEach((image) => {
            fd.append('images', image.file)
        })
    }

    // Send deleted image IDs if user explicitly removed any
    if (form.deletedImageIds?.length > 0) {
        fd.append(
            'deleted_image_ids',
            JSON.stringify(form.deletedImageIds)
        )
    }

    return fd
}
function validateAllSteps(form) {
    const allErrors = {}

    for (let step = 1; step <= STEPS.length; step++) {
        Object.assign(
            allErrors,
            validateStep(step, form)
        )
    }

    return allErrors
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditProperty() {
    const { id } = useParams()
    const navigate = useNavigate()
    const formRef = useRef(null)
    const { user } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [form, setForm] = useState(null)
    const [errors, setErrors] = useState({})
    const [generalError, setGeneralError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loadError, setLoadError] = useState(null)
    const [companies, setCompanies] = useState([])


    const [gettingLocation, setGettingLocation] = useState(false)
    const [locationError, setLocationError] = useState(null)

    useEffect(() => {
        async function load() {
            setLoading(true)
            setLoadError(null)

            const isDraft = location.pathname.includes('/draft/edit')

            if (isDraft) {
                // ✅ Load from localStorage
                try {
                    const draftData = localStorage.getItem('property_add_draft')
                    if (draftData) {

                        const parsed = JSON.parse(draftData)
                        if (parsed.form.ownership === 'company' && !parsed.form.company) {
                            parsed.form.ownership = 'personal';
                        }
                        setForm(parsed.form)
                        setCurrentStep(parsed.currentStep);
                        setLoading(false)
                        return
                    } else {
                        setLoadError('No draft found. Please create a new property.')
                        setLoading(false)
                        return
                    }
                } catch (err) {
                    setLoadError('Failed to load draft .')
                    setLoading(false)
                    return
                }
            }
            try {
                const [data, companiesData] = await Promise.all([
                    getPropertyById(id),
                    getMyManagedCompanies().catch(() => []),
                ])
                const companiesArr = Array.isArray(companiesData)
                    ? companiesData
                    : companiesData.results || []
                setCompanies(companiesArr)

                const hd = data.house_detail || {}
                const cd = data.car_detail || {}

                setForm({
                    property_name: data.property_name || '',
                    description: data.description || '',
                    listing_type: data.listing_type || 'house',
                    price: data.price || '',
                    rental_unit: data.rental_unit || 'monthly',
                    security_deposit: data.security_deposit || '',
                    is_available: data.is_available ?? true,
                    status: data.status || 'active',
                    ownership: data.company ? 'company' : 'personal',
                    company: data.company?.id || null,
                    address: data.address || '',
                    city: data.city || '',
                    region: data.region || '',
                    kebele: data.kebele || '',
                    latitude: data.latitude || '',
                    longitude: data.longitude || '',
                    house_detail: {
                        bedrooms: hd.bedrooms ?? '',
                        bathrooms: hd.bathrooms ?? '',
                        area_sqft: hd.area_sqft ?? '',
                        furnishing: hd.furnishing || 'unfurnished',
                        room_number: hd.room_number ?? '',
                        total_rooms: hd.total_rooms ?? '',
                        distance_from_main_road: hd.distance_from_main_road || '',
                        rules_to_follow: hd.rules_to_follow || '',
                    },
                    car_detail: {
                        brand: cd.brand || '',
                        model: cd.model || '',
                        year: cd.year || '',
                        mileage: cd.mileage || '',
                        fuel_type: cd.fuel_type || 'petrol',
                        seating_capacity: cd.seating_capacity || '',
                    },
                    selectedFeatures: data.features || [],
                    // THREE-STATE IMAGE HANDLING
                    existingImages: data.images || [],
                    newImages: [],
                    deletedImageIds: [],
                })
            } catch (err) {
                setLoadError(err.message || 'Unable to load property.')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    useEffect(() => {
        if (!formRef.current) return
        const fields = Array.from(
            formRef.current.querySelectorAll(
                'input:not([type="hidden"]):not([type="file"]):not([type="button"]):not([type="submit"]), select, textarea'
            )
        ).filter((field) => !field.disabled && field.offsetParent !== null)

        if (fields.length > 0) {
            fields[0].focus()
        }
    }, [currentStep, form?.listing_type])

    const onChange = useCallback((key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }, [])

    const handleNext = () => {

        const stepErrors = validateStep(currentStep, form)
        // console.log("error", stepErrors/)
        if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return }
        setErrors({})
        setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBack = () => {
        setErrors({})
        setCurrentStep((prev) => Math.max(prev - 1, 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleNewImages = (event) => {
        const files = Array.from(event.target.files || [])

        if (!files.length) return

        const validImages = []
        const invalidFiles = []

        files.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                invalidFiles.push(file.name)
                return
            }

            if (file.size > 5 * 1024 * 1024) {
                invalidFiles.push(
                    `${file.name} exceeds the 5MB limit`
                )
                return
            }

            validImages.push({
                file,
                preview: URL.createObjectURL(file),
            })
        })

        if (invalidFiles.length > 0) {
            setGeneralError(
                `Some files could not be added: ${invalidFiles.join(', ')}`
            )
        }

        if (validImages.length > 0) {
            setForm((prev) => ({
                ...prev,
                newImages: [
                    ...(prev.newImages || []),
                    ...validImages,
                ],
            }))

            setErrors((prev) => {
                const next = { ...prev }
                delete next.images
                return next
            })
        }

        event.target.value = ''
    }
    const handleFormKeyDown = useCallback(
        (event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.target.tagName === 'TEXTAREA') return

            const target = event.target
            const type = target.type || ''
            if (['select-one', 'file', 'checkbox', 'radio'].includes(type) || target.tagName === 'SELECT') {
                return
            }

            const formNode = formRef.current
            if (!formNode) return

            const fields = Array.from(
                formNode.querySelectorAll(
                    'input:not([type="hidden"]):not([type="file"]):not([type="button"]):not([type="submit"]), select, textarea'
                )
            ).filter((field) => !field.disabled && field.offsetParent !== null)

            const currentIndex = fields.indexOf(target)
            if (currentIndex === -1) return

            event.preventDefault()

            if (currentIndex < fields.length - 1) {
                const next = fields[currentIndex + 1]
                next.focus()
                return
            }

            if (currentStep < STEPS.length) {
                handleNext()
            }
        },
        [currentStep, handleNext]
    )
    const handleUseMyLocation = () => {
        setLocationError(null)

        if (!navigator.geolocation) {
            setLocationError(
                'Geolocation is not supported by your browser.'
            )
            return
        }

        setGettingLocation(true)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords

                setForm((prev) => ({
                    ...prev,
                    latitude: latitude.toFixed(6),
                    longitude: longitude.toFixed(6),
                }))

                setGettingLocation(false)
            },
            (error) => {
                let message = 'Unable to get your location.'

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message =
                            'Location permission was denied. Please allow location access in your browser.'
                        break

                    case error.POSITION_UNAVAILABLE:
                        message =
                            'Your current location is unavailable.'
                        break

                    case error.TIMEOUT:
                        message =
                            'Location request timed out. Please try again.'
                        break

                    default:
                        message =
                            'An unexpected error occurred while getting your location.'
                }

                setLocationError(message)
                setGettingLocation(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        )
    }
    const handleSubmit = async () => {

        const allErrors = validateAllSteps(form)

        if (Object.keys(allErrors).length > 0) {
            setErrors(allErrors)

            const firstErrorStep = Math.min(
                ...Object.keys(allErrors).map(getErrorStep)
            )

            setCurrentStep(firstErrorStep)

            setGeneralError(
                'Please fix all validation errors before saving.'
            )

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })

            return
        }
        const isDraft = location.pathname.includes('/draft/edit')
        if (isDraft) {
            setSaving(true);
            try {

                // 1. Validate all steps (ensure all required fields are filled)
                const allErrors = {};
                for (let step = 1; step <= STEPS.length; step++) {
                    const stepErrors = validateStep(step, form);
                    Object.assign(allErrors, stepErrors);
                }
                if (Object.keys(allErrors).length > 0) {
                    setErrors(allErrors);
                    setSaving(false);
                    // Scroll to the first error step
                    const firstErrorStep = Object.keys(allErrors).reduce((min, key) => {
                        const step = key.includes('house_detail') || key.includes('car_detail') ? 4 : 1;
                        return Math.min(min, step);
                    }, 5);
                    setCurrentStep(firstErrorStep);
                    return;
                }


                const payload = buildUpdatePayload(form);


                await createProperty(payload);

                localStorage.removeItem('property_add_draft');

                navigate('/owner/properties');
            } catch (err) {
                setGeneralError('Failed to save draft.');
            } finally {
                setSaving(false);
            }
            return;
        }
        setSaving(true)
        setGeneralError(null)
        try {
            await updateProperty(id, buildUpdatePayload(form))
            navigate(`/owner/properties/${id}`)
        } catch (err) {
            setGeneralError(err.message || 'Unable to save changes.')
        } finally {
            setSaving(false)
        }
    }
    const handleNonNegativeNumber = (field, value) => {
        if (value === '' || Number(value) >= 0) {
            onChange('house_detail', {
                ...form.house_detail,
                [field]: value
            })
        }
    }

    const handleRemoveExistingImage = (imageId) => {
        if (form.deletedImageIds?.includes(imageId)) {
            return
        }

        onChange(
            'deletedImageIds',
            [
                ...(form.deletedImageIds || []),
                imageId,
            ]
        )
    }
    const handleRestoreExistingImage = (imageId) => {
        onChange(
            'deletedImageIds',
            form.deletedImageIds.filter(
                (id) => id !== imageId
            )
        )
    }

    const handleRemoveNewImage = (index) => {
        const imageToRemove = form.newImages[index]

        if (imageToRemove?.preview) {
            URL.revokeObjectURL(imageToRemove.preview)
        }

        const updated = form.newImages.filter(
            (_, i) => i !== index
        )

        onChange('newImages', updated)
    }

    if (loading) return <LoadingSkeleton />
    if (loadError) return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
            <p className="font-semibold">Unable to load property.</p>
            <p className="mt-2">{loadError}</p>
        </div>
    )
    if (!form) return <EmptyState title="Property not found" description="This property could not be loaded." />

    return (
        <div className="flex gap-6">
            <div className="w-full xl:w-[70%] space-y-6">
                {/* Header */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(`/owner/properties/${id}`)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Edit Property</h1>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Update your listing details.</p>
                        </div>
                    </div>
                </div>

                {/* Form card */}
                <div ref={formRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <StepProgress currentStep={currentStep} />

                    <div className="mt-6 space-y-5">

                        {/* ── Step 1 ── */}
                        {currentStep === 1 && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Information</h3>
                                </div>
                                <FormField label="Property Name" required error={errors.property_name}>
                                    <Input
                                        value={form.property_name}
                                        onKeyDown={handleFormKeyDown}
                                        onChange={(e) => onChange('property_name', e.target.value)}
                                        className={errors.property_name ? 'border-red-500' : ''}
                                        required
                                    />
                                </FormField>
                                <FormField label="Description" required error={errors.description}>
                                    <textarea
                                        rows={5}
                                        value={form.description}
                                        onKeyDown={handleFormKeyDown}
                                        onChange={(e) => onChange('description', e.target.value)}
                                        className={textareaClass}
                                        required
                                    />
                                </FormField>
                                <div>
                                    <p className={labelClass}>Listing Type</p>
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                        {form.listing_type === 'house'
                                            ? <Building2 className="h-5 w-5 text-[#c99b43]" />
                                            : <Car className="h-5 w-5 text-[#c99b43]" />
                                        }
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {form.listing_type === 'house' ? 'House / Apartment' : 'Car / Vehicle'}
                                        </span>
                                        <span className="ml-auto text-xs text-slate-400">(Cannot be changed)</span>
                                    </div>
                                </div>
                            </>
                        )}


                        {/* ── Step 2 ── */}
                        {/* {currentStep === 2 && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rental & Ownership</h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField label="Price (ETB)" required error={errors.price}>
                                        <Input type="number" step="0.01" min="0"
                                            value={form.price}
                                            onkeydown={handleFormKeyDown}
                                            onChange={(e) => onChange('price', e.target.value)}
                                            className={errors.price ? 'border-red-500' : ''} />
                                    </FormField>
                                    <FormField label="Rental Unit">
                                        <select value={form.rental_unit}
                                            onkeydown={handleFormKeyDown}
                                            onChange={(e) => onChange('rental_unit', e.target.value)} className={selectClass}>
                                            <option value="hourly">Per Hour</option>
                                            <option value="daily">Per Day</option>
                                            <option value="weekly">Per Week</option>
                                            <option value="monthly">Per Month</option>
                                            <option value="yearly">Per Year</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Security Deposit">
                                        <Input type="number" step="0.01" min="0"
                                            value={form.security_deposit}
                                            onkeydown={handleFormKeyDown}
                                            onChange={(e) => onChange('security_deposit', e.target.value)} />
                                    </FormField>
                                    <FormField label="Status">
                                        <select value={form.status}
                                            onkeydown={handleFormKeyDown}
                                            onChange={(e) => onChange('status', e.target.value)} className={selectClass}>
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="pending">Pending</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </FormField>
                                </div>
                                <FormField label="Availability">
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => onChange('is_available', !form.is_available)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.is_available ? 'bg-[#c99b43]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${form.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {form.is_available ? 'Available' : 'Not available'}
                                        </span>
                                    </div>
                                </FormField>
                            </>
                        )} */}
                        {currentStep === 2 && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rental & Ownership</h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField label="Price (ETB)" required error={errors.price}>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.price}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('price', e.target.value)}
                                            className={errors.price ? 'border-red-500' : ''}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Rental Unit" required>
                                        <select
                                            value={form.rental_unit}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('rental_unit', e.target.value)}
                                            className={selectClass}
                                            required
                                        >
                                            <option value="hourly">Per Hour</option>
                                            <option value="daily">Per Day</option>
                                            <option value="weekly">Per Week</option>
                                            <option value="monthly">Per Month</option>
                                            <option value="yearly">Per Year</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Security Deposit" >
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.security_deposit}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('security_deposit', e.target.value)}

                                        />
                                    </FormField>
                                    <FormField label="Status" required>
                                        <select
                                            value={form.status}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('status', e.target.value)}
                                            className={selectClass}
                                            required
                                        >
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="pending">Pending</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </FormField>
                                </div>
                                <FormField label="Availability">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => onChange('is_available', !form.is_available)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.is_available ? 'bg-[#c99b43]' : 'bg-slate-300 dark:bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${form.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {form.is_available ? 'Available' : 'Not available'}
                                        </span>
                                    </div>
                                </FormField>
                            </>
                        )}

                        {currentStep === 3 && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Location
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Enter the property location manually or use your current location.
                                    </p>
                                </div>

                                {/* Use My Location */}
                                <div className="rounded-2xl border border-[#c99b43]/30 bg-[#c99b43]/5 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                        <div className="flex items-start gap-3">
                                            <div className="rounded-xl bg-[#c99b43]/10 p-2 text-[#c99b43]">
                                                <MapPin className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                    Use My Current Location
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Automatically fill the latitude and longitude using your device location.
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleUseMyLocation}
                                            disabled={gettingLocation}
                                            className="bg-[#c99b43] text-white hover:bg-[#b08838]"
                                        >
                                            {gettingLocation ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Getting Location...
                                                </>
                                            ) : (
                                                <>
                                                    <Navigation className="mr-2 h-4 w-4" />
                                                    Use My Location
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {locationError && (
                                        <p className="mt-3 text-xs text-red-500">
                                            {locationError}
                                        </p>
                                    )}

                                    {(form.latitude || form.longitude) && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                            <Check className="h-4 w-4" />
                                            Location coordinates have been set.
                                        </div>
                                    )}
                                </div>

                                {/* Address */}
                                <FormField label="Address" required>
                                    <Input
                                        value={form.address}
                                        onKeyDown={handleFormKeyDown}
                                        onChange={(e) => onChange('address', e.target.value)}
                                        placeholder="Street address"
                                        required
                                    />
                                </FormField>

                                {/* City / Region */}
                                <div className="grid gap-4 sm:grid-cols-2">

                                    <FormField
                                        label="City"
                                        required
                                        error={errors.city}
                                    >
                                        <Input
                                            value={form.city}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) =>
                                                onChange('city', e.target.value)
                                            }
                                            className={
                                                errors.city ? 'border-red-500' : ''
                                            }
                                            placeholder="e.g. Addis Ababa"
                                            required
                                        />
                                    </FormField>

                                    <FormField
                                        label="Region"
                                        required
                                        error={errors.region}
                                    >
                                        <Input
                                            value={form.region}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) =>
                                                onChange('region', e.target.value)
                                            }
                                            className={
                                                errors.region ? 'border-red-500' : ''
                                            }
                                            placeholder="e.g. Addis Ababa"
                                            required
                                        />
                                    </FormField>

                                </div>

                                {/* Kebele */}
                                <FormField
                                    label="Kebele"
                                    required
                                    error={errors.kebele}
                                >
                                    <Input
                                        value={form.kebele}
                                        onKeyDown={handleFormKeyDown}
                                        onChange={(e) =>
                                            onChange('kebele', e.target.value)
                                        }
                                        placeholder="e.g. 01, 02..."
                                        className={
                                            errors.kebele ? 'border-red-500' : ''
                                        }
                                        required
                                    />
                                </FormField>

                                {/* Coordinates */}
                                <div className="grid gap-4 sm:grid-cols-2">

                                    <FormField label="Latitude">
                                        <Input
                                            type="number"
                                            step="any"
                                            onKeyDown={handleFormKeyDown}
                                            value={form.latitude}
                                            onChange={(e) =>
                                                onChange('latitude', e.target.value)
                                            }
                                            placeholder="9.0054"
                                        />
                                    </FormField>

                                    <FormField label="Longitude">
                                        <Input
                                            type="number"
                                            step="any"
                                            onKeyDown={handleFormKeyDown}
                                            value={form.longitude}
                                            onChange={(e) =>
                                                onChange('longitude', e.target.value)
                                            }
                                            placeholder="38.7636"
                                        />
                                    </FormField>

                                </div>
                            </>
                        )}

                        {/* ── Step 4: House ── */}
                        {/* {currentStep === 4 && form.listing_type === 'house' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">House Details</h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField label="Bedrooms" required error={errors['house_detail.bedrooms']}>
                                        <Input type="number" min="0" value={form.house_detail.bedrooms}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, bedrooms: e.target.value })}
                                            className={errors['house_detail.bedrooms'] ? 'border-red-500' : ''} />
                                    </FormField>
                                    <FormField label="Bathrooms" required error={errors['house_detail.bathrooms']}>
                                        <Input type="number" min="0" value={form.house_detail.bathrooms}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, bathrooms: e.target.value })}
                                            className={errors['house_detail.bathrooms'] ? 'border-red-500' : ''} />
                                    </FormField>
                                    <FormField label="Area (sqft)" required error={errors['house_detail.area_sqft']}>
                                        <Input type="number" min="0" value={form.house_detail.area_sqft}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, area_sqft: e.target.value })}
                                            className={errors['house_detail.area_sqft'] ? 'border-red-500' : ''} />
                                    </FormField>
                                    <FormField label="Furnishing">
                                        <select value={form.house_detail.furnishing}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, furnishing: e.target.value })}
                                            className={selectClass}>
                                            <option value="furnished">Furnished</option>
                                            <option value="semi_furnished">Semi-Furnished</option>
                                            <option value="unfurnished">Unfurnished</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Room Number">
                                        <Input type="number" min="0" value={form.house_detail.room_number}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, room_number: e.target.value })} />
                                    </FormField>
                                    <FormField label="Total Rooms">
                                        <Input type="number" min="0" value={form.house_detail.total_rooms}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, total_rooms: e.target.value })} />
                                    </FormField>
                                    <FormField label="Distance from Main Road">
                                        <Input value={form.house_detail.distance_from_main_road}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, distance_from_main_road: e.target.value })}
                                            placeholder="e.g. 500 m" />
                                    </FormField>
                                </div>
                                <FormField label="Rules to Follow">
                                    <textarea rows={3} value={form.house_detail.rules_to_follow}
                                        onChange={(e) => onChange('house_detail', { ...form.house_detail, rules_to_follow: e.target.value })}
                                        className={textareaClass} placeholder="e.g. No smoking..." />
                                </FormField>
                            </>
                        )} */}
                        {currentStep === 4 && form.listing_type === 'house' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">House Details</h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField label="Bedrooms" required error={errors['house_detail.bedrooms']}>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={form.house_detail.bedrooms}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) =>
                                                handleNonNegativeNumber('bedrooms', e.target.value)
                                            }
                                            className={
                                                errors['house_detail.bedrooms']
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Bathrooms" required error={errors['house_detail.bathrooms']}>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={form.house_detail.bathrooms}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) =>
                                                handleNonNegativeNumber('bathrooms', e.target.value)
                                            }
                                            className={
                                                errors['house_detail.bathrooms']
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Area (sqft)" required error={errors['house_detail.area_sqft']}>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={form.house_detail.area_sqft}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, area_sqft: e.target.value })}
                                            className={errors['house_detail.area_sqft'] ? 'border-red-500' : ''}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Furnishing" required>
                                        <select
                                            value={form.house_detail.furnishing}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('house_detail', { ...form.house_detail, furnishing: e.target.value })}
                                            className={selectClass}
                                            required
                                        >
                                            <option value="furnished">Furnished</option>
                                            <option value="semi_furnished">Semi-Furnished</option>
                                            <option value="unfurnished">Unfurnished</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Room Number">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={form.house_detail.room_number}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) =>
                                                onChange('house_detail', {
                                                    ...form.house_detail,
                                                    room_number: e.target.value
                                                })
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Total Rooms"
                                        required
                                        error={errors['house_detail.total_rooms']}
                                    >
                                        <Input
                                            type="number"
                                            min="1"
                                            value={form.house_detail.total_rooms}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) =>
                                                onChange('house_detail', {
                                                    ...form.house_detail,
                                                    total_rooms: e.target.value
                                                })
                                            }
                                            className={
                                                errors['house_detail.total_rooms']
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Distance from Main Road">
                                        <Input
                                            value={form.house_detail.distance_from_main_road}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) =>
                                                onChange('house_detail', {
                                                    ...form.house_detail,
                                                    distance_from_main_road: e.target.value
                                                })
                                            }
                                            placeholder="e.g. 500 m"
                                        />
                                    </FormField>
                                </div>
                                <FormField label="Rules to Follow" required>
                                    <textarea
                                        rows={3}
                                        value={form.house_detail.rules_to_follow}
                                        onKeyDown={handleFormKeyDown}
                                        onChange={(e) => onChange('house_detail', { ...form.house_detail, rules_to_follow: e.target.value })}
                                        className={textareaClass}
                                        placeholder="e.g. No smoking..."
                                        required
                                    />
                                </FormField>
                            </>
                        )}
                        {/* ── Step 4: Car ── */}
                        {/* {currentStep === 4 && form.listing_type === 'car' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Car Details</h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField label="Brand" required error={errors['car_detail.brand']}>
                                        <Input value={form.car_detail.brand}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, brand: e.target.value })}
                                            className={errors['car_detail.brand'] ? 'border-red-500' : ''} />
                                    </FormField>
                                    <FormField label="Model" required error={errors['car_detail.model']}>
                                        <Input value={form.car_detail.model}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, model: e.target.value })}
                                            className={errors['car_detail.model'] ? 'border-red-500' : ''} />
                                    </FormField>
                                    <FormField label="Year" required error={errors['car_detail.year']}>
                                        <Input type="number" min="1900" value={form.car_detail.year}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, year: e.target.value })}
                                            className={errors['car_detail.year'] ? 'border-red-500' : ''} />
                                    </FormField>
                                    <FormField label="Seating Capacity" required error={errors['car_detail.seating_capacity']}>
                                        <Input type="number" min="1" value={form.car_detail.seating_capacity}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, seating_capacity: e.target.value })}
                                            className={errors['car_detail.seating_capacity'] ? 'border-red-500' : ''} />
                                    </FormField>
                                    <FormField label="Mileage (km)">
                                        <Input type="number" min="0" value={form.car_detail.mileage}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, mileage: e.target.value })} />
                                    </FormField>
                                    <FormField label="Fuel Type">
                                        <select value={form.car_detail.fuel_type}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, fuel_type: e.target.value })}
                                            className={selectClass}>
                                            <option value="petrol">Petrol</option>
                                            <option value="diesel">Diesel</option>
                                            <option value="electric">Electric</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </FormField>
                                </div>
                            </>
                        )} */}
                        {currentStep === 4 && form.listing_type === 'car' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Car Details</h3>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField label="Brand" required error={errors['car_detail.brand']}>
                                        <Input
                                            value={form.car_detail.brand}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, brand: e.target.value })}
                                            className={errors['car_detail.brand'] ? 'border-red-500' : ''}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Model" required error={errors['car_detail.model']}>
                                        <Input
                                            value={form.car_detail.model}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, model: e.target.value })}
                                            className={errors['car_detail.model'] ? 'border-red-500' : ''}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Year" required error={errors['car_detail.year']}>
                                        <Input
                                            type="number"
                                            min="1900"
                                            value={form.car_detail.year}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, year: e.target.value })}
                                            className={errors['car_detail.year'] ? 'border-red-500' : ''}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Seating Capacity" required error={errors['car_detail.seating_capacity']}>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={form.car_detail.seating_capacity}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, seating_capacity: e.target.value })}
                                            className={errors['car_detail.seating_capacity'] ? 'border-red-500' : ''}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Mileage (km)" required>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={form.car_detail.mileage}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, mileage: e.target.value })}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="Fuel Type" required>
                                        <select
                                            value={form.car_detail.fuel_type}
                                            onKeyDown={handleFormKeyDown}
                                            onChange={(e) => onChange('car_detail', { ...form.car_detail, fuel_type: e.target.value })}
                                            className={selectClass}
                                            required
                                        >
                                            <option value="petrol">Petrol</option>
                                            <option value="diesel">Diesel</option>
                                            <option value="electric">Electric</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </FormField>
                                </div>
                            </>
                        )}

                        {/* ── Step 5 ── */}
                        {currentStep === 5 && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Features & Images</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Update amenities and images. Existing images are kept unless you explicitly remove them.
                                    </p>

                                </div>
                                {errors.images && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                                        {errors.images}
                                    </div>
                                )}

                                <div>
                                    <p className={labelClass}>Features & Amenities</p>
                                    <FeatureMultiSelect
                                        selectedFeatures={form.selectedFeatures}
                                        onChange={(features) => onChange('selectedFeatures', features)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className={labelClass}>
                                        Property Images
                                    </p>

                                    <span
                                        className={`text-xs font-medium ${getRemainingImageCount(form) >= 3
                                            ? 'text-green-600'
                                            : 'text-red-500'
                                            }`}
                                    >
                                        {getRemainingImageCount(form)} / minimum 3 images
                                    </span>
                                </div>
                                {/* EXISTING IMAGES WITH DELETE BUTTONS */}
                                {form.existingImages?.length > 0 && (
                                    <div>
                                        <p className={labelClass}>Current Images</p>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {form.existingImages
                                                .filter((img) => !form.deletedImageIds?.includes(img.id))
                                                .map((img) => (
                                                    <div key={img.id} className="relative group">
                                                        <img
                                                            src={resolveImageSrc(img)}
                                                            alt={`Image ${img.id}`}
                                                            className="h-28 w-full rounded-2xl object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveExistingImage(img.id)}
                                                            className="absolute top-1 right-1 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
                                                            title="Delete image"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                                {form.newImages?.length > 0 && (
                                    <div className="mt-4">

                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                New Images ({form.newImages.length})
                                            </p>

                                            <span className="text-xs text-slate-400">
                                                These will be uploaded when you save.
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                                            {form.newImages.map((image, idx) => (
                                                <div
                                                    key={`${image.file.name}-${idx}`}
                                                    className="group relative overflow-hidden rounded-2xl"
                                                >
                                                    <img
                                                        src={image.preview}
                                                        alt={`New property image ${idx + 1}`}
                                                        className="h-32 w-full object-cover"
                                                    />

                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                        <p className="truncate text-xs text-white">
                                                            {image.file.name}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveNewImage(idx)
                                                        }
                                                        className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white shadow-md opacity-0 transition group-hover:opacity-100"
                                                        title="Remove image"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}

                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className={labelClass}>
                                        Upload New Images
                                        <span className="ml-1 text-xs text-slate-400">
                                            (PNG, JPG, WEBP — max 5MB each)
                                        </span>
                                    </p>

                                    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-[#c99b43] hover:bg-[#c99b43]/5 dark:border-slate-700 dark:bg-slate-900">

                                        <div className="rounded-2xl bg-[#c99b43]/10 p-3">
                                            <ImagePlus className="h-6 w-6 text-[#c99b43]" />
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Add property images
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Click here to select one or more images
                                            </p>
                                        </div>

                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            multiple
                                            className="sr-only"
                                            onChange={handleNewImages}
                                        />
                                    </label>
                                </div>
                            </>
                        )}
                    </div>

                    {generalError && (
                        <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            {generalError}
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-between gap-3">
                        <button type="button" onClick={handleBack} disabled={currentStep === 1}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                            <ChevronLeft className="h-4 w-4" /> Back
                        </button>

                        {currentStep < STEPS.length ? (
                            <button type="button" onClick={handleNext}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]">
                                Continue <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={saving}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838] disabled:opacity-60">
                                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <aside className="hidden w-[30%] xl:flex">
                <div className="flex w-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
                    <div className="relative h-56 overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80"
                            alt="Property listing inspiration"
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] text-white backdrop-blur-sm uppercase">
                            Edit listing
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="mb-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c99b43]">
                                Update in 5 steps
                            </p>
                            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                Keep your listing fresh
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {[
                                ['01', 'Review basics', 'Check the title, type, and description.'],
                                ['02', 'Adjust pricing', 'Update your rate, deposit, and availability.'],
                                ['03', 'Fix location', 'Correct the city, region, and address details.'],
                                ['04', 'Refresh details', 'Update room specs, features, and property info.'],
                                ['05', 'Manage photos', 'Upload new images or remove outdated ones.'],
                            ].map(([step, title, desc]) => (
                                <div key={step} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/80">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#c99b43]/10 text-xs font-bold text-[#c99b43]">
                                        {step}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
                                        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    )
}
