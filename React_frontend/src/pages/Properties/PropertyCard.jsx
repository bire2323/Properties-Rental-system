// src/components/properties/PropertyCard.jsx
import { MapPin, Heart, Bed, Bath, Maximize2, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

export function PropertyCard({ property, isFav, isLoading, toggleFavorite, layout = 'grid' }) {
    const navigate = useNavigate()
    const isGrid = layout === 'grid'

    return (
        <Card
            className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 ${isGrid ? 'flex flex-col' : 'flex flex-col sm:flex-row'
                }`}
        >
            {/* Image Container */}
            <div
                className={`relative overflow-hidden ${isGrid
                        ? 'h-48 w-full'
                        : 'h-48 w-full sm:h-auto sm:w-64 lg:w-80 flex-shrink-0'
                    }`}
            >
                <img
                    src={property.image}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'
                    }}
                />
                <div className="absolute left-3 top-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-md ${property.is_available
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-500 text-white'
                        }`}>
                        {property.is_available ? 'Available' : 'Rented'}
                    </span>
                </div>
                <div className="absolute left-3 bottom-3">
                    <span className="inline-flex rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm dark:bg-slate-900/95 dark:text-slate-300">
                        {property.type}
                    </span>
                </div>
                <button
                    onClick={() => toggleFavorite(property.id)}
                    disabled={isLoading}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900 disabled:opacity-50"
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-600 dark:text-slate-400" />
                    ) : (
                        <Heart className={`h-4 w-4 transition-colors ${isFav
                                ? 'fill-red-500 text-red-500'
                                : 'text-slate-600 dark:text-slate-400'
                            }`} />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className={`flex flex-1 flex-col justify-between ${isGrid ? 'p-4' : 'p-4 sm:p-5'
                }`}>
                <div>
                    <h3 className={`font-semibold text-slate-900 transition-colors group-hover:text-[#c99b43] dark:text-white dark:group-hover:text-[#f3c96d] ${isGrid ? 'text-sm' : 'text-lg'
                        }`}>
                        {property.title}
                    </h3>
                    <p className={`mt-1 flex items-center gap-1.5 text-slate-600 dark:text-slate-400 ${isGrid ? 'text-xs' : 'text-sm'
                        }`}>
                        <MapPin className={isGrid ? 'h-3 w-3' : 'h-4 w-4'} />
                        {property.location}
                    </p>

                    {property.type === 'House' && (
                        <div className={`mt-2 flex items-center gap-3 border-t border-slate-200 pt-2 text-slate-600 dark:border-slate-800 dark:text-slate-400 ${isGrid ? 'text-xs' : 'text-sm'
                            }`}>
                            <div className="flex items-center gap-1">
                                <Bed className={isGrid ? 'h-3 w-3' : 'h-4 w-4'} />
                                <span>{property.beds}</span>
                            </div>
                            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-1">
                                <Bath className={isGrid ? 'h-3 w-3' : 'h-4 w-4'} />
                                <span>{property.baths}</span>
                            </div>
                            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-1">
                                <Maximize2 className={isGrid ? 'h-3 w-3' : 'h-4 w-4'} />
                                <span>{property.area}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`flex items-center justify-between ${property.type === 'House' ? 'mt-3' : 'mt-3 border-t border-slate-200 pt-3 dark:border-slate-800'
                    }`}>
                    <div>
                        <span className={`font-bold text-[#c99b43] ${isGrid ? 'text-lg' : 'text-2xl'
                            }`}>
                            {property.price}
                        </span>
                        <span className={`text-slate-500 dark:text-slate-400 ${isGrid ? 'text-[10px]' : 'text-sm'
                            }`}> ETB/mo</span>
                    </div>
                    <Button
                        size={isGrid ? 'sm' : 'sm'}
                        className={`rounded-lg bg-gradient-to-r from-[#c99b43] to-[#f3c96d] font-semibold text-slate-950 shadow-sm transition-all hover:shadow-md hover:opacity-90 ${isGrid ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
                            }`}
                        onClick={() => navigate(`/properties/${property.id}`)}
                    >
                        View
                    </Button>
                </div>
            </div>
        </Card>
    )
}