import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  MapPin,
  Calendar,
  Phone,
  User,
  Upload,
  Building2,
  Shield,
  Handshake,
  FileText,
  ImagePlus,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { useAuth } from '../../hooks/useAuth'
import { becomeOwner } from '../../api/roleChange/roleApi'
import systemlogo from '../../assets/logo.jpg'

// Document type options matching backend
const DOCUMENT_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'other', label: 'Other' },
]

export default function BecomeOwnerPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    // Step 1: Location
    city: '',
    country: '',
    address: '',
    // Step 2: Personal
    date_of_birth: '',
    phone_number: '',
    profile_image: null,
    // Step 3: Agreements
    agree_to_terms: false,
    agree_to_verification: false,

    document_type: 'national_id',
    document_number: '',
    document_image: null,
    document_front_image: null,
    document_back_image: null,
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState(null)

  const [documentFrontPreviewUrl, setDocumentFrontPreviewUrl] = useState(null)
  const [documentBackPreviewUrl, setDocumentBackPreviewUrl] = useState(null)

  // ─── Validation ──────────────────────────────────────────────────────

  const validateStep1 = () => {
    const newErrors = {}

    if (!formData.city.trim()) {
      newErrors.city = 'City is required.'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required.'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}

    // Date of birth is optional

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required.'
    } else if (
      !/^\+?[0-9]{7,15}$/.test(
        formData.phone_number.replace(/\s/g, '')
      )
    ) {
      newErrors.phone_number =
        'Enter a valid phone number (e.g., +251911234567).'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }
  const validateStep3 = () => {
    const newErrors = {}
    if (!formData.agree_to_terms) {
      newErrors.agree_to_terms = 'You must agree to the Terms & Conditions.'
    }
    if (!formData.agree_to_verification) {
      newErrors.agree_to_verification = 'You must agree to the verification process.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep4 = () => {
    const newErrors = {}

    if (formData.document_type === 'national_id') {
      if (!formData.document_front_image) {
        newErrors.document_front_image =
          'Please upload the front side of your National ID.'
      }

      if (!formData.document_back_image) {
        newErrors.document_back_image =
          'Please upload the back side of your National ID.'
      }
    } else {
      if (!formData.document_image) {
        newErrors.document_image =
          'Please upload your verification document.'
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    if (type === 'file') {
      const file = files[0]

      if (name === 'profile_image') {
        setFormData((prev) => ({
          ...prev,
          profile_image: file,
        }))

        if (file) {
          const reader = new FileReader()

          reader.onloadend = () => {
            setPreviewUrl(reader.result)
          }

          reader.readAsDataURL(file)
        } else {
          setPreviewUrl(null)
        }

        return
      }

      if (name === 'document_image') {
        setFormData((prev) => ({
          ...prev,
          document_image: file,
        }))

        if (file) {
          const reader = new FileReader()

          reader.onloadend = () => {
            setDocumentPreviewUrl(reader.result)
          }

          reader.readAsDataURL(file)
        } else {
          setDocumentPreviewUrl(null)
        }

        return
      }

      if (name === 'document_front_image') {
        setFormData((prev) => ({
          ...prev,
          document_front_image: file,
        }))

        if (file) {
          const reader = new FileReader()

          reader.onloadend = () => {
            setDocumentFrontPreviewUrl(reader.result)
          }

          reader.readAsDataURL(file)
        } else {
          setDocumentFrontPreviewUrl(null)
        }

        return
      }

      if (name === 'document_back_image') {
        setFormData((prev) => ({
          ...prev,
          document_back_image: file,
        }))

        if (file) {
          const reader = new FileReader()

          reader.onloadend = () => {
            setDocumentBackPreviewUrl(reader.result)
          }

          reader.readAsDataURL(file)
        } else {
          setDocumentBackPreviewUrl(null)
        }

        return
      }
    }

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }))

      return
    }

    if (name === 'document_type') {
      setFormData((prev) => ({
        ...prev,
        document_type: value,

        // Reset document files when document type changes
        document_image: null,
        document_front_image: null,
        document_back_image: null,
      }))

      setDocumentPreviewUrl(null)
      setDocumentFrontPreviewUrl(null)
      setDocumentBackPreviewUrl(null)

      setErrors((prev) => ({
        ...prev,
        document_image: '',
        document_front_image: '',
        document_back_image: '',
      }))

      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleKeyDown = (e, fields) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = e.target.closest('form')
      if (!form) return
      const focusable = form.querySelectorAll('input:not([type="file"]), button:not([disabled]), select')
      const currentIdx = Array.from(focusable).indexOf(e.target)
      if (currentIdx === focusable.length - 1) {
        if (step === 1) handleNext()
        else if (step === 2) handleNext()
        else if (step === 3) handleNext()
        else handleSubmit(e)
        return
      }
      const nextElement = focusable[currentIdx + 1]
      if (nextElement) {
        nextElement.focus()
        nextElement.select?.()
      }
    }
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
    else if (step === 3 && validateStep3()) setStep(4)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep4()) {
      const firstError = Object.keys(errors)[0]
      if (firstError) {
        const el = document.querySelector(`[name="${firstError}"]`)
        if (el) el.focus()
      }
      return
    }

    setIsSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('city', formData.city)
      payload.append('country', formData.country)
      payload.append('address', formData.address)
      if (formData.date_of_birth) {
        payload.append('date_of_birth', formData.date_of_birth)
      }
      payload.append('phone_number', formData.phone_number)

      if (formData.profile_image) {
        payload.append('profile_image', formData.profile_image)
      }

      if (formData.document_type === 'national_id') {
        if (formData.document_front_image) {
          payload.append('document_front_image', formData.document_front_image)
        }

        if (formData.document_back_image) {
          payload.append('document_back_image', formData.document_back_image)
        }

        if (formData.document_image) {
          payload.append('document_image', formData.document_image)
        }
      } else if (formData.document_image) {
        payload.append('document_image', formData.document_image)
      }

      payload.append('agree_to_terms', String(formData.agree_to_terms))
      payload.append('agree_to_verification', String(formData.agree_to_verification))
      payload.append('document_type', formData.document_type)
      if (formData.document_number.trim()) {
        payload.append('document_number', formData.document_number.trim())
      }

      const response = await becomeOwner(payload)

      if (updateUser) {
        updateUser({ ...user, role: 'owner', owner_profile: response.owner_profile })
      }

      navigate('/owner/properties/add')
    } catch (error) {
      const errorMsg = error.message || error.data?.error || 'Something went wrong. Please try again.'
      setErrors((prev) => ({ ...prev, general: errorMsg }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Animation ─────────────────────────────────────────────────────

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
    exit: (dir) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    }),
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="relative mx-auto mb-4 inline-block">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#c99b43]/20 to-[#f3c96d]/20 shadow-lg ring-4 ring-[#c99b43]/10 sm:h-24 sm:w-24">
              <img src={systemlogo} alt="NexaSpace Logo" className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#c99b43] to-[#f3c96d] shadow-lg sm:h-10 sm:w-10">
              <Handshake className="h-4 w-4 text-slate-950 sm:h-5 sm:w-5" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
            Become a Property Owner
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Unlock the ability to list properties and start earning.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex flex-1 items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= i ? 'bg-[#c99b43]' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Step {step} of 4
          </span>
        </div>

        {/* Card */}
        <Card className="mt-6 overflow-hidden border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="scroll-container max-h-[70vh] overflow-y-auto p-6 sm:p-8 lg:p-10">
            <AnimatePresence mode="wait" custom={step}>
              {/* STEP 1: Location */}
              {step === 1 && (
                <motion.div key="step1" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#c99b43]" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Where are your properties located?</h2>
                  </div>
                  <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => handleKeyDown(e, ['city', 'country', 'address'])}>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">City <span className="text-red-500">*</span></label>
                      <Input name="city" value={formData.city} onChange={handleChange} placeholder="e.g., Addis Ababa" className="h-12 w-full" required />
                      {errors.city && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Country <span className="text-red-500">*</span></label>
                      <Input name="country" value={formData.country} onChange={handleChange} placeholder="e.g., Ethiopia" className="h-12 w-full" required />
                      {errors.country && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.country}</p>}
                    </div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Address <span className="text-red-500">*</span>
                    </label>

                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g., 123 Bole Road"
                      className="h-12 w-full"
                      required
                    />

                    {errors.address && (
                      <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">
                        {errors.address}
                      </p>
                    )}
                    <div className="pt-4">
                      <Button type="button" onClick={handleNext} className="w-full bg-gradient-to-r from-[#c99b43] to-[#f3c96d] py-3 text-base font-semibold text-slate-950 hover:opacity-90">
                        Next Step <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: Personal Details */}
              {step === 2 && (
                <motion.div key="step2" custom={-1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#c99b43]" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Details</h2>
                  </div>
                  <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => handleKeyDown(e, ['date_of_birth', 'phone_number'])}>
                    {/* <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth <span className="text-red-500">*</span></label>
                      <Input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="h-12 w-full" required />
                      {errors.date_of_birth && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.date_of_birth}</p>}
                    </div> */}

                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Date of Birth{' '}
                      <span className="text-slate-400">(optional)</span>
                    </label>

                    <Input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="h-12 w-full"
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number <span className="text-red-500">*</span></label>
                      <Input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+251911234567" className="h-12 w-full" required />
                      {errors.phone_number && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.phone_number}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Profile Picture <span className="text-slate-400">(optional)</span></label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label htmlFor="profile_image" className="flex h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 text-sm transition hover:border-[#c99b43] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#c99b43] dark:hover:bg-slate-800">
                            <Upload className="mr-2 h-5 w-5 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">
                              {formData.profile_image ? formData.profile_image.name : 'Upload image'}
                            </span>
                            <input id="profile_image" type="file" name="profile_image" accept="image/*" onChange={handleChange} className="hidden" />
                          </label>
                        </div>
                        {previewUrl && (
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#c99b43]">
                            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                      {errors.profile_image && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.profile_image}</p>}
                    </div>
                    <div className="pt-4 flex gap-3">
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button type="button" onClick={handleNext} className="flex-1 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] py-3 text-base font-semibold text-slate-950 hover:opacity-90">
                        Next Step <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: Agreements */}
              {step === 3 && (
                <motion.div key="step3" custom={-1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#c99b43]" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Agreements</h2>
                  </div>
                  <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => handleKeyDown(e, ['agree_to_terms', 'agree_to_verification'])}>
                    <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                      <div>
                        <label className="flex items-start gap-3">
                          <input type="checkbox" name="agree_to_terms" checked={formData.agree_to_terms} onChange={handleChange} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#c99b43] focus:ring-[#c99b43]/20" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            I agree to the <button className="text-[#c99b43] hover:underline" type="button">Terms & Conditions</button> for property owners.
                          </span>
                        </label>
                        {errors.agree_to_terms && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.agree_to_terms}</p>}
                      </div>
                      <div>
                        <label className="flex items-start gap-3">
                          <input type="checkbox" name="agree_to_verification" checked={formData.agree_to_verification} onChange={handleChange} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#c99b43] focus:ring-[#c99b43]/20" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">I agree to provide verification documents if requested.</span>
                        </label>
                        {errors.agree_to_verification && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.agree_to_verification}</p>}
                      </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button type="button" onClick={handleNext} className="flex-1 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] py-3 text-base font-semibold text-slate-950 hover:opacity-90">
                        Next Step <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 4: Verification Document */}
              {step === 4 && (
                <motion.div key="step4" custom={-1} variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#c99b43]" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Verification Document</h2>
                  </div>
                  <form onSubmit={handleSubmit} onKeyDown={(e) => handleKeyDown(e, ['document_type', 'document_number', 'document_image'])}>
                    {/* Document Type */}

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Document Type <span className="text-red-500">*</span></label>
                      <select
                        name="document_type"
                        value={formData.document_type}
                        onChange={handleChange}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        required
                      >
                        {DOCUMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.document_type && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.document_type}</p>}
                    </div>

                    {/* Document Number - OPTIONAL */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Document Number <span className="text-slate-400">(optional)</span>
                      </label>
                      <Input
                        name="document_number"
                        value={formData.document_number}
                        onChange={handleChange}
                        placeholder="e.g., ID-12345678 (optional)"
                        className="h-12 w-full"
                      />
                      {errors.document_number && <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">{errors.document_number}</p>}
                    </div>

                    {/* Document Image Upload */}
                    {/* National ID requires Front and Back images */}
                    {formData.document_type === 'national_id' ? (
                      <div className="space-y-4">

                        {/* Front Side */}
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            National ID Front
                            <span className="ml-1 text-red-500">*</span>
                          </label>

                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label
                                htmlFor="document_front_image"
                                className="flex h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 text-sm transition hover:border-[#c99b43] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#c99b43] dark:hover:bg-slate-800"
                              >
                                <ImagePlus className="mr-2 h-5 w-5 text-slate-400" />

                                <span className="truncate text-slate-600 dark:text-slate-400">
                                  {formData.document_front_image
                                    ? formData.document_front_image.name
                                    : 'Upload front side'}
                                </span>

                                <input
                                  id="document_front_image"
                                  type="file"
                                  name="document_front_image"
                                  accept="image/*"
                                  onChange={handleChange}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {documentFrontPreviewUrl && (
                              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-[#c99b43]">
                                <img
                                  src={documentFrontPreviewUrl}
                                  alt="National ID front preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {errors.document_front_image && (
                            <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">
                              {errors.document_front_image}
                            </p>
                          )}
                        </div>

                        {/* Back Side */}
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            National ID Back
                            <span className="ml-1 text-red-500">*</span>
                          </label>

                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label
                                htmlFor="document_back_image"
                                className="flex h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 text-sm transition hover:border-[#c99b43] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#c99b43] dark:hover:bg-slate-800"
                              >
                                <ImagePlus className="mr-2 h-5 w-5 text-slate-400" />

                                <span className="truncate text-slate-600 dark:text-slate-400">
                                  {formData.document_back_image
                                    ? formData.document_back_image.name
                                    : 'Upload back side'}
                                </span>

                                <input
                                  id="document_back_image"
                                  type="file"
                                  name="document_back_image"
                                  accept="image/*"
                                  onChange={handleChange}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {documentBackPreviewUrl && (
                              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-[#c99b43]">
                                <img
                                  src={documentBackPreviewUrl}
                                  alt="National ID back preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {errors.document_back_image && (
                            <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">
                              {errors.document_back_image}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Other documents require one image */
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Document Image
                          <span className="ml-1 text-red-500">*</span>
                        </label>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label
                              htmlFor="document_image"
                              className="flex h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 text-sm transition hover:border-[#c99b43] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-[#c99b43] dark:hover:bg-slate-800"
                            >
                              <ImagePlus className="mr-2 h-5 w-5 text-slate-400" />

                              <span className="truncate text-slate-600 dark:text-slate-400">
                                {formData.document_image
                                  ? formData.document_image.name
                                  : 'Upload document image'}
                              </span>

                              <input
                                id="document_image"
                                type="file"
                                name="document_image"
                                accept="image/*"
                                onChange={handleChange}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {documentPreviewUrl && (
                            <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-[#c99b43]">
                              <img
                                src={documentPreviewUrl}
                                alt="Document preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        {errors.document_image && (
                          <p className="mt-1 text-[9px] text-red-500 dark:text-red-400">
                            {errors.document_image}
                          </p>
                        )}
                      </div>
                    )}

                    {errors.general && (
                      <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/30">
                        <p className="text-[9px] text-red-600 dark:text-red-400">{errors.general}</p>
                      </div>
                    )}

                    <div className="pt-4 flex flex-col gap-3 sm:flex-row-reverse sm:gap-4">
                      <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] py-3 text-base font-semibold text-slate-950 hover:opacity-90 disabled:opacity-70">
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                            Submitting...
                          </span>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Become Owner
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-slate-500 my-5 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          I'll complete this <span className="font-semibold text-yellow-400 cursor-pointer underline hover:text-yellow-600">later</span>.
        </button>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          All information is secure and will only be used for verification purposes.
        </p>
      </div>
    </div>
  )
}