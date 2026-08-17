import { FileText, Trash2 } from 'lucide-react'

const DOCUMENT_LABELS = {
    business_license: 'Business License',
    trade_license: 'Trade License',
    tax_certificate: 'Tax Certificate',
    registration_certificate: 'Registration Certificate',
    national_id: 'National ID',
    other: 'Other',
}

export default function VerificationDocumentItem({ document, onRemove }) {
    const fileLabel = document.file?.name || document.fileName || 'Uploaded file'

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6e6c1] text-[#8a621f] dark:bg-[#2a2115] dark:text-[#f0c969]">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {DOCUMENT_LABELS[document.type] || 'Document'}
                        </p>
                        {document.number && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No.: {document.number}</p>
                        )}
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{fileLabel}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onRemove(document.id || document.tempId)}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-slate-950 dark:text-red-300"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                </button>
            </div>
        </div>
    )
}
