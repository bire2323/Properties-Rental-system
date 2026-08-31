import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopbar from './components/AdminTopbar'
import { useTheme } from '../../hooks/useTheme'
import { getOwnerVerificationDetail, updateOwnerVerificationStatus } from '../../api/admin/adminApi'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui'

function formatDate(value) {
    if (!value) return 'N/A'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatStatus(status) {
    if (!status) return 'Pending'
    return status.charAt(0).toUpperCase() + status.slice(1)
}

function VerificationDetail() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [ownerData, setOwnerData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [saving, setSaving] = useState(false)
    const [selectedImageByDocument, setSelectedImageByDocument] = useState({})
    const navigate = useNavigate()
    const { id } = useParams()
    const { isDark } = useTheme()

    useEffect(() => {
        const loadDetail = async () => {
            setLoading(true)
            setError('')

            try {
                const data = await getOwnerVerificationDetail(id)
                setOwnerData(data)
            } catch (err) {
                setError(err.message || 'Unable to load verification details.')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            loadDetail()
        }
    }, [id])

    const documents = useMemo(() => ownerData?.verification_documents || [], [ownerData])
    const document = useMemo(() => documents[0] || null, [documents])

    const statusValue = ownerData?.owner_profile?.verification_status || 'pending'
    const profile = ownerData?.profile || {}
    const fullName = `${ownerData?.first_name || ''} ${ownerData?.last_name || ''}`.trim() || ownerData?.email || 'Owner'
    const profileImage = ownerData?.profile_image || ownerData?.profile?.profile_image || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
    const selectedDocument = document || null
    const selectedDocumentImages = selectedDocument?.previewImages?.length ? selectedDocument.previewImages : [selectedDocument?.document_image, selectedDocument?.document_front_image, selectedDocument?.document_back_image].filter(Boolean)
    const selectedImageIndex = selectedDocument ? (selectedImageByDocument[selectedDocument.id] ?? 0) : 0
    const currentDocumentImage = selectedDocumentImages[selectedImageIndex] || selectedDocumentImages[0] || null

    const handleDecision = async (status, reason = '') => {
        setSaving(true)
        setError('')
        try {
            await updateOwnerVerificationStatus(id, status, reason)
            setOwnerData((current) => ({
                ...current,
                owner_profile: {
                    ...current.owner_profile,
                    verification_status: status,
                    can_post_property: status === 'approved',
                    rejection_reason: reason,
                },
            }))
            setRejectionDialogOpen(false)
            setRejectionReason('')
        } catch (err) {
            setError(err.message || 'Unable to update verification status.')
        } finally {
            setSaving(false)
        }
    }

    const submitRejection = () => {
        const reason = rejectionReason.trim()
        if (!reason) {
            setError('Please enter a rejection reason.')
            return
        }
        handleDecision('rejected', reason)
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
                Loading verification details...
            </div>
        )
    }

    return (
        <div className={`min-h-screen flex lg:flex ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1">
                <AdminTopbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className={`mx-auto w-full px-4 py-6 sm:px-5 lg:px-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="mb-6 flex items-center gap-2 text-sm">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Dashboard</span>
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
                        <button
                            onClick={() => navigate('/admin-dashboard/verification')}
                            className={`transition ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                            Verification
                        </button>
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
                        <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>Details</span>
                    </div>

                    <div className="mb-6">
                        <button
                            onClick={() => navigate('/admin-dashboard/verification')}
                            className={`flex items-center gap-2 text-sm font-medium transition ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Verification
                        </button>
                    </div>

                    {error && (
                        <div className={`mb-6 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                            {error}
                        </div>
                    )}

                    {!ownerData ? null : (
                        <>
                            <div className={`mb-8 rounded-lg border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={profileImage}
                                            alt={fullName}
                                            className="h-20 w-20 rounded-full object-cover"
                                        />
                                        <div>
                                            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {fullName}
                                            </h1>
                                            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{ownerData.email}</p>
                                            <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                {profile.phone_number || 'No phone number'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusValue === 'approved' ? 'bg-emerald-100 text-emerald-700' : statusValue === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {formatStatus(statusValue)}
                                        </span>
                                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                            Submitted {formatDate(ownerData.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`mb-8 rounded-lg border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <h2 className={`mb-6 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Personal Information
                                </h2>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            First Name
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {ownerData.first_name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Last Name
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {ownerData.last_name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Email
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {ownerData.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Phone Number
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {profile.phone_number || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Date of Birth
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {formatDate(profile.date_of_birth)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`mb-8 rounded-lg border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <h2 className={`mb-6 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Address Information
                                </h2>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Country
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {profile.country || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            City
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {profile.city || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Address
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {profile.address || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`mb-8 rounded-lg border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                <h2 className={`mb-6 flex items-center gap-2 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <ShieldCheck className="h-5 w-5" />
                                    Identity Verification
                                </h2>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Document Type
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {selectedDocument?.document_type_display || selectedDocument?.document_type || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Document Number
                                        </label>
                                        <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {selectedDocument?.document_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {currentDocumentImage && (
                                    <div className="mt-6">
                                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800">
                                            <img
                                                src={currentDocumentImage}
                                                alt="Document preview"
                                                className="h-80 w-full rounded-lg object-contain"
                                            />
                                        </div>

                                        {selectedDocumentImages.length > 1 && (
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                {selectedDocumentImages.map((image, index) => (
                                                    <button
                                                        key={`${selectedDocument.id || 'doc'}-${index}`}
                                                        type="button"
                                                        onClick={() => setSelectedImageByDocument((prev) => ({ ...prev, [selectedDocument.id]: index }))}
                                                        className={`h-20 w-20 overflow-hidden rounded-lg border-2 bg-slate-100 p-1 transition ${selectedImageIndex === index ? 'border-[#c99b43]' : 'border-slate-200 dark:border-slate-700'}`}
                                                    >
                                                        <img src={image} alt={`Document thumb ${index + 1}`} className="h-full w-full rounded-md object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <a
                                            href={currentDocumentImage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${isDark ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            <Download className="h-4 w-4" />
                                            View Full Image
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setRejectionDialogOpen(true)}
                                    className={`rounded-lg px-6 py-3 text-sm font-medium transition ${isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Reject
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDecision('approved')}
                                    className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
                                >
                                    Approve
                                </button>
                            </div>

                            <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
                                <DialogContent className={isDark ? 'border-slate-700 bg-slate-900 text-white' : ''}>
                                    <DialogHeader>
                                        <DialogTitle className={isDark ? 'text-white' : ''}>Reject Verification</DialogTitle>
                                        <DialogDescription className={isDark ? 'text-slate-400' : ''}>
                                            Enter the reason that will be saved with this rejection.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(event) => setRejectionReason(event.target.value)}
                                        placeholder="Rejection reason"
                                        rows={4}
                                        autoFocus
                                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-slate-500' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-400'}`}
                                    />
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setRejectionDialogOpen(false)} disabled={saving}>
                                            Cancel
                                        </Button>
                                        <Button type="button" variant="destructive" onClick={submitRejection} disabled={saving}>
                                            {saving ? 'Saving...' : 'Reject User'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

export default VerificationDetail
