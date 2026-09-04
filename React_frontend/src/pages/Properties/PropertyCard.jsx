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
            className={`group overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:ring-slate-200 dark:border-slate-800/60 dark:bg-slate-900 dark:ring-slate-800/40 dark:hover:ring-slate-700/60 ${isGrid ? 'flex flex-col' : 'flex flex-col sm:flex-row'
                }`}
        >
            {/* Image Container */}
            <div
                className={`relative overflow-hidden ${isGrid
                    ? 'h-28 sm:h-44 xl:h-52 w-full'
                    : 'h-44 sm:h-auto w-full sm:w-64 lg:w-80 flex-shrink-0'
                    }`}
            >
                <img
                    src={property.image}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'
                    }}
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Availability badge */}
                <div className="absolute left-2 top-2 sm:left-3 sm:top-3 z-10">
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] sm:text-xs font-semibold shadow-md backdrop-blur-sm ${property.is_available
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-500/90 text-white'
                        }`}>
                        <span className={`mr-1 h-1 w-1 rounded-full sm:mr-1.5 sm:h-1.5 sm:w-1.5 ${property.is_available ? 'bg-white' : 'bg-white/70'}`} />
                        {property.is_available ? 'Available' : 'Rented'}
                    </span>
                </div>

                {/* Type badge */}
                <div className="absolute left-2 bottom-2 sm:left-3 sm:bottom-3 z-10">
                    <span className="inline-flex rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] sm:text-xs font-semibold text-slate-700 shadow-md backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-300">
                        {property.type}
                    </span>
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(property.id);
                    }}
                    disabled={isLoading}
                    className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 disabled:opacity-50"
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-slate-600 dark:text-slate-400" />
                    ) : (
                        <Heart className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors duration-200 ${isFav
                            ? 'fill-red-500 text-red-500'
                            : 'text-slate-500 dark:text-slate-400'
                            }`} />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className={`flex flex-1 flex-col justify-between ${isGrid ? 'p-2.5 sm:p-4' : 'p-3.5 sm:p-5'
                }`}>
                <div>
                    <h3 className={`font-semibold text-slate-900 transition-colors duration-200 group-hover:text-[#c99b43] dark:text-white dark:group-hover:text-[#f3c96d] line-clamp-1 ${isGrid ? 'text-sm sm:text-base' : 'text-sm sm:text-lg'
                        }`}>
                        {property.title}
                    </h3>
                    <p className={`mt-1 flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate ${isGrid ? 'text-[11px] sm:text-sm' : 'text-xs sm:text-sm'
                        }`}>
                        <MapPin className="shrink-0 h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#c99b43]" />
                        <span className="truncate">{property.location}</span>
                    </p>

                    {property.type === 'House' ? (
                        <div className={`mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-3 border-t border-slate-100 pt-2 sm:pt-2.5 text-slate-500 dark:border-slate-800 dark:text-slate-400 ${isGrid ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
                            }`}>
                            <div className="flex items-center gap-1">
                                <Bed className="h-3.5 w-3.5" />
                                <span>{property.beds}</span>
                            </div>
                            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                            <div className="flex items-center gap-1">
                                <Bath className="h-3.5 w-3.5" />
                                <span>{property.baths}</span>
                            </div>
                            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                            <div className="flex items-center gap-1">
                                <Maximize2 className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[40px] sm:max-w-none">{property.area}</span>
                            </div>
                        </div>
                    ) : property.type === 'Car' ? (
                        <div className={`mt-2 sm:mt-3 grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-0.5 border-t border-slate-100 pt-2 sm:pt-2.5 text-slate-500 dark:border-slate-800 dark:text-slate-400 ${isGrid ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
                            }`}>
                            <span className="truncate"><strong className="font-medium text-slate-600 dark:text-slate-300">Brand:</strong> {property.brand}</span>
                            <span className="truncate"><strong className="font-medium text-slate-600 dark:text-slate-300">Model:</strong> {property.model}</span>
                            <span className="truncate"><strong className="font-medium text-slate-600 dark:text-slate-300">Year:</strong> {property.year}</span>
                            <span className="truncate"><strong className="font-medium text-slate-600 dark:text-slate-300">Mileage:</strong> {property.mileage}</span>
                        </div>
                    ) : null}
                </div>

                <div className={`flex items-center justify-between ${property.type === 'House' ? 'mt-2 sm:mt-4' : 'mt-2 sm:mt-4 border-t border-slate-100 pt-2 sm:pt-3 dark:border-slate-800'
                    }`}>
                    <div className="flex items-baseline gap-1">
                        <span className={`font-bold text-[#c99b43] ${isGrid ? 'text-sm sm:text-base xl:text-xl' : 'text-lg sm:text-2xl'
                            }`}>
                            {property.price}
                        </span>
                        <span className={`text-slate-400 dark:text-slate-500 ${isGrid ? 'text-[9px] sm:text-xs' : 'text-xs sm:text-sm'
                            }`}>ETB/{property.rental_unit}</span>
                    </div>
                    <Button
                        size="sm"
                        className={`rounded-xl bg-gradient-to-r from-[#c99b43] to-[#f3c96d] font-semibold text-slate-950 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-[#c99b43]/20 hover:opacity-90 active:scale-95 ${isGrid ? 'h-7 px-2.5 text-[11px] sm:h-9 sm:px-4 sm:text-sm' : 'px-4 py-2 text-sm'
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
