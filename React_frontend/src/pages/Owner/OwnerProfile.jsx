import { CalendarDays, CheckCircle2, FileText, Mail, MapPin, Phone, ShieldCheck, UserRound, XCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getImageUrl } from '../../lib/utils'

const statusStyles = {
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

function DocumentCard({ document }) {
    const images = [
        { label: 'Front side', value: document.document_front_image || document.document_image },
        { label: 'Back side', value: document.document_back_image },
    ]

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#c99b43]" />
                        <h3 className="font-bold capitalize text-slate-900 dark:text-white">{document.document_type_display || document.document_type || 'Identity document'}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">ID number: <span className="font-semibold text-slate-700 dark:text-slate-300">{document.document_number || 'Not provided'}</span></p>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${document.is_verified ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                    {document.is_verified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {document.is_verified ? 'Verified' : 'Under review'}
                </span>
            </div>
            {images.length ? (
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                    {images.map((image) => (
                        <div key={image.label} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
                            {image.value ? (
                                <img src={getImageUrl(image.value)} alt={image.label} className="h-36 w-full object-cover" />
                            ) : (
                                <div className="flex h-36 items-center justify-center text-xs text-slate-400">Not uploaded</div>
                            )}
                            <p className="px-3 py-2 text-xs font-semibold text-slate-500">{image.label}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="p-4 text-sm text-slate-500">No document images uploaded.</p>
            )}
        </div>
    )
}

export default function OwnerProfile() {
    const { user } = useAuth()
    const profile = user?.profile || {}
    const ownerProfile = user?.owner_profile || {}
    const documents = ownerProfile.verification_documents || []
    const status = ownerProfile.verification_status || 'pending'
    const profileImage = getImageUrl(user?.profile_image || profile.profile_image)
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'O'
    const address = [profile.address || user?.address, profile.city || user?.city, profile.country || user?.country].filter(Boolean).join(', ')
    const identityNumber = documents[0]?.document_number || user?.national_id_number || profile.national_id_number

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#102b40] via-[#255070] to-[#c99b43] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
                <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white/50 bg-white/15 text-3xl font-bold shadow-xl">
                        {profileImage ? <img src={profileImage} alt={`${user?.first_name || 'Owner'} profile`} className="h-full w-full object-cover" /> : initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/65">Owner account</p>
                        <h1 className="mt-2 truncate text-3xl font-bold sm:text-4xl">{user?.first_name} {user?.last_name}</h1>
                        <p className="mt-2 flex items-center gap-2 text-sm text-white/75"><Mail className="h-4 w-4" />{user?.email || 'Email not provided'}</p>
                        <span className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusStyles[status] || statusStyles.pending}`}>
                            {status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                            {status} owner
                        </span>
                    </div>
                </div>
            </section>

            <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                    <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Personal information</h2><p className="mt-1 text-sm text-slate-500">Information submitted during registration.</p></div>
                    <UserRound className="h-6 w-6 text-[#c99b43]" />
                </div>
                <div className="grid gap-x-8 sm:grid-cols-2">
                    {[
                        ['First name', user?.first_name, UserRound],
                        ['Last name', user?.last_name, UserRound],
                        ['Email', user?.email, Mail],
                        ['Phone', profile.phone_number || user?.phone_number, Phone],
                        ['Date of birth', profile.date_of_birth || user?.date_of_birth, CalendarDays],
                        ['Address', address, MapPin],
                        ['City', profile.city || user?.city, MapPin],
                        ['Country', profile.country || user?.country, MapPin],
                        ['National ID number', identityNumber, FileText],
                    ].map(([label, value, Icon]) => (
                        <div key={label} className="flex min-w-0 items-start gap-3 border-b border-slate-200/80 py-3 dark:border-slate-800">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#c99b43]" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-white">{value || 'Not provided'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                    <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Identity documents</h2><p className="mt-1 text-sm text-slate-500">Submitted verification documents and uploaded images.</p></div>
                    <FileText className="h-6 w-6 text-[#c99b43]" />
                </div>
                {documents.length ? <div className="space-y-4">{documents.map((document) => <DocumentCard key={document.id} document={document} />)}</div> : (
                    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900"><XCircle className="h-5 w-5 text-slate-400" /> No verification documents found.</div>
                )}
            </section>
        </div>
    )
}
