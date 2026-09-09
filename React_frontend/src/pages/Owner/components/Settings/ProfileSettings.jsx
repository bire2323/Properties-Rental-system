import { useRef, useState } from 'react'
import { useAuth } from '../../../../hooks/useAuth'
import { updateProfile } from '../../../../api/authApi'
import { getImageUrl } from '@/lib/utils'
import { AlertCircle, Camera, CheckCircle2, Lock, Save, Trash2, XCircle } from 'lucide-react'

const INPUT_OK = 'block w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-[#c99b43] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-[#c99b43] dark:focus:bg-slate-800 placeholder:text-slate-400'
const INPUT_ERR = 'block w-full rounded-lg border border-red-400 bg-red-50 px-2.5 py-1.5 text-xs text-slate-900 transition focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400/20 dark:border-red-600 dark:bg-slate-800/60 dark:text-white placeholder:text-slate-400'
const INPUT_LOCK = 'block w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 select-none'
const LABEL = 'mb-0.5 block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500'

function validatePhone(value) {
    if (!value) return null
    if (/^\+251[79]\d{8}$/.test(value) || /^0[79]\d{8}$/.test(value)) return null
    return 'Use +251 7X/9X... or 07.../09...'
}

function validateName(value, label) {
    if (!value.trim()) return `${label} is required`
    if (!/^[A-Za-z\u00C0-\u024F\s'-]+$/.test(value)) return `${label} must contain letters only`
    return null
}

function FieldError({ message }) {
    if (!message) return null
    return <p className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-red-500"><XCircle className="h-2.5 w-2.5" />{message}</p>
}

export default function ProfileSettings() {
    const { user, updateUser } = useAuth()
    const fileInputRef = useRef(null)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [selectedImage, setSelectedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [touched, setTouched] = useState({})
    const [form, setForm] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone_number: user?.phone_number || user?.profile?.phone_number || '',
        date_of_birth: user?.date_of_birth || user?.profile?.date_of_birth || '',
    })

    const errors = {
        first_name: validateName(form.first_name, 'First name'),
        last_name: validateName(form.last_name, 'Last name'),
        phone_number: validatePhone(form.phone_number),
    }
    const hasErrors = Object.values(errors).some(Boolean)
    const avatarSrc = imagePreview || (user?.profile_image ? getImageUrl(user.profile_image) : null)
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'U'
    const fieldError = (field) => touched[field] ? errors[field] : null

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setTouched((current) => ({ ...current, [name]: true }))
        setMessage({ type: '', text: '' })
    }

    const handleImageChange = (event) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setTouched({ first_name: true, last_name: true, phone_number: true })
        if (hasErrors) {
            setMessage({ type: 'error', text: 'Please fix the errors above.' })
            return
        }

        setIsLoading(true)
        setMessage({ type: '', text: '' })
        try {
            const payload = new FormData()
            payload.append('first_name', form.first_name)
            payload.append('last_name', form.last_name)
            payload.append('phone_number', form.phone_number)
            if (form.date_of_birth) payload.append('date_of_birth', form.date_of_birth)
            if (selectedImage) payload.append('profile_image', selectedImage)
            const result = await updateProfile(payload)
            updateUser(result.user)
            setMessage({ type: 'success', text: 'Profile updated.' })
            setTouched({})
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to update.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-white">Profile</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Personal details and photo</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-3 p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#c99b43]/30 ring-offset-1 ring-offset-white dark:ring-offset-slate-900">
                                {avatarSrc ? <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#c99b43] to-[#e2af5b] text-sm font-bold text-white">{initials}</div>}
                            </div>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#c99b43] text-white shadow hover:bg-[#b08838]" aria-label="Change profile photo"><Camera className="h-2 w-2" /></button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800 dark:text-white">{user?.first_name} {user?.last_name}</p>
                            <p className="text-[9px] text-slate-400">JPG or PNG, max 2 MB</p>
                            <div className="mt-1 flex gap-1.5">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-semibold text-slate-500 hover:border-[#c99b43] hover:text-[#c99b43] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">Change</button>
                                {avatarSrc && <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null) }} className="flex items-center gap-0.5 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-semibold text-red-500 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400"><Trash2 className="h-2 w-2" /> Remove</button>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div><label className={LABEL}>First name</label><input name="first_name" value={form.first_name} onChange={handleChange} onBlur={() => setTouched((current) => ({ ...current, first_name: true }))} className={fieldError('first_name') ? INPUT_ERR : INPUT_OK} /><FieldError message={fieldError('first_name')} /></div>
                        <div><label className={LABEL}>Last name</label><input name="last_name" value={form.last_name} onChange={handleChange} onBlur={() => setTouched((current) => ({ ...current, last_name: true }))} className={fieldError('last_name') ? INPUT_ERR : INPUT_OK} /><FieldError message={fieldError('last_name')} /></div>
                        <div className="col-span-2"><label className={LABEL}>Email <span className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[8px] text-slate-400 dark:bg-slate-800"><Lock className="h-2 w-2" /> Read-only</span></label><input type="email" value={user?.email || ''} disabled readOnly className={INPUT_LOCK} /></div>
                        <div><label className={LABEL}>Phone</label><input type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} onBlur={() => setTouched((current) => ({ ...current, phone_number: true }))} className={fieldError('phone_number') ? INPUT_ERR : INPUT_OK} /><FieldError message={fieldError('phone_number')} /></div>
                        <div><label className={LABEL}>Date of birth</label><input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className={INPUT_OK} /></div>
                    </div>

                    <div className="flex items-start gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 dark:bg-blue-900/20"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" /><p className="text-[9px] leading-relaxed text-blue-700 dark:text-blue-400">Use an Ethiopian phone format such as +251 9X XXXXXXXX or 09XXXXXXXX.</p></div>
                    {message.text && <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>{message.type === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{message.text}</div>}
                </div>
                <div className="flex justify-end border-t border-slate-100 px-4 py-2.5 dark:border-slate-800"><button type="submit" disabled={isLoading} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#c99b43] to-[#e2af5b] px-3.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"><Save className="h-2.5 w-2.5" />{isLoading ? 'Saving...' : 'Save'}</button></div>
            </form>
        </div>
    )
}
