const inputClass = 'h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

const normalizeUrl = (value) => {
    if (!value) return ''
    return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`
}

export default function CompanyContactStep({ form, onChange, errors }) {
    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contact information</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add the main contact details for your company workspace.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Contact email</label>
                    <input
                        type="email"
                        value={form.contact_email || ''}
                        onChange={(e) => onChange('contact_email', e.target.value)}
                        className={`${inputClass} ${errors.contact_email ? 'border-red-500' : ''}`}
                        placeholder="hello@company.com"
                    />
                    {errors.contact_email && <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Contact phone</label>
                    <input
                        value={form.contact_phone || ''}
                        onChange={(e) => onChange('contact_phone', e.target.value)}
                        className={inputClass}
                        placeholder="+251 9xx xxx xxx"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Website</label>
                    <input
                        type="url"
                        value={form.website || ''}
                        onBlur={(e) => {
                            const cleaned = normalizeUrl(e.target.value.trim())
                            if (cleaned) onChange('website', cleaned)
                        }}
                        onChange={(e) => onChange('website', e.target.value)}
                        className={`${inputClass} ${errors.website ? 'border-red-500' : ''}`}
                        placeholder="https://example.com"
                    />
                    {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website}</p>}
                </div>
            </div>
        </div>
    )
}
