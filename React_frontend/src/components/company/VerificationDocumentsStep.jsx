import { FilePlus2, UploadCloud, X } from 'lucide-react'
import VerificationDocumentItem from './VerificationDocumentItem'

const DOCUMENT_OPTIONS = [
    { value: 'business_license', label: 'Business License' },
    { value: 'trade_license', label: 'Trade License' },
    { value: 'tax_certificate', label: 'Tax Certificate' },
    { value: 'registration_certificate', label: 'Registration Certificate' },
    { value: 'national_id', label: 'National ID' },
    { value: 'other', label: 'Other' },
]

const inputClass = 'h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

export default function VerificationDocumentsStep({ documents, onAddDocument, onRemoveDocument, onUpdateDocument, error }) {
    const addEmptyDocument = () => {
        onAddDocument({
            tempId: Date.now() + Math.random(),
            type: 'business_license',
            number: '',
            file: null,
            fileName: '',
        })
    }

    const handleFileChange = (event, idx) => {
        const file = event.target.files?.[0] || null
        if (!file) return
        onUpdateDocument(idx, { file, fileName: file.name })
        event.target.value = ''
    }

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verification documents</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Upload supporting company verification documents for review. Uploading them does not automatically verify the company.
                </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="font-medium">Important</p>
                <p className="mt-1">New documents begin as pending and are reviewed by the system administrator. Company managers cannot approve them manually.</p>
            </div>

            <div className="space-y-4">
                {documents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        No verification documents added yet.
                    </div>
                ) : (
                    documents.map((doc, index) => (
                        <div key={doc.tempId || doc.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Document {index + 1}</p>
                                <button
                                    type="button"
                                    onClick={() => onRemoveDocument(doc.tempId || doc.id)}
                                    className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-300"
                                >
                                    <X className="h-3.5 w-3.5" /> Remove
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Document type</label>
                                    <select
                                        value={doc.type || 'business_license'}
                                        onChange={(e) => onUpdateDocument(index, { type: e.target.value })}
                                        className={inputClass}
                                    >
                                        {DOCUMENT_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Document number</label>
                                    <input
                                        value={doc.number || ''}
                                        onChange={(e) => onUpdateDocument(index, { number: e.target.value })}
                                        className={inputClass}
                                        placeholder="Optional reference number"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Document file</label>
                                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 transition hover:border-[#c99b43] hover:text-[#8a621f] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                    <UploadCloud className="h-5 w-5" />
                                    <span>{doc.file ? doc.file.name : doc.fileName || 'Choose file / upload PDF or image'}</span>
                                    <input type="file" className="hidden" onChange={(event) => handleFileChange(event, index)} />
                                </label>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                type="button"
                onClick={addEmptyDocument}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
                <FilePlus2 className="h-4 w-4" />
                Add another document
            </button>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    )
}
