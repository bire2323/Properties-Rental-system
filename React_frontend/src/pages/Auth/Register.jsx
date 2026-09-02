// src/pages/Auth/Register.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import { getSiteSettings, resolveSiteMediaUrl } from '../../api/siteSettingsApi'
import Navbar from '../../components/common/Navbar'
import GoogleLoginButton from '../../components/auth/GoogleLoginButton'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardRoute } from '../../services/authService'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

const accountTypes = [
  {
    value: 'tenant',
    label: 'Tenant',
    description: 'Explore and book properties.',
    icon: UserRound,
  },
  {
    value: 'owner',
    label: 'Owner',
    description: 'List and manage your properties.',
    icon: Building2,
  },
]

const inputClassName =
  'h-11 rounded-xl border border-slate-200/80 bg-white/80 pl-10 pr-4 text-sm shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition focus-visible:border-[#d4a756] focus-visible:ring-[#d4a756]/15 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-400'

const initialFormData = {
  accountType: 'tenant',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
}
function BrandSkeleton() {
  return (
    <>
      <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200/80 dark:bg-slate-800/80" />
      </div>
    </>
  )
}

function BrandFallback({ label = 'Home' }) {
  return (
    <>
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#c99b43]/25 bg-[#c99b43]/10 text-[#b98227] dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]">
        <Building2 size={26} />
      </span>
      <span className="max-w-[11rem] truncate text-lg font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d] sm:max-w-[14rem]">
        {label}
      </span>
    </>
  )
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
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = 'Enter a valid email address.'
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

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')


  const [siteSettings, setSiteSettings] = useState(null)
  const [siteSettingsStatus, setSiteSettingsStatus] = useState('loading')
  const [brandLogoFailed, setBrandLogoFailed] = useState(false)
  const siteName = siteSettings?.site_name?.trim() || ''
  const siteLogoUrl = resolveSiteMediaUrl(siteSettings?.logo)

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isActive = true

    setSiteSettingsStatus('loading')
    getSiteSettings()
      .then((data) => {
        if (!isActive) return
        setSiteSettings(data)
        setSiteSettingsStatus('success')
      })
      .catch(() => {
        if (!isActive) return
        setSiteSettingsStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [])
  // ─── Enter key navigation ──────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      const fieldOrder = ['accountType', 'firstName', 'lastName', 'email', 'password', 'confirmPassword']
      const currentField = e.target
      const currentName = currentField.name

      if (!fieldOrder.includes(currentName)) return

      const currentIndex = fieldOrder.indexOf(currentName)

      if (currentIndex === fieldOrder.length - 1) {
        // Last field → submit the form
        e.target.closest('form').requestSubmit()
      } else {
        const nextFieldName = fieldOrder[currentIndex + 1]
        const nextField = document.querySelector(`[name="${nextFieldName}"]`)
        if (nextField) {
          nextField.focus()
        }
      }
    }
  }

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

    setErrors((prev) => {
      const nextErrors = { ...prev }

      delete nextErrors.submit

      // Validate the field if it already had an error
      if (nextErrors[name]) {
        const validationErrors = validateForm(nextData)

        if (validationErrors[name]) {
          nextErrors[name] = validationErrors[name]
        } else {
          delete nextErrors[name]
        }

        // Password changes can affect confirm password validation
        if (name === 'password' && nextErrors.confirmPassword) {
          if (validationErrors.confirmPassword) {
            nextErrors.confirmPassword = validationErrors.confirmPassword
          } else {
            delete nextErrors.confirmPassword
          }
        }
      }

      return nextErrors
    })
  }
  const handleAccountTypeChange = (value) => {
    const nextData = { ...formData, accountType: value }
    setFormData(nextData)
    setSuccessMessage('')
    if (Object.keys(errors).length) {
      applyValidation(nextData)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSuccessMessage('')

    // Clear previous submit error
    setErrors({})

    const nextErrors = validateForm(formData)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        email: formData.email.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: formData.accountType,
      }

      const result = await register(payload)

      setSuccessMessage(
        result?.message || 'Account created successfully.'
      )

      navigate(getDashboardRoute(result?.user?.role))

    } catch (error) {
      console.error('Registration error:', error)

      setSuccessMessage('')

      /*
       * Backend may return:
       *
       * {
       *   email: ["A user with this email already exists."]
       * }
       *
       * or:
       *
       * {
       *   detail: "..."
       * }
       */

      const backendData = error?.data || error?.response?.data

      if (backendData?.email) {
        setErrors({
          email: Array.isArray(backendData.email)
            ? backendData.email[0]
            : backendData.email,
        })
      } else if (backendData?.first_name) {
        setErrors({
          firstName: Array.isArray(backendData.first_name)
            ? backendData.first_name[0]
            : backendData.first_name,
        })
      } else if (backendData?.last_name) {
        setErrors({
          lastName: Array.isArray(backendData.last_name)
            ? backendData.last_name[0]
            : backendData.last_name,
        })
      } else if (backendData?.password) {
        setErrors({
          password: Array.isArray(backendData.password)
            ? backendData.password[0]
            : backendData.password,
        })
      } else if (backendData?.detail) {
        setErrors({
          submit: backendData.detail,
        })
      } else {
        setErrors({
          submit:
            error?.message ||
            'Unable to create account right now. Please try again.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
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
                {/* <img src={logo} alt="NexaSpace logo" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b27a23]">Create account</p>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Premium access starts here</h2>
                </div> */}
                <button type="button" onClick={() => navigate('/')} className="flex shrink-0 items-center gap-3">
                  {siteSettingsStatus === 'loading' ? (
                    <BrandSkeleton />
                  ) : siteSettingsStatus === 'success' ? (
                    <>
                      {siteLogoUrl && !brandLogoFailed ? (
                        <img
                          src={siteLogoUrl}
                          alt={`${siteName || 'Website'} logo`}
                          className="h-14 w-auto max-w-[3.5rem] object-contain"
                          onError={() => setBrandLogoFailed(true)}
                        />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#c99b43]/25 bg-[#c99b43]/10 text-[#b98227] dark:border-[#c99b43]/35 dark:bg-white/5 dark:text-[#f3c96d]">
                          <Building2 size={26} />
                        </span>
                      )}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b27a23]">Create account</p>
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Premium access starts here</h2>
                      </div>
                    </>
                  ) : (
                    <BrandFallback label={siteName || 'Home'} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5 sm:px-8">
              <form
                className="space-y-4"
                onSubmit={handleSubmit}
                onKeyDown={handleKeyDown}
              >
                {/* Account Type */}
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Account Type</span>
                  <div className="group relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                    <select
                      name="accountType"
                      value={formData.accountType}
                      onChange={(e) => handleAccountTypeChange(e.target.value)}
                      className={inputClassName}
                    >
                      {accountTypes.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </label>

                {/* Required Fields */}
                <div className="grid gap-4">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">First Name</span>
                    <div className="group relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                      <Input
                        name="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        aria-invalid={Boolean(errors.firstName)}
                        className={inputClassName}
                      />
                    </div>
                    {errors.firstName && <p className="text-xs text-rose-500">{errors.firstName}</p>}
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Last Name</span>
                    <div className="group relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                      <Input
                        name="lastName"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        aria-invalid={Boolean(errors.lastName)}
                        className={inputClassName}
                      />
                    </div>
                    {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName}</p>}
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Email Address</span>
                    <div className="group relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                      <Input
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        aria-invalid={Boolean(errors.email)}
                        className={inputClassName}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-rose-500">{errors.email}</p>}
                  </label>
                </div>

                {/* Password */}
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Password</span>
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
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-500">{errors.password}</p>}
                </label>

                {/* Confirm Password */}
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Confirm Password</span>
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
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
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
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>
                <button className="w-full" disabled={isSubmitting}>
                  <GoogleLoginButton />
                </button>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,_#f4ce7c,_#c88a29)] text-sm font-semibold text-slate-950 shadow-[0_20px_40px_rgba(212,167,86,0.28)] hover:translate-y-[-1px] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </span>

                  {!isSubmitting && <ArrowRight size={14} />}
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