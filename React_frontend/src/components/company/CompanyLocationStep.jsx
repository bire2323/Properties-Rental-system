const inputClass = 'h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export default function CompanyLocationStep({ form, onChange, errors }) {
    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Company location</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add the primary office or operating address for the company.</p>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Address</label>
                    <input
                        value={form.address || ''}
                        onChange={(e) => onChange('address', e.target.value)}
                        className={inputClass}
                        placeholder="Street address or office location"
                    />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            City <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={form.city || ''}
                            onChange={(e) => onChange('city', e.target.value)}
                            className={`${inputClass} ${errors.city ? 'border-red-500' : ''}`}
                            placeholder="Addis Ababa"
                        />
                        {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Region <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={form.region || ''}
                            onChange={(e) => onChange('region', e.target.value)}
                            className={`${inputClass} ${errors.region ? 'border-red-500' : ''}`}
                            placeholder="Addis Ababa City Administration"
                        />
                        {errors.region && <p className="mt-1 text-xs text-red-500">{errors.region}</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}
