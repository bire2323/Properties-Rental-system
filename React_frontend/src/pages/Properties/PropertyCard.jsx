// src/pages/Properties/PropertyCard.jsx
import { MapPin, Heart, Bed, Bath, Maximize2, Loader2, ArrowRight, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function PropertyCard({ property, isFav, isLoading, toggleFavorite, layout = 'grid' }) {
  const navigate = useNavigate()
  const isGrid = layout === 'grid'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 340, damping: 24 }}
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-[#c99b43]/10 border border-slate-100 dark:border-slate-800/70 transition-shadow duration-300 cursor-pointer ${isGrid ? 'flex flex-col' : 'flex flex-col sm:flex-row'}`}
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      {/* ── Image ──────────────────────────────── */}
      <div className={`relative overflow-hidden ${isGrid ? 'h-44 sm:h-48 xl:h-52 w-full' : 'h-48 sm:h-auto w-full sm:w-64 lg:w-72 flex-shrink-0'}`}>
        <img
          src={property.image}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-108"
          style={{ transitionDuration: '600ms' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800' }}
        />

        {/* Gradient overlay – stronger at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Top-left: availability */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow backdrop-blur-sm
            ${property.is_available
              ? 'bg-emerald-500/90 text-white'
              : 'bg-slate-600/85 text-white'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${property.is_available ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
            {property.is_available ? 'Available' : 'Rented'}
          </span>
        </div>

        {/* Top-right: favorite */}
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(property.id) }}
          disabled={isLoading}
          className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50"
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
            : <Heart className={`h-3.5 w-3.5 transition-all duration-200 ${isFav ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-500 dark:text-slate-400'}`} />
          }
        </button>

        {/* Bottom-left: type tag */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="inline-flex rounded-full bg-[#c99b43]/90 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur-sm">
            {property.type}
          </span>
        </div>

        {/* Bottom-right: price */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-baseline gap-0.5">
          <span className="text-sm sm:text-base font-extrabold text-white drop-shadow">{property.price}</span>
          <span className="text-[9px] text-white/75">ETB/{property.rental_unit}</span>
        </div>
      </div>

      {/* ── Content ────────────────────────────── */}
      <div className={`flex flex-1 flex-col justify-between ${isGrid ? 'p-3 sm:p-4' : 'p-4 sm:p-5'}`}>
        <div>
          {/* Title */}
          <h3 className={`font-bold text-slate-900 dark:text-white group-hover:text-[#c99b43] dark:group-hover:text-[#f3c96d] transition-colors duration-200 line-clamp-1 ${isGrid ? 'text-sm sm:text-[15px]' : 'text-base sm:text-lg'}`}>
            {property.title}
          </h3>

          {/* Location */}
          <p className="mt-1 flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs truncate">
            <MapPin className="h-3 w-3 text-[#c99b43] shrink-0" />
            <span className="truncate">{property.location}</span>
          </p>

          {/* Feature chips */}
          {property.type === 'House' ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
              {[
                { Icon: Bed, label: `${property.beds} Beds` },
                { Icon: Bath, label: `${property.baths} Baths` },
                ...(property.area !== '-' ? [{ Icon: Maximize2, label: `${property.area} ft²` }] : []),
              ].map(({ Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-lg bg-[#c99b43]/8 dark:bg-[#c99b43]/10 border border-[#c99b43]/20 px-2 py-0.5 font-medium text-[#a07c30] dark:text-[#f3c96d]">
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          ) : property.type === 'Car' ? (
            <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] sm:text-xs">
              {[
                { k: 'Brand', v: property.brand },
                { k: 'Model', v: property.model },
                { k: 'Year', v: property.year },
                { k: 'Mileage', v: property.mileage },
              ].map(({ k, v }) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-[#c99b43]/8 dark:bg-[#c99b43]/10 border border-[#c99b43]/20 px-2 py-0.5 font-medium text-[#a07c30] dark:text-[#f3c96d] truncate">
                  <span className="text-slate-400 dark:text-slate-500 font-normal">{k}:</span>
                  <span className="truncate">{v}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── CTA ── */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          {/* Star rating placeholder */}
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#c99b43] text-[#c99b43]" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">New</span>
          </div>

          <button
            onClick={e => { e.stopPropagation(); navigate(`/properties/${property.id}`) }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-slate-900 shadow-sm shadow-[#c99b43]/25 transition-all duration-200 hover:shadow-md hover:shadow-[#c99b43]/30 hover:opacity-90 active:scale-95"
          >
            View
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Accent border glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-[#c99b43]/30" />
    </motion.div>
  )
}
