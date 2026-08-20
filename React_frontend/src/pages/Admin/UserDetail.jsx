import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, FileText, Loader2, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { getAdminUserDetail } from '../../api/admin/adminApi'

function UserDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isDark } = useTheme()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true)
            setError('')
            try {
                setUser(await getAdminUserDetail(id))
            } catch (requestError) {
                console.error('Failed to load user details:', requestError)
                setError(requestError.message || 'Failed to load user details.')
            } finally {
                setLoading(false)
            }
        }
        if (id) loadUser()
    }, [id])

    const profile = user?.profile || {}
    const ownerProfile = user?.owner_profile
    const documents = user?.verificationDocuments || []
    const joinedDate = user?.date_joined || user?.created_at

    return (
        <div className={`min-h-screen flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />
                <main className="mx-auto w-full px-4 py-6 sm:px-5 lg:px-8">
                    <button type="button" onClick={() => navigate('/admin-dashboard/users')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <ArrowLeft className="h-4 w-4" /> Back to Users
                    </button>

                    {loading ? (
                        <div className="flex items-center justify-center p-16 text-slate-500"><Loader2 className="h-7 w-7 animate-spin" /><span className="ml-3">Loading user details...</span></div>
                    ) : error ? (
                        <div className="rounded-2xl border border-dashed p-12 text-center text-slate-500">{error}</div>
                    ) : user ? (
                        <div className="space-y-6">
                            <section className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-2xl font-bold text-slate-500">
                                        {user.profileImage ? <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</h1>
                                        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                                    </div>
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{user.role}</span>
                                </div>
                            </section>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <section className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><UserRound className="h-5 w-5" /> Personal Information</h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Info label="First name" value={user.first_name} />
                                        <Info label="Last name" value={user.last_name} />
                                        <Info label="Email" value={user.email} icon={Mail} />
                                        <Info label="Phone" value={user.phone} icon={Phone} />
                                        <Info label="Date of birth" value={user.date_of_birth || profile.date_of_birth} icon={CalendarDays} />
                                        <Info label="Joined" value={joinedDate ? new Date(joinedDate).toLocaleDateString() : ''} icon={CalendarDays} />
                                    </div>
                                </section>

                                <section className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" /> Address</h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Info label="Address" value={user.address || profile.address} />
                                        <Info label="City" value={user.city || profile.city} />
                                        <Info label="Country" value={user.country || profile.country} />
                                        <Info label="Verified" value={user.is_verified ? 'Yes' : 'No'} icon={ShieldCheck} />
                                    </div>
                                </section>
                            </div>

                            {ownerProfile && (
                                <section className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5" /> Owner Verification</h2>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <Info label="Status" value={ownerProfile.verification_status} />
                                        <Info label="Can post property" value={ownerProfile.can_post_property ? 'Yes' : 'No'} />
                                        <Info label="Approved at" value={ownerProfile.approved_at ? new Date(ownerProfile.approved_at).toLocaleDateString() : ''} />
                                        <Info label="Rejection reason" value={ownerProfile.rejection_reason} />
                                    </div>
                                </section>
                            )}

                            {documents.length > 0 && (
                                <section className={`rounded-2xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                    <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5" /> Verification Documents</h2>
                                    <div className="grid gap-5 md:grid-cols-2">
                                        {documents.map((document) => (
                                            <article key={document.id} className={`overflow-hidden rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                                                <div className="flex h-56 items-center justify-center bg-slate-200 p-3 dark:bg-slate-700">
                                                    {document.image ? (
                                                        <img src={document.image} alt={document.type} className="h-full w-full rounded-lg object-contain" />
                                                    ) : (
                                                        <FileText className="h-10 w-10 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="space-y-3 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{document.type}</h3>
                                                            <p className="mt-1 text-xs text-slate-500">Document #{document.document_number || 'Not provided'}</p>
                                                        </div>
                                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${document.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {document.is_verified ? 'Verified' : 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        Uploaded {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Date unavailable'}
                                                    </p>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    )
}

function Info({ label, value, icon: Icon }) {
    return <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><div className="flex items-center gap-2 text-xs text-slate-500">{Icon && <Icon className="h-4 w-4" />}{label}</div><div className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">{value || 'Not provided'}</div></div>
}

export default UserDetail
