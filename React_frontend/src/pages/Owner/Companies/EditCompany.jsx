import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Building2, Loader2, Save, UploadCloud } from 'lucide-react'
import { getCompany, updateCompany } from '../../../api/property/propertyApi'

const inputClass =
    'h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export default function EditCompany() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [form, setForm] = useState({
        name: '',
        description: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        address: '',
        city: '',
        region: '',
        logo: null,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let isMounted = true

        async function loadCompany() {
            try {
                const company = await getCompany(id)
                if (!isMounted) return
                setForm({
                    name: company.name || '',
                    description: company.description || '',
                    contact_email: company.contact_email || '',
                    contact_phone: company.contact_phone || '',
                    website: company.website || '',
                    address: company.address || '',
                    city: company.city || '',
                    region: company.region || '',
                    logo: null,
                })
            } catch (err) {
                if (isMounted) setError(err.message || 'Unable to load company.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadCompany()
        return () => {
            isMounted = false
        }
    }, [id])

    const onChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError('')

        try {
            const payload = new FormData()
            payload.append('name', form.name.trim())
            payload.append('description', form.description.trim())
            if (form.contact_email.trim()) payload.append('contact_email', form.contact_email.trim())
            if (form.contact_phone.trim()) payload.append('contact_phone', form.contact_phone.trim())
            if (form.website.trim()) payload.append('website', form.website.trim())
            if (form.address.trim()) payload.append('address', form.address.trim())
            if (form.city.trim()) payload.append('city', form.city.trim())
            if (form.region.trim()) payload.append('region', form.region.trim())
            if (form.logo) payload.append('logo', form.logo)

            await updateCompany(id, payload)
            navigate('/owner/properties')
        } catch (err) {
            setError(err.message || 'Unable to update company.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading company...
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 py-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6e6c1] text-[#8a621f] dark:bg-[#2a2115] dark:text-[#f0c969]">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Edit Company</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Update company details and branding.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Company name</label>
                        <input
                            value={form.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            className={inputClass}
                            placeholder="Example: Addis Realty Group"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => onChange('description', e.target.value)}
                            rows={4}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            placeholder="Briefly describe your company"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Contact email</label>
                        <input
                            type="email"
                            value={form.contact_email}
                            onChange={(e) => onChange('contact_email', e.target.value)}
                            className={inputClass}
                            placeholder="hello@company.com"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Contact phone</label>
                        <input
                            value={form.contact_phone}
                            onChange={(e) => onChange('contact_phone', e.target.value)}
                            className={inputClass}
                            placeholder="+251 9xx xxx xxx"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Website</label>
                        <input
                            type="url"
                            value={form.website}
                            onChange={(e) => onChange('website', e.target.value)}
                            className={inputClass}
                            placeholder="https://example.com"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Company logo</label>
                        <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-600 transition hover:border-[#c99b43] hover:text-[#8a621f] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            <UploadCloud className="h-4 w-4" />
                            <span>{form.logo ? form.logo.name : 'Replace logo'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => onChange('logo', e.target.files?.[0] || null)}
                            />
                        </label>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Address</label>
                        <input
                            value={form.address}
                            onChange={(e) => onChange('address', e.target.value)}
                            className={inputClass}
                            placeholder="Street or office address"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">City</label>
                        <input
                            value={form.city}
                            onChange={(e) => onChange('city', e.target.value)}
                            className={inputClass}
                            placeholder="Addis Ababa"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Region</label>
                        <input
                            value={form.region}
                            onChange={(e) => onChange('region', e.target.value)}
                            className={inputClass}
                            placeholder="Addis Ababa City Administration"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/owner/properties')}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#c99b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b08838] disabled:opacity-60"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> Update Company
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
