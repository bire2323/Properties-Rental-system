import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, DollarSign, CircleDollarSign, Eye, Pencil, Trash2 } from 'lucide-react'
import { getImageUrl } from '../../../lib/utils'

export default function PropertyCard({ property, onDelete }) {
    const navigate = useNavigate()
    const imageUrl = getImageUrl(property.main_image?.image || property.images?.[0]?.image) || ''

    return (
        <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="h-64 overflow-hidden bg-slate-100">
                <img
                    src={imageUrl}
                    alt={property.title}
                    onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = 'https://via.placeholder.com/600x400?text=No+Image'
                    }}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
            </div>
            <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.25em] dark:bg-slate-800">
                        <Building2 className="h-4 w-4" />
                        {property.property_type}
                    </span>
                    <span className={property.is_available ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'}>
                        {property.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{property.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{property.location}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <MapPin className="h-4 w-4" />
                        {property.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <DollarSign className="h-4 w-4" />
                        ETB {parseFloat(property.price || 0).toLocaleString()}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate(`/owner/properties/${property.id}`)}
                        className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        <Eye className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/owner/properties/${property.id}/edit`)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        <Pencil className="h-5 w-5" />
                    </button>

                    <button type="button"
                        onClick={async () => {
                            const ok = window.confirm(`Delete property \"${property.title}\"?`)
                            if (!ok) return
                            try {
                                await (typeof onDelete === 'function' ? onDelete(property.id) : Promise.resolve())
                            } catch (err) {
                                alert(err.message || 'Unable to delete')
                            }
                        }}
                        className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>



                </div>
            </div>
        </div>
    )
}
