import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { createCompany, createCompanyDocument } from '../../../api/property/propertyApi'
import CompanyProgress from '../../../components/company/CompanyProgress'
import CompanyFormNavigation from '../../../components/company/CompanyFormNavigation'
import CompanyIdentityStep from '../../../components/company/CompanyIdentityStep'
import CompanyContactStep from '../../../components/company/CompanyContactStep'
import CompanyLocationStep from '../../../components/company/CompanyLocationStep'
import VerificationDocumentsStep from '../../../components/company/VerificationDocumentsStep'
import CompanyReviewStep from '../../../components/company/CompanyReviewStep'

import Navbar from '../../../components/common/Navbar'

const TOTAL_STEPS = 5
const DRAFT_STORAGE_KEY = 'company_create_draft'

const EMPTY_DOCUMENT = {
    tempId: '',
    type: 'business_license',
    number: '',
    file: null,
    fileName: '',
}

const INITIAL_FORM = {
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    address: '',
    city: '',
    region: '',
    logo: null,
    logoPreview: '',
}

function validateEmail(value) {
    if (!value) return ''
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Please enter a valid email address.'
}

function validateWebsite(value) {
    if (!value) return ''
    try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`)
        return url.protocol === 'http:' || url.protocol === 'https:' ? '' : 'Please enter a valid website URL.'
    } catch {
        return 'Please enter a valid website URL.'
    }
}

function loadDraft() {
    if (typeof window === 'undefined') return null
    try {
        const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
        if (!raw) return null
        return JSON.parse(raw)
    } catch {
        return null
    }
}

function saveDraft({ form, currentStep, documents }) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ form, currentStep, documents }))
}

function clearDraft() {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
}

function validateStep(step, form) {
    const errors = {}

    if (step === 1 && !form.name?.trim()) {
        errors.name = 'Company name is required.'
    }

    if (step === 2) {
        const emailError = validateEmail(form.contact_email)
        const websiteError = validateWebsite(form.website)

        if (emailError) errors.contact_email = emailError
        if (websiteError) errors.website = websiteError
    }

    if (step === 3) {
        if (!form.city?.trim()) errors.city = 'City is required.'
        if (!form.region?.trim()) errors.region = 'Region is required.'
    }

    return errors
}

export default function CreateCompany() {
    const navigate = useNavigate()
    const location = useLocation()
    const [currentStep, setCurrentStep] = useState(1)
    const [form, setForm] = useState(INITIAL_FORM)
    const [documents, setDocuments] = useState([])
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [draftRestored, setDraftRestored] = useState(false)

    useEffect(() => {
        const savedDraft = loadDraft()
        if (savedDraft) {
            setForm({ ...INITIAL_FORM, ...(savedDraft.form || {}) })
            setDocuments(savedDraft.documents || [])
            setCurrentStep(savedDraft.currentStep || 1)
            setDraftRestored(true)
        }
    }, [])

    useEffect(() => {
        saveDraft({ form, currentStep, documents })
    }, [currentStep, form, documents])

    const stepContent = useMemo(() => {
        return [
            <CompanyIdentityStep key="identity" form={form} onChange={handleFieldChange} errors={errors} />,
            <CompanyContactStep key="contact" form={form} onChange={handleFieldChange} errors={errors} />,
            <CompanyLocationStep key="location" form={form} onChange={handleFieldChange} errors={errors} />,
            <VerificationDocumentsStep
                key="documents"
                documents={documents}
                onAddDocument={addDocument}
                onRemoveDocument={removeDocument}
                onUpdateDocument={updateDocument}
                error={error}
            />,
            <CompanyReviewStep key="review" form={form} documents={documents} />,
        ]
    }, [documents, error, errors, form])

    function handleFieldChange(field, value) {
        setForm((prev) => {
            if (field === 'logo' && value) {
                return { ...prev, logo: value, logoPreview: URL.createObjectURL(value) }
            }
            if (field === 'logo' && !value) {
                return { ...prev, logo: null, logoPreview: '' }
            }
            return { ...prev, [field]: value }
        })
        setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    function addDocument(newDoc = EMPTY_DOCUMENT) {
        setDocuments((prev) => [{ ...EMPTY_DOCUMENT, ...newDoc, tempId: newDoc.tempId || Date.now() + Math.random() }, ...prev])
    }

    function updateDocument(index, updates) {
        setDocuments((prev) => prev.map((doc, docIndex) => (docIndex === index ? { ...doc, ...updates } : doc)))
    }

    function removeDocument(tempId) {
        setDocuments((prev) => prev.filter((doc) => (doc.tempId || doc.id) !== tempId))
    }

    const handleNext = () => {
        const stepErrors = validateStep(currentStep, form)
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors)
            return
        }
        setErrors({})
        setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBack = () => {
        setErrors({})
        setCurrentStep((prev) => Math.max(prev - 1, 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async () => {
        const stepErrors = validateStep(currentStep, form)
        setErrors(stepErrors)
        if (Object.keys(stepErrors).length > 0) return

        setLoading(true)
        setError('')

        try {
            const companyPayload = new FormData()
            companyPayload.append('name', (form.name || '').trim())
            companyPayload.append('description', (form.description || '').trim())
            if (form.contact_email) companyPayload.append('contact_email', form.contact_email.trim())
            if (form.contact_phone) companyPayload.append('contact_phone', form.contact_phone.trim())
            if (form.website) companyPayload.append('website', form.website.trim())
            if (form.address) companyPayload.append('address', form.address.trim())
            if (form.city) companyPayload.append('city', form.city.trim())
            if (form.region) companyPayload.append('region', form.region.trim())
            if (form.logo) companyPayload.append('logo', form.logo)

            const created = await createCompany(companyPayload)
            const returnTo = location.state?.returnTo || '/owner/companies'
            const navigationState = {
                createdCompany: created,
                companyCreated: true,
            }

            if (documents.length > 0) {
                const failures = []
                for (const doc of documents) {
                    if (!doc.file) continue
                    const docPayload = new FormData()
                    docPayload.append('document_type', doc.type || 'business_license')
                    if (doc.number) docPayload.append('document_number', doc.number.trim())
                    docPayload.append('document_file', doc.file)

                    try {
                        await createCompanyDocument(created.id, docPayload)
                    } catch (uploadError) {
                        failures.push(`${doc.file.name}: ${uploadError.message || 'upload failed'}`)
                    }
                }

                if (failures.length > 0) {
                    navigationState.documentUploadWarning =
                        'Company created, but some verification documents could not be uploaded. You can retry them later.'
                    navigationState.failedDocuments = failures
                    setError(navigationState.documentUploadWarning)
                }
            }

            clearDraft()
            navigate(returnTo, {
                replace: true,
                state: navigationState,
            })
        } catch (err) {
            setError(err.message || 'Unable to create company.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <Navbar />
            <div className="mx-auto max-w-5xl space-y-6 py-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6e6c1] text-[#8a621f] dark:bg-[#2a2115] dark:text-[#f0c969]">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Create company workspace</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Set up a company profile and verification documents for managed listings.</p>
                        </div>
                    </div>
                </div>

                {draftRestored && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                        A previous company draft was restored and is ready to continue.
                    </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <CompanyProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

                    <div className="min-h-[360px]">{stepContent[currentStep - 1]}</div>

                    {error && (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <CompanyFormNavigation
                        currentStep={currentStep}
                        totalSteps={TOTAL_STEPS}
                        isSubmitting={loading}
                        onBack={handleBack}
                        onNext={handleNext}
                        onSubmit={handleSubmit}
                        canSubmit={true}
                    />
                </div>
            </div>
        </div>
    )
}
