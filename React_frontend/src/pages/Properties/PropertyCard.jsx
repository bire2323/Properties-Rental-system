// src/components/properties/PropertyCard.jsx
import { MapPin, Heart, Bed, Bath, Maximize2, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { motion } from 'framer-motion'

export function PropertyCard({ property, isFav, isLoading, toggleFavorite, layout = 'grid' }) {
    const navigate = useNavigate()
    const isGrid = layout === 'grid'

    return (
        <Card
            as={motion.div}
            whileTap={{ scale: 0.98 }}
            className={`group overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 ${isGrid ? 'flex flex-col' : 'flex flex-col sm:flex-row'
                }`}
        >
            {/* Image Container */}
            <div
                className={`relative overflow-hidden ${isGrid
                        ? 'h-32 sm:h-48 w-full'
                        : 'h-40 sm:h-auto w-full sm:w-64 lg:w-80 flex-shrink-0'
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
                <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 sm:px-2.5 sm:py-0.5 text-[9px] sm:text-xs font-semibold shadow-md ${property.is_available
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-500 text-white'
                        }`}>
                        {property.is_available ? 'Available' : 'Rented'}
                    </span>
                </div>
                <div className="absolute left-2 bottom-2 sm:left-3 sm:bottom-3">
                    <span className="inline-flex rounded-full bg-white/95 px-2 py-0.5 text-[9px] sm:text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm dark:bg-slate-900/95 dark:text-slate-300">
                        {property.type}
                    </span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(property.id);
                    }}
                    disabled={isLoading}
                    className="absolute right-2 top-2 sm:right-3 sm:top-3 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900 disabled:opacity-50"
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-slate-600 dark:text-slate-400" />
                    ) : (
                        <Heart className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors ${isFav
                                ? 'fill-red-500 text-red-500'
                                : 'text-slate-600 dark:text-slate-400'
                            }`} />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className={`flex flex-1 flex-col justify-between ${isGrid ? 'p-3 sm:p-4' : 'p-3 sm:p-5'
                }`}>
                <div>
                    <h3 className={`font-semibold text-slate-900 transition-colors group-hover:text-[#c99b43] dark:text-white dark:group-hover:text-[#f3c96d] line-clamp-1 ${isGrid ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg'
                        }`}>
                        {property.title}
                    </h3>
                    <p className={`mt-1 flex items-center gap-1 sm:gap-1.5 text-slate-600 dark:text-slate-400 truncate ${isGrid ? 'text-[10px] sm:text-xs' : 'text-[11px] sm:text-sm'
                        }`}>
                        <MapPin className="shrink-0 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{property.location}</span>
                    </p>

                    {property.type === 'House' && (
                        <div className={`mt-2 flex items-center gap-1.5 sm:gap-3 border-t border-slate-200 pt-2 text-slate-600 dark:border-slate-800 dark:text-slate-400 ${isGrid ? 'text-[9px] sm:text-xs' : 'text-[10px] sm:text-sm'
                            }`}>
                            <div className="flex items-center gap-1">
                                <Bed className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{property.beds}</span>
                            </div>
                            <div className="h-2 sm:h-3 w-px bg-slate-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-1">
                                <Bath className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{property.baths}</span>
                            </div>
                            <div className="h-2 sm:h-3 w-px bg-slate-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-1">
                                <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="truncate max-w-[30px] sm:max-w-none">{property.area}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`flex items-center justify-between ${property.type === 'House' ? 'mt-2 sm:mt-3' : 'mt-2 sm:mt-3 border-t border-slate-200 pt-2 sm:pt-3 dark:border-slate-800'
                    }`}>
                    <div className="flex flex-col sm:block">
                        <span className={`font-bold text-[#c99b43] ${isGrid ? 'text-sm sm:text-lg' : 'text-base sm:text-2xl'
                            }`}>
                            {property.price}
                        </span>
                        <span className={`text-slate-500 dark:text-slate-400 ${isGrid ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-sm'
                            }`}> ETB/{property.rental_unit}</span>
                    </div>
                    <Button
                        size="sm"
                        className={`rounded-lg bg-gradient-to-r from-[#c99b43] to-[#f3c96d] font-semibold text-slate-950 shadow-sm transition-all hover:shadow-md hover:opacity-90 ${isGrid ? 'h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs' : 'px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm'
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/properties/${property.id}`);
                        }}
                    >
                        View
                    </Button>
                </div>
            </div>
        </Card>
    )
}