import { useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, Eye, Pencil, Trash2 } from 'lucide-react'

export default function PropertyList({ properties, onDelete }) {
    const navigate = useNavigate()

    return (
        <div className="overflow-hidden rounded-2xl lg:rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-[1.2fr_1fr_1fr_1fr_120px] gap-4 border-b border-slate-200 px-5 py-4 text-xs uppercase tracking-[0.24em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>Property</span>
                <span>Location</span>
                <span>Price</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
            </div>

            <div className="flex flex-col gap-2 p-2 lg:space-y-1">
                {properties.map((property) => (
                    <div key={property.id} className="flex flex-col lg:grid lg:grid-cols-[1.2fr_1fr_1fr_1fr_120px] gap-3 lg:gap-4 rounded-xl lg:rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                        {/* Mobile Header / Desktop First Column */}
                        <div className="flex justify-between items-start lg:block">
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{property.property_name}</p>
                                <p className="mt-1 flex items-center gap-1 text-xs lg:text-sm text-slate-500 dark:text-slate-400">
                                    <MapPin className="h-3 w-3 lg:h-4 lg:w-4 shrink-0" />
                                    {[property.city_name, property.region_name, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'}
                                </p>
                            </div>
                            {/* Mobile Status Badge */}
                            <div className="lg:hidden shrink-0">
                                <span className={property.status === 'active' ? 'rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'}>
                                    {property.status === 'active' ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                        </div>

                        {/* Desktop Type (hidden on mobile) */}
                        <div className="hidden lg:flex items-center capitalize">{property.listing_type}</div>

                        {/* Price */}
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <DollarSign className="h-4 w-4 text-[#c99b43]" />
                            <span className="font-medium lg:font-normal">ETB {parseFloat(property.price || 0).toLocaleString()}</span>
                        </div>

                        {/* Desktop Status */}
                        <div className="hidden lg:flex items-center">
                            <span className={property.status === 'active' ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'}>
                                {property.status === 'active' ? 'Available' : 'Unavailable'}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-slate-200 lg:border-none lg:mt-0 lg:pt-0 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => navigate(`/owner/properties/${property.id}`)}
                                className="rounded-lg lg:rounded-2xl bg-slate-900 p-2 lg:px-4 lg:py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                            >
                                <Eye className="h-4 w-4 lg:h-5 lg:w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(`/owner/properties/${property.id}/edit`)}
                                className="rounded-lg lg:rounded-2xl border border-slate-200 p-2 lg:px-4 lg:py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <Pencil className="h-4 w-4 lg:h-5 lg:w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const ok = window.confirm(`Delete property \"${property.property_name}\"?`)
                                    if (!ok) return
                                    try {
                                        await (typeof onDelete === 'function' ? onDelete(property.id) : Promise.resolve())
                                    } catch (err) {
                                        alert(err.message || 'Unable to delete')
                                    }
                                }}
                                className="rounded-lg lg:rounded-2xl border border-red-200 p-2 lg:px-4 lg:py-2 text-sm font-semibold text-red-600"
                            >
                                <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
