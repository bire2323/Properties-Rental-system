import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { completePasswordReset, requestPasswordReset, verifyPasswordResetOtp } from '../../api/authApi'

const steps = ['Email', 'Verify', 'New password']

function ForgotPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [complete, setComplete] = useState(false)
    const [challengeId, setChallengeId] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const clearError = () => setError('')

    const handleSendOtp = async (event) => {
        event.preventDefault()
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Enter a valid email address to continue.')
            return
        }
        clearError()
        setSubmitting(true)
        try {
            const response = await requestPasswordReset(email.trim())
            setChallengeId(response.reset_challenge_id)
            setStep(1)
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleVerifyOtp = async (event) => {
        event.preventDefault()
        if (otp.length !== 6) {
            setError('Enter the 6-digit code sent to your email.')
            return
        }
        clearError()
        setSubmitting(true)
        try {
            await verifyPasswordResetOtp(challengeId, otp)
            setStep(2)
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleChangePassword = async (event) => {
        event.preventDefault()
        if (password.length < 8) {
            setError('Your new password must be at least 8 characters.')
            return
        }
        if (password !== confirmPassword) {
            setError('Your passwords do not match.')
            return
        }
        clearError()
        setSubmitting(true)
        try {
            await completePasswordReset(challengeId, password, confirmPassword)
            setComplete(true)
        } catch (requestError) {
            setError(requestError.message)
        } finally {
            setSubmitting(false)
        }
    }

    const goBack = () => {
        clearError()
        setStep((currentStep) => Math.max(0, currentStep - 1))
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f6f1] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,_rgba(212,167,86,0.22),_transparent_30%),radial-gradient(circle_at_90%_85%,_rgba(40,104,126,0.16),_transparent_32%)]" />
            <section className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_30px_100px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="mb-10 flex items-center justify-between gap-4">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#9b691b]"><ArrowLeft size={16} /> Back to sign in</Link>
                        <span className="text-sm font-medium text-slate-400">Step {complete ? 3 : step + 1} of 3</span>
                    </div>

                    <div className="mb-10 flex items-center gap-2 sm:gap-4">
                        {steps.map((label, index) => (
                            <div key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${index <= step || complete ? 'bg-[#0b2141] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {index < step || complete ? <Check size={15} /> : index + 1}
                                </div>
                                <span className={`hidden truncate text-xs font-semibold uppercase tracking-[0.12em] sm:block ${index <= step || complete ? 'text-[#0b2141]' : 'text-slate-400'}`}>{label}</span>
                                {index < steps.length - 1 && <div className={`h-px flex-1 ${index < step || complete ? 'bg-[#0b2141]' : 'bg-slate-200'}`} />}
                            </div>
                        ))}
                    </div>

                    {complete ? (
                        <div className="animate-in fade-in text-center duration-500">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check size={38} strokeWidth={2.5} /></div>
                            <h2 className="text-3xl font-semibold tracking-tight text-[#0b2141]">Password changed</h2>
                            <p className="mx-auto mt-4 max-w-sm leading-7 text-slate-500">Your password has been updated successfully. You can now sign in with your new password.</p>
                            <button type="button" onClick={() => navigate('/login')} className="mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#0b2141] px-7 font-semibold text-white shadow-lg shadow-[#0b2141]/20 transition hover:-translate-y-0.5 hover:bg-[#14345e]">Continue to sign in <ArrowRight size={17} /></button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#b27a23]">Reset your password</p>
                                <h2 className="text-3xl font-semibold tracking-tight text-[#0b2141] sm:text-4xl">{step === 0 ? 'Forgot your password?' : step === 1 ? 'Check your inbox' : 'Create a new password'}</h2>
                                <p className="mt-3 max-w-md leading-7 text-slate-500">{step === 0 ? 'Enter the email linked to your account and we will send you a verification code.' : step === 1 ? `We sent a 6-digit code to ${email}.` : 'Choose a strong password you have not used before.'}</p>
                            </div>

                            {step === 0 && <form className="space-y-6" onSubmit={handleSendOtp}>
                                <FieldLabel htmlFor="reset-email">Email address</FieldLabel>
                                <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="reset-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); clearError() }} placeholder="you@example.com" className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 outline-none transition focus:border-[#d4a756] focus:ring-4 focus:ring-[#d4a756]/15" /></div>
                                <ActionButton disabled={submitting}>{submitting ? 'Sending...' : 'Send OTP'} {!submitting && <ArrowRight size={17} />}</ActionButton>
                            </form>}

                            {step === 1 && <form className="space-y-6" onSubmit={handleVerifyOtp}>
                                <FieldLabel htmlFor="reset-otp">6-digit verification code</FieldLabel>
                                <input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '')); clearError() }} placeholder="000000" className="h-16 w-full rounded-2xl border border-slate-200 bg-slate-50 text-center text-2xl font-semibold tracking-[0.55em] outline-none transition focus:border-[#d4a756] focus:ring-4 focus:ring-[#d4a756]/15" />
                                <ActionButton disabled={submitting}>{submitting ? 'Verifying...' : 'Verify code'} {!submitting && <ArrowRight size={17} />}</ActionButton>
                                <button type="button" onClick={() => setStep(0)} className="block w-full text-center text-sm font-medium text-[#b27a23] hover:text-[#8c5c14]">Use a different email</button>
                            </form>}

                            {step === 2 && <form className="space-y-5" onSubmit={handleChangePassword}>
                                <PasswordField id="new-password" label="New password" value={password} onChange={(value) => { setPassword(value); clearError() }} show={showPassword} onToggle={() => setShowPassword((current) => !current)} />
                                <PasswordField id="confirm-password" label="Confirm new password" value={confirmPassword} onChange={(value) => { setConfirmPassword(value); clearError() }} show={showConfirmPassword} onToggle={() => setShowConfirmPassword((current) => !current)} />
                                <p className="text-xs text-slate-400">Use at least 8 characters for a stronger password.</p>
                                <ActionButton disabled={submitting}>{submitting ? 'Changing...' : 'Change password'} {!submitting && <ArrowRight size={17} />}</ActionButton>
                            </form>}
                            {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
                            {step > 0 && <button type="button" onClick={goBack} className="mt-6 text-sm font-medium text-slate-500 hover:text-slate-700">Back</button>}
                        </>
                    )}
                </div>
            </section>
        </main>
    )
}

function FieldLabel({ htmlFor, children }) {
    return <label htmlFor={htmlFor} className="mb-2.5 block text-sm font-semibold text-slate-700">{children}</label>
}

function PasswordField({ id, label, value, onChange, show, onToggle }) {
    return <div><FieldLabel htmlFor={id}>{label}</FieldLabel><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id={id} type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 outline-none transition focus:border-[#d4a756] focus:ring-4 focus:ring-[#d4a756]/15" /><button type="button" onClick={onToggle} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
}

function ActionButton({ children, disabled }) {
    return <button type="submit" disabled={disabled} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,_#0b2141,_#1b416d)] font-semibold text-white shadow-[0_16px_30px_rgba(11,33,65,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_35px_rgba(11,33,65,0.28)] disabled:cursor-not-allowed disabled:opacity-60">{children}</button>
}

export default ForgotPassword