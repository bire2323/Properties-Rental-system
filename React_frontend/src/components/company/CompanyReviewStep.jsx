const DOCUMENT_LABELS = {
    business_license: 'Business License',
    trade_license: 'Trade License',
    tax_certificate: 'Tax Certificate',
    registration_certificate: 'Registration Certificate',
    national_id: 'National ID',
    other: 'Other',
}

export default function CompanyReviewStep({ form, documents }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Review and submit</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Confirm the company information and uploaded verification records before creating the workspace.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-4">
                    {form.logoPreview && (
                        <img src={form.logoPreview} alt="company preview" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                    )}
                    <div>
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">{form.name || 'Company name'}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{form.city || 'City'}, {form.region || 'Region'}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Company details</p>
                    <dl className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <div><dt className="font-medium text-slate-700 dark:text-slate-200">Name</dt><dd>{form.name || '—'}</dd></div>
                        <div><dt className="font-medium text-slate-700 dark:text-slate-200">Description</dt><dd>{form.description || '—'}</dd></div>
                        <div><dt className="font-medium text-slate-700 dark:text-slate-200">Email</dt><dd>{form.contact_email || '—'}</dd></div>
                        <div><dt className="font-medium text-slate-700 dark:text-slate-200">Phone</dt><dd>{form.contact_phone || '—'}</dd></div>
                        <div><dt className="font-medium text-slate-700 dark:text-slate-200">Website</dt><dd>{form.website || '—'}</dd></div>
                    </dl>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Location</p>
                    <dl className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <div><dt className="font-medium text-slate-700 dark:text-slate-200">Address</dt><dd>{form.address || '—'}</dd></div>
                        <div><dt className="font-medium text-slate-700 dark:text-slate-200">City</dt><dd>{form.city || '—'}</dd></div>
                        <div><dt className="font-medium text-slate-700 dark:text-slate-200">Region</dt><dd>{form.region || '—'}</dd></div>
                    </dl>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Verification documents</p>
                {documents.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No verification documents uploaded.</p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {documents.map((doc, index) => (
                            <div key={doc.tempId || doc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{index + 1}. {DOCUMENT_LABELS[doc.type] || 'Document'}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{doc.number ? `Reference: ${doc.number}` : 'No reference number provided'}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">File: {doc.file?.name || doc.fileName || 'Not selected'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
