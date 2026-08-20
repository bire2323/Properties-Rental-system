import { useEffect, useState } from 'react'
import { CheckCircle2, ImagePlus, Mail, MapPin, Phone, Save, ShieldCheck, UserRound } from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { getProfile, updateProfile } from '../../api/authApi'
import { getSiteSettings, resolveSiteMediaUrl } from '../../api/siteSettingsApi'
import { useTheme } from '../../hooks/useTheme'

export default function AdminProfile() {
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [profile, setProfile] = useState(null)
    const [siteSettings, setSiteSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [notice, setNotice] = useState(null)
    const [addressDraft, setAddressDraft] = useState('')
    const [imageDraft, setImageDraft] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)

    useEffect(() => {
        let active = true
        Promise.all([getProfile(), getSiteSettings()])
            .then(([payload, settings]) => {
                if (active) {
                    setProfile(payload.user || payload)
                    setSiteSettings(settings)
                    setAddressDraft(payload.user?.address || payload.address || payload.user?.profile?.address || payload.profile?.address || '')
                }
            })
            .catch((requestError) => {
                if (active) setError(requestError.message || 'Unable to load profile.')
            })
            .finally(() => {
                if (active) setLoading(false)
            })
        return () => {
            active = false
        }
    }, [])

    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Admin'
    const profileData = profile?.profile || {}
    const profileImage = imagePreview || resolveSiteMediaUrl(profile?.profile_image || profileData.profile_image)
    const phoneNumber = profile?.phone_number || profileData.phone_number
    const address = profile?.address || profileData.address
    const systemAddress = siteSettings?.address
    const surface = isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
    const muted = isDark ? 'text-slate-400' : 'text-slate-500'
    const heading = isDark ? 'text-white' : 'text-slate-900'

    const handleImageChange = (event) => {
        const file = event.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return
        setImageDraft(file)
        setImagePreview(URL.createObjectURL(file))
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        setNotice(null)
        try {
            const formData = new FormData()
            formData.append('address', addressDraft)
            if (imageDraft) formData.append('profile_image', imageDraft)
            const updated = await updateProfile(formData)
            setProfile(updated.user || updated)
            setImageDraft(null)
            setImagePreview(null)
            setNotice({ type: 'success', message: 'Profile updated successfully.' })
        } catch (saveError) {
            setNotice({ type: 'error', message: saveError.message || 'Unable to update profile.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className={`flex min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="min-w-0 flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />
                <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
                    <div className="mb-5 flex items-end justify-between gap-4"><div><p className={`text-xs font-medium ${muted}`}>Dashboard / Profile</p><h1 className={`mt-1 text-2xl font-bold tracking-tight ${heading}`}>My Profile</h1></div>{profile?.is_verified && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Verified account</span>}</div>
                    {loading && <div className={`rounded-lg border p-5 text-sm ${surface} ${muted}`}>Loading profile...</div>}
                    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div>}
                    {!loading && !error && profile && (
                        <div className="space-y-4">
                            <section className={`relative overflow-hidden rounded-xl border p-4 ${surface}`}>
                                <div className="absolute inset-x-0 top-0 h-1 bg-[#255070]" />
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    <label className={`group relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        {profileImage ? <img src={profileImage} alt={`${fullName} profile`} className="h-full w-full object-cover" /> : <UserRound className={`h-10 w-10 ${muted}`} />}
                                        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-white opacity-0 transition group-hover:opacity-100"><ImagePlus className="h-5 w-5" /></span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                    <div className="min-w-0 flex-1"><h2 className={`truncate text-xl font-bold ${heading}`}>{fullName}</h2><p className={`mt-1 truncate text-sm ${muted}`}>{profile.email || 'No email available'}</p><span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-[#255070]">{profile.role || 'Admin'}</span></div>
                                    <div className={`grid grid-cols-2 gap-5 border-t pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><div><p className={`text-[10px] uppercase tracking-wide ${muted}`}>Provider</p><p className={`mt-1 truncate text-xs font-semibold capitalize ${heading}`}>{profile.auth_provider || 'Not provided'}</p></div><div><p className={`text-[10px] uppercase tracking-wide ${muted}`}>Status</p><p className={`mt-1 text-xs font-semibold ${profile.is_verified ? 'text-emerald-600' : 'text-amber-600'}`}>{profile.is_verified ? 'Verified' : 'Pending'}</p></div></div>
                                </div>
                            </section>
                            <section className={`rounded-xl border p-4 ${surface}`}>
                                <div className="flex items-center justify-between gap-3"><div><h2 className={`text-base font-semibold ${heading}`}>Account Information</h2><p className={`mt-1 text-xs ${muted}`}>Update your personal address and profile image.</p></div><UserRound className={`h-5 w-5 ${isDark ? 'text-blue-300' : 'text-[#255070]'}`} /></div>
                                <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                                    {[
                                        ['Email Address', profile.email, Mail],
                                        ['Phone Number', phoneNumber, Phone],
                                        ['Personal Address', address, MapPin],
                                        ['System Address', systemAddress, MapPin],
                                    ].map(([label, value, Icon]) => <div key={label} className={`min-w-0 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${isDark ? 'text-blue-300' : 'text-[#255070]'}`} /><p className={`text-xs ${muted}`}>{label}</p></div><p className={`mt-1.5 truncate text-sm font-medium ${heading}`}>{value || 'Not provided'}</p></div>)}
                                </div>
                                <div className={`mt-5 border-t pt-5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                    <label className={`block text-xs font-medium ${muted}`}>Personal Address<textarea value={addressDraft} onChange={(event) => setAddressDraft(event.target.value)} rows={2} placeholder="Enter your personal address" className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder:text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400'}`} /></label>
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className={`text-xs ${muted}`}>{imageDraft ? imageDraft.name : 'Click the profile image to choose a new photo.'}</p><button type="button" onClick={handleSaveProfile} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#255070] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d405d] disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Profile'}</button></div>
                                    {notice && <p className={`mt-3 text-xs ${notice.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`} role="status">{notice.message}</p>}
                                </div>
                            </section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
