import { useNavigate } from 'react-router-dom'
import { Building2, Car, MapPin, DollarSign, Eye, Pencil, Trash2 } from 'lucide-react'
import { getImageUrl } from '../../../lib/utils'

export default function PropertyCard({ property, onDelete, isDraftMode = false }) {
    const navigate = useNavigate()

    const imageUrl = getImageUrl(property.main_image?.image || property.images?.[0]?.image) || ''
    const cardTitle = isDraftMode ? 'Draft property' : (property.property_name || 'Property')
    const location = [property.city_name, property.region_name, property.kebele].filter(Boolean).join(', ') || 'Location unspecified'
    const price = parseFloat(property.price || 0).toLocaleString()

    const isActive = property.status === 'active'
    const isRented = property.status === 'rented'
    const badgeText = isDraftMode ? 'Draft' : isActive ? 'Available' : isRented ? 'Rented' : 'Unavailable'

    const badgeClass = isDraftMode
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
        : isRented
            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
            : isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'

    const isVehicle = property.listing_type?.toLowerCase() === 'car' ||
                      property.listing_type?.toLowerCase() === 'vehicle'

    const ListingIcon = isVehicle ? Car : Building2

    return (
        <div
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-slate-700 ${isDraftMode ? 'cursor-pointer' : ''}`}
            role={isDraftMode ? 'button' : undefined}
            tabIndex={isDraftMode ? 0 : undefined}
            onKeyDown={(e) => {
                if (isDraftMode && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    navigate('/owner/properties/draft/edit')
                }
            }}
        >
            {/* Image */}
            <div className="relative h-40 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src={imageUrl}
                    alt={cardTitle}
                    onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = 'https://placehold.co/600x400/f1f5f9/94a3b8?text=No+Image'
                    }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Price badge (bottom-left of image) */}
                <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                        <DollarSign className="h-3 w-3 text-[#c99b43]" />
                        ETB {price}
                    </span>
                </div>

                {/* Status badge (top-right of image) */}
                <div className="absolute right-3 top-3">
                    <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm ${badgeClass}`}>
                        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                            isDraftMode ? 'bg-amber-500' : isRented ? 'bg-indigo-500' : isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                        {badgeText}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-3 p-4">

                {/* Listing type chip */}
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <ListingIcon className="h-3 w-3" />
                        {property.listing_type || 'Property'}
                    </span>
                </div>

                {/* Title */}
                <div>
                    <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white line-clamp-1">
                        {cardTitle}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        <MapPin className="h-3 w-3 shrink-0 text-[#c99b43]" />
                        {location}
                    </p>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => navigate(`/owner/properties/${property.id}`)}
                        title="View"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#c99b43]/10 hover:text-[#c99b43] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-[#c99b43]/10 dark:hover:text-[#c99b43]"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/owner/properties/${property.id}/edit`)}
                        title={isRented ? 'This property is rented and cannot be edited' : 'Edit'}
                        disabled={isRented}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold transition dark:border-slate-700 dark:text-slate-300 ${isRented
                            ? 'cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 dark:hover:bg-sky-950/30 dark:hover:text-sky-400 dark:hover:border-sky-800'}`}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </button>
                    <button
                        type="button"
                        title={isRented ? 'This property is rented and cannot be deleted' : 'Delete'}
                        onClick={async () => {
                            if (isRented) return
                            const ok = window.confirm(`Delete property "${property.property_name}"?`)
                            if (!ok) return
                            try {
                                await (typeof onDelete === 'function' ? onDelete(property.id) : Promise.resolve())
                            } catch (err) {
                                alert(err.message || 'Unable to delete')
                            }
                        }}
                        disabled={isRented}
                        className={`flex items-center justify-center rounded-xl border p-2 ${isRented
                            ? 'cursor-not-allowed border-slate-200 text-slate-300 opacity-50 dark:border-slate-800 dark:text-slate-600'
                            : 'border-red-100 text-red-500 transition hover:bg-red-50 hover:border-red-300 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:border-red-800'}`}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
