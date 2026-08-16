import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Check, ChevronRight, ChevronLeft, Building2, Car,
    Plus, X, Loader2, Home, CarFront
} from 'lucide-react'
import { createProperty, getCompanies, createCompany } from '../../api/property/propertyApi'
import FeatureMultiSelect from '../../components/property/FeatureMultiSelect'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useAuth } from '../../hooks/useAuth'

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
    ownership: 'individual', // frontend-only — never sent to API
    company: null,           // integer ID or null
    // Step 3
    address: '',
    city: '',
    region: '',
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

// ─── Company create modal ────────────────────────────────────────────────────

function CompanyCreateModal({ onClose, onCreated }) {
    const [form, setForm] = useState({
        name: '', description: '', contact_email: '', contact_phone: '',
        website: '', address: '', city: '', region: '',
    })
    const [logo, setLogo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) { setError('Company name is required.'); return }
        if (!form.city.trim()) { setError('City is required.'); return }
        if (!form.region.trim()) { setError('Region is required.'); return }
        setLoading(true)
        setError(null)
        try {
            const fd = new FormData()
            Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
            if (logo) fd.append('logo', logo)
            const company = await createCompany(fd)
            onCreated(company)
        } catch (err) {
            setError(err.message || 'Failed to create company.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Company</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {error && (
                    <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Company Name" required>
                            <Input
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Company Name"
                            />
                        </FormField>
                        <FormField label="City" required>
                            <Input
                                value={form.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                placeholder="City"
                            />
                        </FormField>
                        <FormField label="Region" required>
                            <Input
                                value={form.region}
                                onChange={(e) => handleChange('region', e.target.value)}
                                placeholder="Region"
                            />
                        </FormField>
                        <FormField label="Contact Email">
                            <Input
                                type="email"
                                value={form.contact_email}
                                onChange={(e) => handleChange('contact_email', e.target.value)}
                                placeholder="email@company.com"
                            />
                        </FormField>
                        <FormField label="Contact Phone">
                            <Input
                                value={form.contact_phone}
                                onChange={(e) => handleChange('contact_phone', e.target.value)}
                                placeholder="+251..."
                            />
                        </FormField>
                        <FormField label="Website">
                            <Input
                                value={form.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://..."
                            />
                        </FormField>
                    </div>
                    <FormField label="Address">
                        <Input
                            value={form.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            placeholder="Street address"
                        />
                    </FormField>
                    <FormField label="Description">
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className={textareaClass}
                            placeholder="Brief company description"
                        />
                    </FormField>
                    <FormField label="Logo">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setLogo(e.target.files[0] || null)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                    </FormField>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Creating...' : 'Create Company'}
                        </Button>
                    </div>
                </form>
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

            <FormField label="Description">
                <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    className={textareaClass}
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
                <p className={labelClass}>Ownership Type</p>
                <div className="flex gap-3">
                    {[
                        { value: 'individual', label: 'Individual' },
                        { value: 'company', label: 'Company' },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange('ownership', opt.value)
                                if (opt.value === 'individual') onChange('company', null)
                            }}
                            className={`flex-1 rounded-2xl border-2 py-3 text-sm font-semibold transition ${form.ownership === opt.value
                                ? 'border-[#c99b43] bg-[#c99b43]/5 text-[#c99b43]'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300'
                                }`}
                        >
                            {opt.label}
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
                            <Plus className="h-3 w-3" /> Add Company
                        </button>
                    </div>
                    {companiesLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading companies...
                        </div>
                    ) : managedCompanies.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            You are not a manager of any company yet. Create one using &ldquo;Add Company&rdquo; above.
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
    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Location</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Help renters find your property accurately.
                </p>
            </div>

            <FormField label="Address">
                <Input
                    value={form.address}
                    onChange={(e) => onChange('address', e.target.value)}
                    placeholder="Street address or building name"
                />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="City" required error={errors.city}>
                    <Input
                        value={form.city}
                        onChange={(e) => onChange('city', e.target.value)}
                        placeholder="e.g. Addis Ababa"
                        className={errors.city ? 'border-red-500' : ''}
                    />
                </FormField>
                <FormField label="Region" required error={errors.region}>
                    <Input
                        value={form.region}
                        onChange={(e) => onChange('region', e.target.value)}
                        placeholder="e.g. Addis Ababa City Administration"
                        className={errors.region ? 'border-red-500' : ''}
                    />
                </FormField>
                <FormField label="Kebele">
                    <Input
                        value={form.kebele}
                        onChange={(e) => onChange('kebele', e.target.value)}
                        placeholder="Kebele (optional)"
                    />
                </FormField>
            </div>

            <div>
                <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    GPS Coordinates <span className="text-xs">(optional)</span>
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Latitude">
                        <Input
                            type="number"
                            step="any"
                            value={form.latitude}
                            onChange={(e) => onChange('latitude', e.target.value)}
                            placeholder="9.0054"
                        />
                    </FormField>
                    <FormField label="Longitude">
                        <Input
                            type="number"
                            step="any"
                            value={form.longitude}
                            onChange={(e) => onChange('longitude', e.target.value)}
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
                    <FormField label="Bedrooms" required error={errors['house_detail.bedrooms']}>
                        <Input
                            type="number" min="0"
                            value={form.house_detail.bedrooms}
                            onChange={(e) => onChange('house_detail', { ...form.house_detail, bedrooms: e.target.value })}
                            placeholder="3"
                            className={errors['house_detail.bedrooms'] ? 'border-red-500' : ''}
                        />
                    </FormField>
                    <FormField label="Bathrooms" required error={errors['house_detail.bathrooms']}>
                        <Input
                            type="number" min="0"
                            value={form.house_detail.bathrooms}
                            onChange={(e) => onChange('house_detail', { ...form.house_detail, bathrooms: e.target.value })}
                            placeholder="2"
                            className={errors['house_detail.bathrooms'] ? 'border-red-500' : ''}
                        />
                    </FormField>
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

function Step5({ form, onChange, errors }) {
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        const invalid = files.filter((f) => !validTypes.includes(f.type))
        if (invalid.length) {
            onChange('_imageError', 'Only JPEG, PNG, WebP and GIF images are allowed.')
            return
        }
        const oversized = files.filter((f) => f.size > 5 * 1024 * 1024)
        if (oversized.length) {
            onChange('_imageError', 'Each image must be under 5 MB.')
            return
        }
        onChange('images', [...form.images, ...files])
        onChange('_imageError', '')
    }

    const removeImage = (idx) =>
        onChange('images', form.images.filter((_, i) => i !== idx))

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Features & Images</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Select amenities and upload photos for your listing.
                </p>
            </div>

            <div>
                <p className={labelClass}>Features & Amenities</p>
                <FeatureMultiSelect
                    selectedFeatures={form.selectedFeatures}
                    onChange={(features) => onChange('selectedFeatures', features)}
                />
            </div>

            <div>
                <p className={labelClass}>Property Images</p>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 transition hover:border-[#c99b43] dark:border-slate-700 dark:bg-slate-900">
                    <div className="rounded-xl bg-[#c99b43]/10 p-3">
                        <Plus className="h-6 w-6 text-[#c99b43]" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Click to upload images
                        </p>
                        <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP up to 5 MB each</p>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleImageChange}
                    />
                </label>
                {errors._imageError && <p className={errorClass}>{errors._imageError}</p>}

                {form.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {form.images.map((file, idx) => (
                            <div key={idx} className="group relative overflow-hidden rounded-2xl">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${idx + 1}`}
                                    className="h-28 w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute right-1.5 top-1.5 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
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
        if (!form.property_name.trim()) errors.property_name = 'Property name is required.'
        else if (form.property_name.trim().length < 3) errors.property_name = 'Must be at least 3 characters.'
    }
    if (step === 2) {
        if (!form.price || parseFloat(form.price) <= 0) errors.price = 'Enter a valid price greater than 0.'
        if (form.ownership === 'company' && !form.company) errors.company = 'Please select a company or create one.'
    }
    if (step === 3) {
        if (!form.city.trim()) errors.city = 'City is required.'
        if (!form.region.trim()) errors.region = 'Region is required.'
    }
    if (step === 4) {
        if (form.listing_type === 'house') {
            if (!form.house_detail.bedrooms) errors['house_detail.bedrooms'] = 'Bedrooms is required.'
            if (!form.house_detail.bathrooms) errors['house_detail.bathrooms'] = 'Bathrooms is required.'
            if (!form.house_detail.area_sqft) errors['house_detail.area_sqft'] = 'Area is required.'
        } else {
            if (!form.car_detail.brand.trim()) errors['car_detail.brand'] = 'Brand is required.'
            if (!form.car_detail.model.trim()) errors['car_detail.model'] = 'Model is required.'
            if (!form.car_detail.year) errors['car_detail.year'] = 'Year is required.'
            if (!form.car_detail.seating_capacity) errors['car_detail.seating_capacity'] = 'Seating capacity is required.'
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
    const { user } = useAuth()
    const formRef = useRef(null)
    const [currentStep, setCurrentStep] = useState(1)
    const [form, setForm] = useState(INITIAL_STATE)
    const [errors, setErrors] = useState({})
    const [generalError, setGeneralError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [companies, setCompanies] = useState([])
    const [companiesLoading, setCompaniesLoading] = useState(false)
    const [showCompanyModal, setShowCompanyModal] = useState(false)
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
        if (currentStep === 2 && companies.length === 0) {
            setCompaniesLoading(true)
            getCompanies()
                .then((data) => setCompanies(Array.isArray(data) ? data : data.results || []))
                .catch(() => { })
                .finally(() => setCompaniesLoading(false))
        }
    }, [currentStep, companies.length])

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

    const handleCompanyCreated = (company) => {
        // Backend creates the company and adds current user as manager.
        // We inject manager_ids locally so filtering works immediately.
        setCompanies((prev) => [...prev, { ...company, manager_ids: [user?.id] }])
        onChange('company', company.id)
        setShowCompanyModal(false)
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {showCompanyModal && (
                <CompanyCreateModal
                    onClose={() => setShowCompanyModal(false)}
                    onCreated={handleCompanyCreated}
                />
            )}

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
                            onAddCompany={() => setShowCompanyModal(true)}
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
    )
}