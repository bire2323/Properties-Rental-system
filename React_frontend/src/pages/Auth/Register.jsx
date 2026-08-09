import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  UserRound,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import Navbar from '../../components/common/Navbar'
import GoogleLoginButton from '../../components/auth/GoogleLoginButton'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardRoute } from '../../services/authService'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

const accountTypes = [
  {
    value: 'customer',
    label: 'Customer',
    description: 'Register to explore, shortlist, and book premium rentals.',
    icon: UserRound,
  },
  {
    value: 'seller',
    label: 'Seller',
    description: 'Create your owner profile and onboard verified listings.',
    icon: Building2,
  },
]

const inputClassName =
  'h-11 rounded-xl border border-slate-200/80 bg-white/80 pl-10 pr-4 text-sm shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition focus-visible:border-[#d4a756] focus-visible:ring-[#d4a756]/15 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-400'

const initialFormData = {
  accountType: 'customer',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  nationalId: null,
  propertyMap: null,
  password: '',
  confirmPassword: '',
}

function validateForm(formData) {
  const errors = {}

  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required.'
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required.'
  }

  if (!formData.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (!/^\d{9}$/.test(formData.phone.trim())) {
    errors.phone = 'Enter a valid 9-digit phone number.'
  }

  if (!formData.nationalId) {
    errors.nationalId = 'Please upload your national ID image.'
  }

  if (formData.accountType === 'seller' && !formData.propertyMap) {
    errors.propertyMap = 'Please upload your property map file.'
  }

  if (!formData.password) {
    errors.password = 'Password is required.'
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (formData.confirmPassword !== formData.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

function readImagePreview(file, callback) {
  if (!file || !file.type.startsWith('image/')) {
    callback('')
    return
  }

  const reader = new FileReader()
  reader.onload = () => callback(reader.result?.toString() ?? '')
  reader.readAsDataURL(file)
}

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [previews, setPreviews] = useState({
    nationalId: '',
    propertyMap: '',
  })
  const [draggingField, setDraggingField] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const textFields = [
    {
      name: 'firstName',
      label: 'First Name',
      placeholder: 'Enter your first name',
      icon: UserRound,
    },
    {
      name: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter your last name',
      icon: UserRound,
    },
    {
      name: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email address',
      icon: Mail,
      type: 'email',
    },
  ]

  const applyValidation = (nextData) => {
    const nextErrors = validateForm(nextData)
    setErrors(nextErrors)
    return nextErrors
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    const nextData = {
      ...formData,
      [name]: value,
    }

    setFormData(nextData)
    setSuccessMessage('')

    if (Object.keys(errors).length) {
      applyValidation(nextData)
    }
  }

  const handlePhoneChange = (event) => {
    let value = event.target.value
    // Remove all non-digit characters
    value = value.replace(/\D/g, '')
    // Limit to 9 digits
    value = value.slice(0, 9)

    const nextData = {
      ...formData,
      phone: value,
    }

    setFormData(nextData)
    setSuccessMessage('')

    if (Object.keys(errors).length) {
      applyValidation(nextData)
    }
  }

  const handleAccountTypeChange = (value) => {
    const nextData = {
      ...formData,
      accountType: value,
      propertyMap: value === 'customer' ? null : formData.propertyMap,
    }

    setFormData(nextData)
    setSuccessMessage('')

    if (value === 'customer') {
      setPreviews((currentPreviews) => ({
        ...currentPreviews,
        propertyMap: '',
      }))
    }

    if (Object.keys(errors).length) {
      applyValidation(nextData)
    }
  }

  const handleFileSelection = (fieldName, file) => {
    if (!file) {
      return
    }

    const nextData = {
      ...formData,
      [fieldName]: file,
    }

    setFormData(nextData)
    setSuccessMessage('')

    readImagePreview(file, (result) => {
      setPreviews((currentPreviews) => ({
        ...currentPreviews,
        [fieldName]: result,
      }))
    })

    if (Object.keys(errors).length) {
      applyValidation(nextData)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = applyValidation(formData)

    if (Object.keys(nextErrors).length) {
      setSuccessMessage('')
      return
    }

    try {
      const result = await register({
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: formData.accountType === 'seller' ? 'owner' : 'tenant',
      })

      setSuccessMessage(
        result?.message || 'Account created successfully.'
      )

      navigate(getDashboardRoute(result?.user?.role))
    } catch (error) {
      setSuccessMessage('')
      setErrors((currentErrors) => ({
        ...currentErrors,
        submit: error.message || 'Unable to create account right now.',
      }))
    }
  }

  const renderTextField = ({ name, label, placeholder, icon: Icon, type = 'text' }) => (
    <label key={name} className="space-y-1.5">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
        <Input
          name={name}
          type={type}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleInputChange}
          aria-invalid={Boolean(errors[name])}
          className={inputClassName}
        />
      </div>
      {errors[name] && <p className="text-xs text-rose-500">{errors[name]}</p>}
    </label>
  )

  const renderUploadField = ({
    fieldName,
    label,
    helperText,
    accept,
    icon: Icon,
  }) => {
    const file = formData[fieldName]
    const preview = previews[fieldName]
    const isImage = Boolean(file && preview)

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</span>
          {file && (
            <span className="rounded-full bg-[#d4a756]/12 px-2 py-0.5 text-[10px] font-medium text-[#9b6717] dark:bg-[#d4a756]/18 dark:text-[#f3c96d]">
              {file.name}
            </span>
          )}
        </div>

        <label
          htmlFor={fieldName}
          onDragOver={(event) => {
            event.preventDefault()
            setDraggingField(fieldName)
          }}
          onDragLeave={() => setDraggingField('')}
          onDrop={(event) => {
            event.preventDefault()
            setDraggingField('')
            handleFileSelection(fieldName, event.dataTransfer.files?.[0])
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 text-left transition ${draggingField === fieldName
            ? 'border-[#d4a756] bg-[#d4a756]/12 shadow-[0_16px_35px_rgba(212,167,86,0.18)]'
            : 'border-slate-300/80 bg-white/65 hover:border-[#d4a756]/65 hover:bg-[#d4a756]/6 dark:border-slate-700/70 dark:bg-slate-900/55 dark:hover:border-[#d4a756]/60'
            }`}
        >
          <input
            id={fieldName}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => handleFileSelection(fieldName, event.target.files?.[0])}
          />

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_rgba(212,167,86,0.2),_rgba(11,33,65,0.08))] text-[#b27a23] dark:bg-[linear-gradient(135deg,_rgba(212,167,86,0.22),_rgba(255,255,255,0.06))] dark:text-[#f3c96d]">
            <Icon className="size-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Drag and drop or browse
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
          </div>

          <span className="shrink-0 rounded-full border border-[#d4a756]/35 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[#9b6717] dark:text-[#f3c96d]">
            Upload
          </span>
        </label>

        {file && (
          <div className="rounded-xl border border-slate-200/80 bg-white/75 p-2 dark:border-slate-700/70 dark:bg-slate-900/60">
            {isImage ? (
              <div className="flex items-center gap-2">
                <img
                  src={preview}
                  alt={`${label} preview`}
                  className="h-10 w-12 rounded-lg object-cover"
                />
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Preview ready
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 dark:bg-slate-950/70">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b2141] text-white dark:bg-[#d4a756] dark:text-slate-950">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white">{file.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    File ready to submit
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {errors[fieldName] && <p className="text-xs text-rose-500">{errors[fieldName]}</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,_#fffaf3_0%,_#f5f9ff_38%,_#eef4fb_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,_rgba(212,167,86,0.12),_transparent_24%),linear-gradient(180deg,_#04111f_0%,_#071a32_42%,_#061427_100%)] dark:text-white">
      <div className="relative">
        <Navbar />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100vh-6rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg">
          <Card className="w-full max-h-[85vh] overflow-y-auto scrollbar-hide rounded-[2rem] border border-white/60 bg-white/78 p-0 shadow-[0_35px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-slate-800/70 dark:bg-slate-950/72" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="border-b border-slate-200/80 px-6 py-4 sm:px-8 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="NexaSpace logo"
                  className="h-10 w-10 rounded-xl object-cover shadow-lg"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b27a23]">
                    Create account
                  </p>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                    Premium access starts here
                  </h2>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5 sm:px-8">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Account Type
                  </span>
                  <div className="group relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                    <select
                      name="accountType"
                      value={formData.accountType}
                      onChange={(e) => handleAccountTypeChange(e.target.value)}
                      className={inputClassName}
                    >
                      {accountTypes.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <div className="grid gap-4">
                  {textFields.map(renderTextField)}
                </div>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Phone Number
                  </span>
                  <div className="group relative">
                    <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                    <div className="flex items-center">
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 select-none text-sm font-semibold text-white pointer-events-none z-10">
                        +251
                      </span>
                      <span className="absolute left-[60px] top-1/2 h-4 w-px -translate-y-1/2 bg-slate-300 dark:bg-slate-600"></span>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        aria-invalid={Boolean(errors.phone)}
                        className="h-11 rounded-xl border border-slate-200/80 bg-white/80 pl-[72px] pr-4 text-sm shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition focus-visible:border-[#d4a756] focus-visible:ring-[#d4a756]/15 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-white placeholder:text-transparent"
                        maxLength={9}
                        inputMode="numeric"
                        pattern="\d*"
                      />
                    </div>
                  </div>
                  {errors.phone && <p className="text-xs text-rose-500">{errors.phone}</p>}
                </label>

                {renderUploadField({
                  fieldName: 'nationalId',
                  label: 'National ID Image Upload',
                  helperText: 'JPG, PNG, or WEBP up to 10MB',
                  accept: 'image/*',
                  icon: ImagePlus,
                })}

                {formData.accountType === 'seller' &&
                  renderUploadField({
                    fieldName: 'propertyMap',
                    label: 'Property Map File Upload',
                    helperText: 'Upload an image or PDF of the property map',
                    accept: '.pdf,image/*',
                    icon: UploadCloud,
                  })}

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Password
                  </span>
                  <div className="group relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      aria-invalid={Boolean(errors.password)}
                      className={`${inputClassName} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((currentState) => !currentState)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-500">{errors.password}</p>}
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Confirm Password
                  </span>
                  <div className="group relative">
                    <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      className={`${inputClassName} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((currentState) => !currentState)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-500">{errors.confirmPassword}</p>
                  )}
                </label>

                {successMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {successMessage}
                  </div>
                )}

                {errors.submit && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                    {errors.submit}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <GoogleLoginButton />

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,_#f4ce7c,_#c88a29)] text-sm font-semibold text-slate-950 shadow-[0_20px_40px_rgba(212,167,86,0.28)] hover:translate-y-[-1px] hover:opacity-95"
                >
                  <span>Create Account</span>
                  <ArrowRight size={14} />
                </Button>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-semibold text-[#b27a23] transition hover:text-[#8c5c14] dark:text-[#f3c96d] dark:hover:text-[#f7db96]"
                  >
                    Login
                  </button>
                </p>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Register
