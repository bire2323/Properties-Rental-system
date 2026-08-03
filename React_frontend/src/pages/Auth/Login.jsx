import { useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react'
import logo from '../../assets/logo.jpg'
import Navbar from '../../components/common/Navbar'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
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
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50/90 pl-11 pr-4 shadow-sm focus-visible:border-[#d4a756] focus-visible:ring-[#d4a756]/20 dark:border-slate-800 dark:bg-slate-900/80"
                      />
                    </div>
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
                        className="h-13 rounded-2xl border-slate-200 bg-slate-50/90 pl-11 pr-12 shadow-sm focus-visible:border-[#d4a756] focus-visible:ring-[#d4a756]/20 dark:border-slate-800 dark:bg-slate-900/80"
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

                  <Button
                    type="submit"
                    size="lg"
                    className="h-13 w-full rounded-2xl bg-[linear-gradient(135deg,_#f3cd7a,_#c68c2b)] text-base font-semibold text-slate-950 shadow-[0_18px_35px_rgba(212,167,86,0.28)] hover:translate-y-[-1px] hover:opacity-95"
                  >
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </Button>

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

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-13 w-full rounded-2xl border-slate-200 bg-white/90 text-base text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        style={{ fill: '#4285F4' }}
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        style={{ fill: '#34A853' }}
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        style={{ fill: '#FBBC05' }}
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        style={{ fill: '#EA4335' }}
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </Button>

                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Don&apos;t have an account?{' '}
                    <a
                      href="#register"
                      className="font-medium text-[#b27a23] transition hover:text-[#8c5c14]"
                    >
                      Create account
                    </a>
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
