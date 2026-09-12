import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, Car, MapPin, Star, Loader2, Trash2 } from 'lucide-react'
import { getFavorites, removeFavorite } from '../../api/property/propertyApi'
import { Button } from '../../components/ui/button'
import { getImageUrl } from '../../lib/utils'
import EmptyState from './components/EmptyState'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const data = await getFavorites()
      setFavorites(data)
    } catch (err) {
      setError(err.message || 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (propertyId, e) => {
    e.stopPropagation()
    try {
      await removeFavorite(propertyId)
      setFavorites(prev => prev.filter(f => f.property.id !== propertyId))
    } catch (err) {
      console.error('Failed to remove favorite', err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c99b43]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchFavorites} variant="outline">Try Again</Button>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div>
        <EmptyState
          title="No favorites yet"
          description="Save properties and vehicles you like to find them quickly later."
          action={
            <Button
              onClick={() => navigate('/properties')}
              className="bg-[#c99b43] text-white hover:bg-[#b0883a]"
            >
              Browse Rentals
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Favorites</h2>
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((fav) => {
          const property = fav.property
          const mainImage = property.images?.length > 0
            ? (property.images[0].image || getImageUrl(property.images[0].image_url))
            : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'
          const isCar = property.listing_type?.toLowerCase() === 'car' || property.listing_type?.toLowerCase() === 'vehicle'
          const ListingIcon = isCar ? Car : Building2
          const typeLabel = isCar ? 'Vehicle' : 'Property'
          const rating = property.rating_summary?.average_rating || 'New'

          return (
            <motion.div
              key={fav.id}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              onClick={() => navigate(`/properties/${property.id}`)}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl hover:shadow-[#c99b43]/10 border border-slate-100 dark:bg-slate-900 dark:border-slate-800/70 transition-shadow duration-300 cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-40 w-full overflow-hidden sm:h-44">
                <img
                  src={mainImage}
                  alt={property.property_name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                {/* Top-left: type tag */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#c99b43]/90 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur-sm">
                    <ListingIcon className="h-3 w-3" />
                    {typeLabel}
                  </span>
                </div>

                {/* Top-right: remove favorite */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveFavorite(property.id, e)}
                  className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-red-50 dark:bg-slate-900/90"
                  aria-label="Remove from favorites"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>

                {/* Bottom-left: rating */}
                <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full border border-white/20 bg-white/20 px-2 py-0.5 backdrop-blur-sm">
                  <Star className="h-2.5 w-2.5 fill-[#c99b43] text-[#c99b43] sm:h-3 sm:w-3" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-white">{rating}</span>
                </div>

                {/* Bottom-right: price */}
                <div className="absolute bottom-2.5 right-2.5 z-10 flex items-baseline gap-0.5">
                  <span className="text-sm sm:text-base font-extrabold text-white drop-shadow">
                    ETB {parseFloat(property.price).toLocaleString()}
                  </span>
                  {property.rental_unit ? (
                    <span className="text-[9px] text-white/75">/{property.rental_unit}</span>
                  ) : null}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#c99b43] dark:group-hover:text-[#f3c96d] transition-colors duration-200 line-clamp-1 text-sm sm:text-[15px]">
                    {property.property_name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs truncate">
                    <MapPin className="h-3 w-3 text-[#c99b43] shrink-0" />
                    <span className="truncate">
                      {[property.city_name, property.region_name, property.kebele].filter(Boolean).join(', ') || 'Location Unspecified'}
                    </span>
                  </p>
                </div>

                {/* CTA */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Saved</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/properties/${property.id}`) }}
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
        })}
      </div>
    </div>
  )
}