import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, DollarSign, CircleDollarSign, Eye, Pencil, Trash2 } from 'lucide-react'
import { getImageUrl } from '../../../lib/utils'

export default function PropertyCard({ property, onDelete, isDraftMode = false }) {
    const navigate = useNavigate()
    console.log(property);
    const imageUrl = getImageUrl(property.main_image?.image || property.images?.[0]?.image) || ''
    const cardTitle = isDraftMode ? 'Draft property' : (property.property_name || 'Property')
    const badgeText = isDraftMode ? 'Draft' : property.status === 'active' ? 'Available' : 'Unavailable'
    const badgeClass = isDraftMode
        ? 'rounded-full bg-amber-100 px-1 md:px-3 py-1 text-[10px] md:text-[12px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
        : property.status === 'active'
            ? 'rounded-full bg-emerald-100 px-1 md:px-3 py-1 text-[10px] md:text-[12px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
            : 'rounded-full bg-slate-100 px-1 md:px-3 py-1 text-[10px] md:text-[10px] md:text-[12px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'

    const handleOpenDraft = () => {
        if (property.id) {
            navigate(`/owner/properties/${property.id}/edit`)
        }
    }

    return (
        <div
            className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${isDraftMode ? 'cursor-pointer' : ''}`}
            // onClick={handleOpenDraft}
            role={isDraftMode ? 'button' : undefined}
            tabIndex={isDraftMode ? 0 : undefined}
            onKeyDown={(event) => {
                if (isDraftMode && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault()
                    navigate('/owner/properties/draft/edit')
                }
            }}
        >
            <div className="h-36 lg:h-44 overflow-hidden bg-slate-100">
                <img
                    src={imageUrl}
                    alt={property.property_name}
                    onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = 'https://via.placeholder.com/600x400?text=No+Image'
                    }}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
            </div>
            <div className="space-y-2 md:space-y-4 p-3 md:p-5">
                <div className="flex items-center justify-between gap-1 md:gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[12px] uppercase tracking-[0.25em] dark:bg-slate-800">
                        <Building2 className="h-2 w-2 md:h-3 md:w-3" />
                        {property.listing_type}
                    </span>
                    <span className={badgeClass}>{badgeText}</span>
                </div>
                <div>
                    <h3 className="text-sm md:text-lg font-semibold text-slate-900 dark:text-white">{cardTitle}</h3>
                    <p className="mt-1 md:mt-2 text-[10px] md:text-[12px] leading-6 text-slate-500 dark:text-slate-400">{[property.city_name, property.region_name, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'}</p>
                </div>
                <div className="grid gap-0.5 md:gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <MapPin className="h-2 w-2 md:h-3 md:w-3" />
                        {[property.city_name, property.region_name, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300">
                        <DollarSign className="h-2 w-2 md:h-3 md:w-3" />
                        ETB {parseFloat(property.price || 0).toLocaleString()}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 pt-1 md:pt-2">
                    <button
                        type="button"
                        onClick={() => {
                            console.log("hihihih");
                            navigate(`/owner/properties/${property.id}`);
                        }}
                        className="rounded-2xl bg-slate-100 px-1 py-0.5 md:px-3 md:py-2 text-[11px] md:text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        <Eye className="h-2 w-2 md:h-4 md:w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/owner/properties/${property.id}/edit`)}
                        className="rounded-2xl border border-slate-200 px-1 py-0.5 md:px-3 md:py-2 text-[11px] md:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        <Pencil className="h-2 w-2 md:h-4 md:w-4" />
                    </button>

                    <button type="button"
                        onClick={async () => {
                            const ok = window.confirm(`Delete property \"${property.property_name}\"?`)
                            if (!ok) return
                            try {
                                await (typeof onDelete === 'function' ? onDelete(property.id) : Promise.resolve())
                            } catch (err) {
                                alert(err.message || 'Unable to delete')
                            }
                        }}
                        className="rounded-2xl border border-red-200 px-1 py-0.5 md:px-3 md:py-2 text-[11px] md:text-sm font-semibold text-red-600"
                    >
                        <Trash2 className="h-2 w-2 md:h-4 md:w-4" />
                    </button>



                </div>
            </div>
        </div>
    )
}
