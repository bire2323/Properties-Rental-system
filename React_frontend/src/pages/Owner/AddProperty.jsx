import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    Check, ChevronRight, ChevronLeft, Building2, Car,
    Plus, X, Loader2, Home, CarFront,
    Upload, ImagePlus, CheckCircle2, AlertCircle,
    Sofa, BedDouble, Bath, House, MapPin
} from 'lucide-react'
import { createProperty, getMyManagedCompanies } from '../../api/property/propertyApi'
import FeatureMultiSelect from '../../components/property/FeatureMultiSelect'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useAuth } from '../../hooks/useAuth'
import { useLocationSelector } from '../../hooks/useLocationSelector'

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Rental & Ownership' },
    { id: 3, label: 'Location' },
    { id: 4, label: 'Details' },
    { id: 5, label: 'Features & Images' },
]

const DRAFT_STORAGE_KEY = 'property_add_draft'

const INITIAL_STATE = {
    // Step 1
    property_name: '',
    description: '',
    listing_type: 'house',
    // Step 2
    price: '',
    rental_unit: 'monthly',
    security_deposit: '',
    is_available: true,
    status: 'active',
    ownership: 'personal',
    company: null,
    // Step 3
    address: '',
    region: null,
    city: null,
    kebele: '',
    latitude: '',
    longitude: '',
    // Step 4
    house_detail: {
        bedrooms: '',
        bathrooms: '',
        area_sqft: '',
        furnishing: 'unfurnished',
        room_number: '',
        total_rooms: '',
        distance_from_main_road: '',
        rules_to_follow: '',
    },
    car_detail: {
        brand: '',
        model: '',
        year: '',
        mileage: '',
        fuel_type: 'petrol',
        seating_capacity: '',
    },
    // Step 5
    selectedFeatures: [],
    images: [],
    _imageError: '',
}

// ─── Shared style tokens ─────────────────────────────────────────────────────

const selectClass =
    'h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
const textareaClass =
    'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5'
const errorClass = 'mt-1 text-xs text-red-500 dark:text-red-400'

function getDraftSnapshot(form, currentStep) {
    return {
        currentStep,
        form: {
            ...form,
            images: [],
            newImages: [],
            _imageError: '',
            selectedFeatures: Array.isArray(form.selectedFeatures)
                ? form.selectedFeatures.map((feature) => ({
                    id: feature?.id ?? feature,
                    name: feature?.name ?? '',
                }))
                : [],
        },
    }
}

function hasMeaningfulDraftData(form) {
    if (!form || typeof form !== 'object') return false

    const normalized = {
        ...INITIAL_STATE,
        ...form,
        house_detail: {
            ...INITIAL_STATE.house_detail,
            ...(form.house_detail || {}),
        },
        car_detail: {
            ...INITIAL_STATE.car_detail,
            ...(form.car_detail || {}),
        },
        selectedFeatures: Array.isArray(form.selectedFeatures) ? form.selectedFeatures : [],
        images: [],
        newImages: [],
        _imageError: '',
    }

    const defaultShape = {
        ...INITIAL_STATE,
        house_detail: { ...INITIAL_STATE.house_detail },
        car_detail: { ...INITIAL_STATE.car_detail },
        selectedFeatures: [],
        images: [],
        newImages: [],
        _imageError: '',
    }

    return JSON.stringify(normalized) !== JSON.stringify(defaultShape)
}

function loadDraft() {
    if (typeof window === 'undefined') return null
    try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || !parsed.form || !hasMeaningfulDraftData(parsed.form)) {
            window.localStorage.removeItem(DRAFT_STORAGE_KEY)
            return null
        }
        return parsed
    } catch {
        return null
    }
}

function saveDraft(form, currentStep) {
    if (typeof window === 'undefined') return
    if (!hasMeaningfulDraftData(form)) {
        return
    }
    const snapshot = getDraftSnapshot(form, currentStep)
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(snapshot))
}

function clearDraft() {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
}

// ─── Field wrapper ───────────────────────────────────────────────────────────

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

// ─── Progress indicator ──────────────────────────────────────────────────────

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
                                                className={`text-sm font-semibold ${isCurrent ? 'text-[#c99b43]' : 'text-slate-400'
                                                    }`}
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

// ─── Step 1: Basic Info ──────────────────────────────────────────────────────

function Step1({ form, onChange, errors }) {
    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Information</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Tell us the basics about your property listing.
                </p>
            </div>

            <FormField label="Property Name" required error={errors.property_name}>
                <Input
                    value={form.property_name}
                    onChange={(e) => onChange('property_name', e.target.value)}
                    placeholder="e.g. Cozy 3-Bedroom Apartment in Bole"
                    className={errors.property_name ? 'border-red-500' : ''}
                />
            </FormField>

            <FormField label="Description" required error={errors.description}>
                <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    className={`${textareaClass} ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Describe the property — location highlights, nearby amenities, unique features..."
                />
            </FormField>

            <div>
                <p className={labelClass}>
                    Listing Type <span className="text-red-500">*</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {[
                        { value: 'house', label: 'House / Apartment', Icon: Building2, desc: 'Rooms, studios, villas, apartments' },
                        { value: 'car', label: 'Car / Vehicle', Icon: Car, desc: 'Cars, trucks, minibuses' },
                    ].map(({ value, label, Icon, desc }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onChange('listing_type', value)}
                            className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${form.listing_type === value
                                ? 'border-[#c99b43] bg-[#c99b43]/5'
                                : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                                }`}
                        >
                            <div
                                className={`rounded-xl p-2 ${form.listing_type === value
                                    ? 'bg-[#c99b43] text-white'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Step 2: Rental & Ownership ──────────────────────────────────────────────

function Step2({ form, onChange, errors, companies, companiesLoading, onAddCompany, user }) {
    const managedCompanies = companies.filter(
        (c) => Array.isArray(c.manager_ids) && c.manager_ids.includes(user?.id)
    )

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rental & Ownership</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Set pricing and define who owns this listing.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Price (ETB)" required error={errors.price}>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => onChange('price', e.target.value)}
                        placeholder="25000"
                        className={errors.price ? 'border-red-500' : ''}
                    />
                </FormField>
                <FormField label="Rental Unit" required>
                    <select
                        value={form.rental_unit}
                        onChange={(e) => onChange('rental_unit', e.target.value)}
                        className={selectClass}
                    >
                        <option value="hourly">Per Hour</option>
                        <option value="daily">Per Day</option>
                        <option value="weekly">Per Week</option>
                        <option value="monthly">Per Month</option>
                        <option value="yearly">Per Year</option>
                    </select>
                </FormField>
                <FormField label="Security Deposit">
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.security_deposit}
                        onChange={(e) => onChange('security_deposit', e.target.value)}
                        placeholder="5000"
                    />
                </FormField>
                <FormField label="Status">
                    <select
                        value={form.status}
                        onChange={(e) => onChange('status', e.target.value)}
                        className={selectClass}
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
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.is_available ? 'bg-[#c99b43]' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${form.is_available ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                        {form.is_available ? 'Available for rent' : 'Not available'}
                    </span>
                </div>
            </FormField>

            <div>
                <p className={labelClass}>Where are you listing this property?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {[
                        { value: 'personal', label: 'My Personal Listings', description: 'Individual listing under your account' },
                        { value: 'company', label: 'A Company', description: 'Property owned by one of your managed companies' },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange('ownership', opt.value)
                                if (opt.value === 'personal') onChange('company', null)
                            }}
                            className={`rounded-2xl border-2 p-4 text-left transition ${form.ownership === opt.value
                                ? 'border-[#c99b43] bg-[#c99b43]/5 text-[#c99b43]'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'
                                }`}
                        >
                            <div className="font-semibold">{opt.label}</div>
                            <div className="mt-1 text-xs opacity-80">{opt.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {form.ownership === 'company' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Select Company</p>
                        <button
                            type="button"
                            onClick={onAddCompany}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#c99b43] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b08838]"
                        >
                            <Plus className="h-3 w-3" /> New Company
                        </button>
                    </div>
                    {companiesLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading companies...
                        </div>
                    ) : managedCompanies.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            You are not a manager of any company yet. Create a company to start listing under a company workspace.
                        </p>
                    ) : (
                        <select
                            value={form.company ?? ''}
                            onChange={(e) =>
                                onChange('company', e.target.value ? parseInt(e.target.value) : null)
                            }
                            className={selectClass}
                        >
                            <option value="">— Select a company —</option>
                            {managedCompanies.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {errors.company && <p className={errorClass}>{errors.company}</p>}
                </div>
            )}
        </div>
    )
}

// ─── Step 3: Location ────────────────────────────────────────────────────────

function Step3({ form, onChange, errors }) {
    const [locationLoading, setLocationLoading] = useState(false)
    const [locationError, setLocationError] = useState('')

    const {
        regions,
        cities,
        selectedRegionId,
        selectedCityId,
        setRegionId,
        setCityId,
        loading: locLoading,
        error: locError,
    } = useLocationSelector({
        initialRegionId: form.region,
        initialCityId: form.city,
    })

    // Keep form state in sync with hook state
    const handleRegionChange = (e) => {
        const id = e.target.value ? Number(e.target.value) : null
        setRegionId(id)
        onChange('region', id)
        onChange('city', null)
    }

    const handleCityChange = (e) => {
        const id = e.target.value ? Number(e.target.value) : null
        setCityId(id)
        onChange('city', id)
    }

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser.')
            return
        }

        setLocationLoading(true)
        setLocationError('')

        navigator.geolocation.getCurrentPosition(
            (position) => {
                onChange('latitude', position.coords.latitude.toString())
                onChange('longitude', position.coords.longitude.toString())
                setLocationLoading(false)
            },
            () => {
                setLocationError(
                    'Unable to get your location. Please allow location permission and try again.'
                )
                setLocationLoading(false)
            }
        )
    }

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Location
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Help renters find your property accurately.
                </p>
            </div>

            {/* Address */}
            <FormField label="Address" required error={errors.address}>
                <Input
                    value={form.address}
                    onChange={(e) => onChange('address', e.target.value)}
                    placeholder="Street address or building name"
                    className={errors.address ? 'border-red-500' : ''}
                />
            </FormField>

            {/* Location error banner */}
            {locError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {locError}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Region */}
                <FormField label="Region" required error={errors.region}>
                    {locLoading ? (
                        <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading regions...
                        </div>
                    ) : (
                        <select
                            value={selectedRegionId ?? ''}
                            onChange={handleRegionChange}
                            className={`${selectClass} ${errors.region ? 'border-red-500' : ''}`}
                        >
                            <option value="">— Select a Region —</option>
                            {regions.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    )}
                </FormField>

                {/* City — disabled until region is chosen */}
                <FormField label="City" required error={errors.city}>
                    <select
                        value={selectedCityId ?? ''}
                        onChange={handleCityChange}
                        disabled={!selectedRegionId || locLoading}
                        className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-50 ${errors.city ? 'border-red-500' : ''}`}
                    >
                        <option value="">
                            {!selectedRegionId ? '— Select a Region first —' : '— Select a City —'}
                        </option>
                        {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {cities.length === 0 && selectedRegionId && !locLoading && (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            No cities found for this region. Please contact an administrator.
                        </p>
                    )}
                </FormField>

                {/* Kebele */}
                <FormField label="Kebele" error={errors.kebele}>
                    <Input
                        value={form.kebele}
                        onChange={(e) => onChange('kebele', e.target.value)}
                        placeholder="Enter kebele (optional)"
                        className={errors.kebele ? 'border-red-500' : ''}
                    />
                </FormField>
            </div>

            {/* GPS Coordinates */}
            <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        GPS Coordinates <span className="text-xs">(optional)</span>
                    </p>

                    <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={locationLoading}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#c99b43] px-3 py-2 text-xs font-semibold text-[#c99b43] transition hover:bg-[#c99b43]/10 disabled:opacity-60"
                    >
                        {locationLoading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Getting location...
                            </>
                        ) : (
                            <>
                                <MapPin className="h-3.5 w-3.5" />
                                Use My Location
                            </>
                        )}
                    </button>
                </div>

                {locationError && (
                    <p className={errorClass}>{locationError}</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Latitude">
                        <Input
                            type="number"
                            step="any"
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
                            value={form.longitude}
                            onChange={(e) =>
                                onChange('longitude', e.target.value)
                            }
                            placeholder="38.7636"
                        />
                    </FormField>
                </div>
            </div>
        </div>
    )
}
// ─── Step 4: Property Details ────────────────────────────────────────────────

function Step4({ form, onChange, errors }) {
    const isHouse = form.listing_type === 'house'

    if (isHouse) {
        return (
            <div className="space-y-5">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">House Details</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Provide specific details about the house or apartment.
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        type="number"
                        min="1"
                        step="1"
                        value={form.house_detail.bedrooms}
                        onChange={(e) => {
                            const value = e.target.value

                            if (value === '' || /^\d+$/.test(value)) {
                                onChange('house_detail', {
                                    ...form.house_detail,
                                    bedrooms: value,
                                })
                            }
                        }}
                        placeholder="3"
                        className={errors['house_detail.bedrooms'] ? 'border-red-500' : ''}
                    />
                    <Input
                        type="number"
                        min="1"
                        step="1"
                        value={form.house_detail.bathrooms}
                        onChange={(e) => {
                            const value = e.target.value

                            if (value === '' || /^\d+$/.test(value)) {
                                onChange('house_detail', {
                                    ...form.house_detail,
                                    bathrooms: value,
                                })
                            }
                        }}
                        placeholder="2"
                        className={errors['house_detail.bathrooms'] ? 'border-red-500' : ''}
                    />
                    <FormField label="Area (sqft)" required error={errors['house_detail.area_sqft']}>
                        <Input
                            type="number" min="0"
                            value={form.house_detail.area_sqft}
                            onChange={(e) => onChange('house_detail', { ...form.house_detail, area_sqft: e.target.value })}
                            placeholder="1200"
                            className={errors['house_detail.area_sqft'] ? 'border-red-500' : ''}
                        />
                    </FormField>
                    <FormField label="Furnishing" required>
                        <select
                            value={form.house_detail.furnishing}
                            onChange={(e) => onChange('house_detail', { ...form.house_detail, furnishing: e.target.value })}
                            className={selectClass}
                        >
                            <option value="furnished">Furnished</option>
                            <option value="semi_furnished">Semi-Furnished</option>
                            <option value="unfurnished">Unfurnished</option>
                        </select>
                    </FormField>
                    <FormField label="Room Number">
                        <Input
                            type="number" min="0"
                            value={form.house_detail.room_number}
                            onChange={(e) => onChange('house_detail', { ...form.house_detail, room_number: e.target.value })}
                            placeholder="e.g. 101"
                        />
                    </FormField>
                    <FormField label="Total Rooms">
                        <Input
                            type="number" min="0"
                            value={form.house_detail.total_rooms}
                            onChange={(e) => onChange('house_detail', { ...form.house_detail, total_rooms: e.target.value })}
                            placeholder="e.g. 5"
                        />
                    </FormField>
                    <FormField label="Distance from Main Road">
                        <Input
                            value={form.house_detail.distance_from_main_road}
                            onChange={(e) => onChange('house_detail', { ...form.house_detail, distance_from_main_road: e.target.value })}
                            placeholder="e.g. 500 m, 1.5 km"
                        />
                    </FormField>
                </div>
                <FormField label="Rules to Follow">
                    <textarea
                        rows={3}
                        value={form.house_detail.rules_to_follow}
                        onChange={(e) => onChange('house_detail', { ...form.house_detail, rules_to_follow: e.target.value })}
                        className={textareaClass}
                        placeholder="e.g. No smoking, family only, no pets..."
                    />
                </FormField>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Car Details</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Provide specific details about the vehicle.
                </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Brand" required error={errors['car_detail.brand']}>
                    <Input
                        value={form.car_detail.brand}
                        onChange={(e) => onChange('car_detail', { ...form.car_detail, brand: e.target.value })}
                        placeholder="Toyota"
                        className={errors['car_detail.brand'] ? 'border-red-500' : ''}
                    />
                </FormField>
                <FormField label="Model" required error={errors['car_detail.model']}>
                    <Input
                        value={form.car_detail.model}
                        onChange={(e) => onChange('car_detail', { ...form.car_detail, model: e.target.value })}
                        placeholder="Corolla"
                        className={errors['car_detail.model'] ? 'border-red-500' : ''}
                    />
                </FormField>
                <FormField label="Year" required error={errors['car_detail.year']}>
                    <Input
                        type="number" min="1900" max={new Date().getFullYear() + 1}
                        value={form.car_detail.year}
                        onChange={(e) => onChange('car_detail', { ...form.car_detail, year: e.target.value })}
                        placeholder="2020"
                        className={errors['car_detail.year'] ? 'border-red-500' : ''}
                    />
                </FormField>
                <FormField label="Seating Capacity" required error={errors['car_detail.seating_capacity']}>
                    <Input
                        type="number" min="1"
                        value={form.car_detail.seating_capacity}
                        onChange={(e) => onChange('car_detail', { ...form.car_detail, seating_capacity: e.target.value })}
                        placeholder="5"
                        className={errors['car_detail.seating_capacity'] ? 'border-red-500' : ''}
                    />
                </FormField>
                <FormField label="Mileage (km)">
                    <Input
                        type="number" min="0"
                        value={form.car_detail.mileage}
                        onChange={(e) => onChange('car_detail', { ...form.car_detail, mileage: e.target.value })}
                        placeholder="45000"
                    />
                </FormField>
                <FormField label="Fuel Type">
                    <select
                        value={form.car_detail.fuel_type}
                        onChange={(e) => onChange('car_detail', { ...form.car_detail, fuel_type: e.target.value })}
                        className={selectClass}
                    >
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </FormField>
            </div>
        </div>
    )
}

// ─── Step 5: Features & Images ───────────────────────────────────────────────

// ─── Step 5: Features & Images ───────────────────────────────────────────────

function Step5({ form, onChange, errors }) {
    const MIN_IMAGES = 3
    const MAX_IMAGES = 12
    const MAX_FILE_SIZE = 5 * 1024 * 1024

    const isHouse = form.listing_type === 'house'

    const imageSuggestions = isHouse
        ? [
            {
                Icon: House,
                title: 'Front View',
                description: 'Show the exterior of the property',
            },
            {
                Icon: Sofa,
                title: 'Living Room',
                description: 'Show the salon or main living area',
            },
            {
                Icon: BedDouble,
                title: 'Bedroom',
                description: 'Show at least one bedroom',
            },
            {
                Icon: Bath,
                title: 'Bathroom',
                description: 'Show a clean bathroom',
            },
        ]
        : [
            {
                Icon: CarFront,
                title: 'Front View',
                description: 'Show the front of the vehicle',
            },
            {
                Icon: Car,
                title: 'Side View',
                description: 'Show the full side of the vehicle',
            },
            {
                Icon: CarFront,
                title: 'Interior',
                description: 'Show seats and dashboard',
            },
            {
                Icon: ImagePlus,
                title: 'Additional View',
                description: 'Show important details or condition',
            },
        ]

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)

        if (!files.length) return

        const validTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ]

        const invalidFiles = files.filter(
            (file) => !validTypes.includes(file.type)
        )

        if (invalidFiles.length > 0) {
            onChange(
                '_imageError',
                'Only JPEG, PNG and WebP images are allowed.'
            )

            e.target.value = ''
            return
        }

        const oversizedFiles = files.filter(
            (file) => file.size > MAX_FILE_SIZE
        )

        if (oversizedFiles.length > 0) {
            onChange(
                '_imageError',
                'Each image must be smaller than 5 MB.'
            )

            e.target.value = ''
            return
        }

        // Prevent duplicate files
        const newFiles = files.filter(
            (newFile) =>
                !form.images.some(
                    (existingFile) =>
                        existingFile.name === newFile.name &&
                        existingFile.size === newFile.size
                )
        )

        const remainingSlots = MAX_IMAGES - form.images.length

        if (remainingSlots <= 0) {
            onChange(
                '_imageError',
                `You can upload a maximum of ${MAX_IMAGES} images.`
            )

            e.target.value = ''
            return
        }

        const filesToAdd = newFiles.slice(0, remainingSlots)

        onChange('images', [
            ...form.images,
            ...filesToAdd,
        ])

        onChange('_imageError', '')

        // Reset input so the same file can be selected again
        e.target.value = ''
    }

    const removeImage = (index) => {
        const updatedImages = form.images.filter(
            (_, i) => i !== index
        )

        onChange('images', updatedImages)

        if (updatedImages.length >= MIN_IMAGES) {
            onChange('_imageError', '')
        }
    }

    const uploadedCount = form.images.length
    const hasMinimumImages = uploadedCount >= MIN_IMAGES

    const progressPercentage = Math.min(
        (uploadedCount / MIN_IMAGES) * 100,
        100
    )

    return (
        <div className="space-y-7">

            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Features & Images
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Add amenities and clear photos to make your listing more attractive.
                </p>
            </div>

            {/* Features */}
            <div>
                <p className={labelClass}>
                    Features & Amenities
                </p>

                <FeatureMultiSelect
                    selectedFeatures={form.selectedFeatures}
                    onChange={(features) =>
                        onChange('selectedFeatures', features)
                    }
                />
            </div>

            {/* Image Section */}
            <div className="space-y-4">

                {/* Section header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                        <div className="flex items-center gap-2">

                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                Property Images
                            </p>

                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                Required
                            </span>

                        </div>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Upload at least {MIN_IMAGES} clear images.
                            Maximum {MAX_IMAGES} images.
                        </p>
                    </div>

                    {/* Upload status */}
                    <div
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${hasMinimumImages
                            ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                            }`}
                    >
                        {hasMinimumImages ? (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                {uploadedCount} images uploaded
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-4 w-4" />
                                {uploadedCount} / {MIN_IMAGES} minimum
                            </>
                        )}
                    </div>

                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">

                    <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Minimum photo requirement</span>

                        <span>
                            {uploadedCount} of {MIN_IMAGES}
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">

                        <div
                            className={`h-full rounded-full transition-all duration-500 ${hasMinimumImages
                                ? 'bg-green-500'
                                : 'bg-[#c99b43]'
                                }`}
                            style={{
                                width: `${progressPercentage}%`
                            }}
                        />

                    </div>

                </div>

                {/* Photo suggestions */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">

                    <div className="mb-3 flex items-center gap-2">

                        <ImagePlus className="h-4 w-4 text-[#c99b43]" />

                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                Recommended photos
                            </p>

                            <p className="text-xs text-slate-500">
                                Clear photos from these areas help renters understand your property.
                            </p>
                        </div>

                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">

                        {imageSuggestions.map(
                            ({ Icon, title, description }) => (

                                <div
                                    key={title}
                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                                >

                                    <div className="rounded-xl bg-[#c99b43]/10 p-2 text-[#c99b43]">

                                        <Icon className="h-4 w-4" />

                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            {title}
                                        </p>

                                        <p className="mt-0.5 text-[11px] text-slate-500">
                                            {description}
                                        </p>
                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </div>

                {/* Upload area */}
                {uploadedCount < MAX_IMAGES && (

                    <label
                        className={`
                            flex cursor-pointer flex-col items-center justify-center gap-3
                            rounded-2xl border-2 border-dashed p-8
                            transition-all duration-200
                            ${errors._imageError
                                ? 'border-red-400 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                                : 'border-slate-300 bg-slate-50 hover:border-[#c99b43] hover:bg-[#c99b43]/5 dark:border-slate-700 dark:bg-slate-900'
                            }
                        `}
                    >

                        <div className="rounded-2xl bg-[#c99b43]/10 p-4">

                            <Upload className="h-7 w-7 text-[#c99b43]" />

                        </div>

                        <div className="text-center">

                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Upload property photos
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Drag and drop is supported by your browser or click to browse
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                                JPEG, PNG or WebP · Maximum 5 MB per image
                            </p>

                        </div>

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="sr-only"
                            onChange={handleImageChange}
                        />

                    </label>

                )}

                {/* Error */}
                {(errors._imageError || form._imageError) && (

                    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">

                        <AlertCircle className="h-4 w-4 shrink-0" />

                        {errors._imageError || form._imageError}

                    </div>

                )}

                {/* Image previews */}
                {uploadedCount > 0 && (

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

                        {form.images.map((file, index) => (

                            <div
                                key={`${file.name}-${file.size}-${index}`}
                                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                            >

                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Property preview ${index + 1}`}
                                    className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                                />

                                {/* Image number */}
                                <div className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                                    {index + 1}
                                </div>

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md transition hover:scale-110 hover:bg-red-600"
                                    aria-label={`Remove image ${index + 1}`}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>

                                {/* Filename */}
                                <div className="truncate px-2 py-2 text-[10px] text-slate-500 dark:text-slate-400">
                                    {file.name}
                                </div>

                            </div>

                        ))}

                    </div>

                )}

                {/* Success message */}
                {hasMinimumImages && (

                    <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/20">

                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />

                        <div>

                            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                                Minimum photo requirement completed
                            </p>

                            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                                You can add more photos to make your listing more attractive.
                            </p>

                        </div>

                    </div>

                )}

            </div>

        </div>
    )
}
// ─── Validation ──────────────────────────────────────────────────────────────

function validateStep(step, form) {
    const errors = {}

    if (step === 1) {
        if (!form.property_name.trim()) {
            errors.property_name = 'Property name is required.'
        } else if (form.property_name.trim().length < 3) {
            errors.property_name = 'Must be at least 3 characters.'
        }

        if (!form.description.trim()) {
            errors.description = 'Description is required.'
        } else if (form.description.trim().length < 30) {
            errors.description = 'Description must be at least 30 characters.'
        }
    }
    if (step === 2) {
        if (!form.price || parseFloat(form.price) <= 0) errors.price = 'Enter a valid price greater than 0.'
        if (form.ownership === 'company' && !form.company) errors.company = 'Please select one of your managed companies.'
    }
    if (step === 3) {
        if (!form.address.trim()) {
            errors.address = 'Address is required.'
        }

        if (!form.city.trim()) {
            errors.city = 'City is required.'
        }

        if (!form.region.trim()) {
            errors.region = 'Region is required.'
        }

        if (!form.kebele.trim()) {
            errors.kebele = 'Kebele is required.'
        }
    }
    if (step === 4) {
        if (form.listing_type === 'house') {
            const bedrooms = Number(form.house_detail.bedrooms)
            const bathrooms = Number(form.house_detail.bathrooms)

            if (
                !form.house_detail.bedrooms ||
                !Number.isInteger(bedrooms) ||
                bedrooms <= 0
            ) {
                errors['house_detail.bedrooms'] =
                    'Bedrooms must be a positive whole number.'
            }

            if (
                !form.house_detail.bathrooms ||
                !Number.isInteger(bathrooms) ||
                bathrooms <= 0
            ) {
                errors['house_detail.bathrooms'] =
                    'Bathrooms must be a positive whole number.'
            }

            if (!form.house_detail.area_sqft) {
                errors['house_detail.area_sqft'] = 'Area is required.'
            }
        } else {
            if (!form.car_detail.brand.trim()) {
                errors['car_detail.brand'] = 'Brand is required.'
            }

            if (!form.car_detail.model.trim()) {
                errors['car_detail.model'] = 'Model is required.'
            }

            if (!form.car_detail.year) {
                errors['car_detail.year'] = 'Year is required.'
            }

            if (!form.car_detail.seating_capacity) {
                errors['car_detail.seating_capacity'] =
                    'Seating capacity is required.'
            }
        }
    }
    if (step === 5) {
        const MIN_IMAGES = 3

        if (!Array.isArray(form.images) || form.images.length < MIN_IMAGES) {
            errors._imageError =
                `Please upload at least ${MIN_IMAGES} clear images. ` +
                `You currently have ${form.images?.length || 0}.`
        }
    }
    return errors
}

// ─── Build FormData payload ──────────────────────────────────────────────────

function buildPayload(form) {
    const fd = new FormData()
    fd.append('property_name', form.property_name.trim())
    fd.append('description', form.description.trim())
    fd.append('listing_type', form.listing_type)
    fd.append('price', parseFloat(form.price).toFixed(2))
    fd.append('rental_unit', form.rental_unit)
    if (form.security_deposit) fd.append('security_deposit', parseFloat(form.security_deposit).toFixed(2))
    fd.append('is_available', form.is_available)
    fd.append('status', form.status)
    // ownership is frontend-only — never sent
    if (form.company) fd.append('company', form.company)
    if (form.address.trim()) fd.append('address', form.address.trim())
    fd.append('city', form.city.trim())
    fd.append('region', form.region.trim())
    if (form.kebele.trim()) fd.append('kebele', form.kebele.trim())
    if (form.latitude) fd.append('latitude', form.latitude)
    if (form.longitude) fd.append('longitude', form.longitude)

    if (form.listing_type === 'house') {
        const h = form.house_detail
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
        const c = form.car_detail
        const cd = {}
        if (c.brand) cd.brand = c.brand
        if (c.model) cd.model = c.model
        if (c.year) cd.year = parseInt(c.year)
        if (c.mileage) cd.mileage = parseInt(c.mileage)
        if (c.fuel_type) cd.fuel_type = c.fuel_type
        if (c.seating_capacity) cd.seating_capacity = parseInt(c.seating_capacity)
        fd.append('car_detail', JSON.stringify(cd))
    }

    fd.append('feature_ids', JSON.stringify(form.selectedFeatures.map((f) => f.id)))
    form.images.forEach((file) => fd.append('images', file))
    return fd
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AddProperty() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const formRef = useRef(null)
    const [currentStep, setCurrentStep] = useState(1)
    const [form, setForm] = useState(INITIAL_STATE)
    const [errors, setErrors] = useState({})
    const [generalError, setGeneralError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [companies, setCompanies] = useState([])
    const [companiesLoading, setCompaniesLoading] = useState(false)
    const [draftRecovery, setDraftRecovery] = useState(null)
    const [draftChecked, setDraftChecked] = useState(false)

    useEffect(() => {
        const draft = loadDraft()
        setDraftChecked(true)
        if (draft) {
            setDraftRecovery(draft)
        }
    }, [])

    useEffect(() => {
        if (!draftChecked || draftRecovery) return
        const timeout = setTimeout(() => {
            saveDraft(form, currentStep)
        }, 400)
        return () => clearTimeout(timeout)
    }, [form, currentStep, draftChecked, draftRecovery])

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
    }, [currentStep])

    const handleNext = () => {
        const stepErrors = validateStep(currentStep, form)
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors)
            return
        }
        setErrors({})
        setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
        window.scrollTo({ top: 0, behavior: 'smooth' })
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

    // Fetch companies when step 2 becomes active
    useEffect(() => {
        if (currentStep === 2) {
            setCompaniesLoading(true)
            getMyManagedCompanies()
                .then((data) => setCompanies(Array.isArray(data) ? data : data.results || []))
                .catch(() => setCompanies([]))
                .finally(() => setCompaniesLoading(false))
        }
    }, [currentStep])

    const onChange = useCallback((key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }, [])

    const handleContinueDraft = () => {
        if (!draftRecovery?.form) return

        const restored = {
            ...INITIAL_STATE,
            ...draftRecovery.form,
            house_detail: {
                ...INITIAL_STATE.house_detail,
                ...(draftRecovery.form.house_detail || {}),
            },
            car_detail: {
                ...INITIAL_STATE.car_detail,
                ...(draftRecovery.form.car_detail || {}),
            },
            selectedFeatures: draftRecovery.form.selectedFeatures || [],
            images: [],
            newImages: [],
        }

        setForm(restored)
        setCurrentStep(draftRecovery.currentStep || 1)
        setDraftRecovery(null)
        setErrors({})
        clearDraft()
    }

    const handleDiscardDraft = () => {
        clearDraft()
        setDraftRecovery(null)
        setForm(INITIAL_STATE)
        setCurrentStep(1)
        setErrors({})
    }

    const handleBack = () => {
        setErrors({})
        setCurrentStep((prev) => Math.max(prev - 1, 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async () => {
        const stepErrors = validateStep(5, form)

        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors)
            return
        }
        setLoading(true)
        setGeneralError(null)
        try {
            await createProperty(buildPayload(form))
            clearDraft()
            navigate('/owner/properties')
        } catch (err) {
            setGeneralError(err.message || 'Unable to create property. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const createdCompany = location.state?.createdCompany
        if (!createdCompany) return

        setCompanies((prev) => {
            const nextCompany = { ...createdCompany, manager_ids: createdCompany.manager_ids || [user?.id] }
            const existingIndex = prev.findIndex((company) => company.id === nextCompany.id)

            if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex] = nextCompany
                return updated
            }

            return [nextCompany, ...prev]
        })

        setForm((prev) => ({
            ...prev,
            ownership: 'company',
            company: createdCompany.id,
        }))

        navigate(location.pathname, {
            replace: true,
            state: {},
        })
    }, [location.state, navigate, user?.id])

    const handleCreateCompany = () => {
        navigate('/owner/companies/create', {
            state: {
                returnTo: location.pathname,
                source: 'property-create',
            },
        })
    }

    return (
        <div className='flex'>
            <div className="mx-auto sm:w-[70%] space-y-6">

                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#f8e6ba]/85 via-white/10 to-[#dfeaf7]/85 dark:from-[#201d17]/70 dark:via-slate-950/10 dark:to-[#0f172a]/70" aria-hidden="true" />
                    <img
                        src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80"
                        alt="Modern house"
                        className="absolute -right-10 top-4 h-32 w-32 rounded-[2rem] object-cover opacity-30 blur-[1px] grayscale-[0.1] sm:h-40 sm:w-40 dark:opacity-35"
                    />
                    <img
                        src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80"
                        alt="Luxury car"
                        className="absolute -left-10 bottom-4 h-28 w-28 rounded-[2rem] object-cover opacity-35 blur-[1px] grayscale-[0.1] sm:h-36 sm:w-36 dark:opacity-30"
                    />

                    <div className="relative flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/owner/properties')}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Add New Property</h1>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                Create a new listing step by step.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <StepProgress currentStep={currentStep} />

                    <div
                        ref={formRef}
                        onKeyDown={handleFormKeyDown}
                        className="mt-6"
                    >
                        {currentStep === 1 && (
                            <Step1 form={form} onChange={onChange} errors={errors} />
                        )}
                        {currentStep === 2 && (
                            <Step2
                                form={form}
                                onChange={onChange}
                                errors={errors}
                                companies={companies}
                                companiesLoading={companiesLoading}
                                onAddCompany={handleCreateCompany}
                                user={user}
                            />
                        )}
                        {currentStep === 3 && (
                            <Step3 form={form} onChange={onChange} errors={errors} />
                        )}
                        {currentStep === 4 && (
                            <Step4 form={form} onChange={onChange} errors={errors} />
                        )}
                        {currentStep === 5 && (
                            <Step5 form={form} onChange={onChange} errors={errors} />
                        )}
                    </div>

                    {generalError && (
                        <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            {generalError}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-8 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <ChevronLeft className="h-4 w-4" /> Back
                        </button>

                        {currentStep < STEPS.length ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838]"
                            >
                                Continue <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838] disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    'Create Listing'
                                )}
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
                            Ready to list
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="mb-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c99b43]">
                                Post in 5 steps
                            </p>
                            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                Make your property stand out
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {[
                                ['01', 'Add basic details', 'Name, type, and a clear description.'],
                                ['02', 'Set price & ownership', 'Choose rental terms and who is listing it.'],
                                ['03', 'Add location', 'Mention city, area, and nearby landmarks.'],
                                ['04', 'Fill property info', 'Share rooms, features, and property specs.'],
                                ['05', 'Upload photos', 'Add quality images and publish live.'],
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