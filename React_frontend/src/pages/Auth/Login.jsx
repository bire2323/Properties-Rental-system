import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import Navbar from '../../components/common/Navbar'
import GoogleLoginButton from '../../components/auth/GoogleLoginButton'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardRoute } from '../../services/authService'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

function Login() {
  const googleLoginEnabled = import.meta.env.VITE_GOOGLE_LOGIN_ENABLED === 'true'
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
    }

    const email = formData.email.trim()

    if (!email) {
      newErrors.email = 'Email address is required.'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address.'
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(newErrors)

    return !newErrors.email && !newErrors.password
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear the error while the user corrects the field
    if (name === 'email' || name === 'password') {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      const fieldOrder = ['email', 'password']
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

  const handleSubmit = async (event) => {
    event.preventDefault()

    setErrorMessage('')

    // Stop submission if client-side validation fails
    const isValid = validateForm()

    if (!isValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
      })

      navigate(getDashboardRoute(result?.user?.role))
    } catch (error) {
      setErrorMessage(error.message || 'Unable to sign in right now.')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffdf9_0%,_#f7fbff_100%)] text-slate-900 transition-colors dark:bg-[linear-gradient(180deg,_#05101f_0%,_#0a2140_22%,_#08172d_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-[#d4a756]/18 blur-3xl dark:bg-[#d4a756]/20" />
        <div className="absolute right-[-6rem] top-16 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/12" />
        <div className="absolute bottom-10 left-1/2 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-[#d4a756]/10 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="flex w-full items-center justify-center">
          <Card className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 py-0 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/88">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,_transparent,_#d4a756,_transparent)]" />

            <CardHeader className="space-y-5 border-b border-slate-200/80 px-8 py-8 dark:border-slate-800">
              <div className="flex items-center justify-center gap-3">
                <img
                  src={logo}
                  alt="NexaSpace logo"
                  className="h-14 w-auto rounded-2xl object-contain"
                />
                <span className="text-3xl font-semibold tracking-tight text-[#0b2141] dark:text-[#f3c96d]">
                  <span className="bg-[linear-gradient(135deg,_#0b2141,_#c99b43)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,_#f7db96,_#c99b43)]">
                    NexaSpace
                  </span>
                </span>
              </div>
              <div className="space-y-2 text-center">
                <CardTitle className="text-3xl font-semibold text-slate-950 dark:text-white">
                  Sign in to your account
                </CardTitle>
                <CardDescription className="text-base leading-7 text-slate-500 dark:text-slate-400">
                  Enter your email and password to continue.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8 py-8">

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Email address
                  </label>
                  <div className="group relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      aria-invalid={!!errors.email}
                      className={`h-13 rounded-2xl bg-slate-50/90 pl-11 pr-4 shadow-sm focus-visible:ring-[#d4a756]/20 dark:bg-slate-900/80 ${errors.email
                        ? 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/20'
                        : 'border-slate-200 focus-visible:border-[#d4a756] dark:border-slate-800'
                        }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-rose-600 dark:text-rose-400">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Password
                    </label>

                    <a
                      href="/"
                      className="text-sm font-medium text-[#b27a23] transition hover:text-[#8c5c14]"
                    >
                      Forgot password?
                    </a>
                  </div>

                  <div className="group relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#b27a23]" />

                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      aria-invalid={!!errors.password}
                      className={`h-13 rounded-2xl bg-slate-50/90 pl-11 pr-12 shadow-sm dark:bg-slate-900/80 ${errors.password
                          ? 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/20'
                          : 'border-slate-200 focus-visible:border-[#d4a756] focus-visible:ring-[#d4a756]/20 dark:border-slate-800'
                        }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="text-sm text-rose-600 dark:text-rose-400">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <input
                      name="remember"
                      type="checkbox"
                      checked={formData.remember}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-[#b27a23] focus:ring-[#d4a756]"
                    />
                    <span>Remember me</span>
                  </label>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    Protected login
                  </span>
                </div>

                {errorMessage && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-13 w-full rounded-2xl bg-[linear-gradient(135deg,_#f3cd7a,_#c68c2b)] text-base font-semibold text-slate-950 shadow-[0_18px_35px_rgba(212,167,86,0.28)] hover:translate-y-[-1px] hover:opacity-95"
                >
                  <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight size={16} />
                </Button>

                {googleLoginEnabled && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-xs uppercase tracking-[0.3em] text-slate-400 dark:bg-slate-950">
                          or continue with
                        </span>
                      </div>
                    </div>

                    <GoogleLoginButton />
                  </>
                )}

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="font-medium text-[#b27a23] transition hover:text-[#8c5c14]"
                  >
                    Create account
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

export default Login
