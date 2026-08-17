import { ImagePlus, UploadCloud, X } from 'lucide-react'

const inputClass = 'h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
const textareaClass = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export default function CompanyIdentityStep({ form, onChange, errors }) {
    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null
        onChange('logo', file)
        event.target.value = ''
    }

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Company identity</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set the company name and visual identity for your workspace.</p>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Company name <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={form.name || ''}
                        onChange={(e) => onChange('name', e.target.value)}
                        className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Example: Addis Realty Group"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                    <textarea
                        rows={4}
                        value={form.description || ''}
                        onChange={(e) => onChange('description', e.target.value)}
                        className={textareaClass}
                        placeholder="Briefly describe your company and the services you offer."
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Company logo</label>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-[#c99b43] dark:border-slate-700 dark:bg-slate-900">
                        {form.logoPreview ? (
                            <div className="flex items-center gap-4">
                                <img src={form.logoPreview} alt="company preview" className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{form.logo?.name || 'Current logo'}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PNG, JPG, or WEBP</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onChange('logo', null)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600 dark:border-slate-700 dark:bg-slate-950"
                                    aria-label="Remove company logo"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-600 transition hover:border-[#c99b43] hover:text-[#8a621f] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                                <UploadCloud className="h-6 w-6" />
                                <div>
                                    <div className="font-semibold">Upload company logo</div>
                                    <div className="mt-1 text-xs">Drag and drop or click to choose</div>
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
