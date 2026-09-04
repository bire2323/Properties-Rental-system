import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, MapPin, Search, Star, Heart, Grid3x3, List, ChevronDown, Fuel, Users, Settings2, Loader2, AlertCircle, RefreshCw, Filter, X } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { getAllProperties, getFavorites, addFavorite, removeFavorite } from '../../api/property/propertyApi'
import { useAuth } from '../../hooks/useAuth'
import { VehicleSidebarFilters } from './VehicleSidebarFilters'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function resolveImageUrl(imagePath) {
  if (!imagePath) return null
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${API_BASE_URL}${imagePath}`
}

function mapVehicleToCard(property) {
  const mainImageUrl = property.main_image?.image
    ? resolveImageUrl(property.main_image.image)
    : 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800'

  const detail = property.car_detail || {}

  const priceNum = parseFloat(property.price) || 0
  const priceFormatted = priceNum.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const locationDisplay = [property.city_name, property.region_name, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'
  const ratingSum = property.rating_summary || {}
  const rating = parseFloat(ratingSum.average) || 0

  return {
    id: property.id,
    image: mainImageUrl,
    name: property.property_name || `${detail.brand || 'Vehicle'} ${detail.model || ''}`,
    type: detail.model || 'Car',
    location: locationDisplay,
    price: priceFormatted,
    priceRaw: priceNum,
    seats: detail.seating_capacity || '-',
    fuel: detail.fuel_type || '-',
    transmission: detail.transmission || 'Auto',
    rating: rating > 0 ? rating.toFixed(1) : 'New',
    created_at: property.created_at,
  }
}

function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm ring-1 ring-slate-100 dark:border-slate-800/60 dark:bg-slate-900 dark:ring-slate-800/40">
      <div className="h-28 sm:h-48 lg:h-44 animate-pulse bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-800/50" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        <div className="flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="h-4 w-10 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-4 w-10 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-4 w-12 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

function Vehicles() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const defaultFilters = {
    search: '',
    location: '',
    brand: '',
    fuel_type: '',
    seating_capacity: 'any',
    min_price: 0,
    max_price: 200000,
    is_available: '',
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')

  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [favorites, setFavorites] = useState([])
  const [favoriteLoading, setFavoriteLoading] = useState({})

  const fetchedRef = useRef(false)

  // Debounced fetch for filters
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVehicles();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavorites([])
    }
  }, [user])

  async function fetchVehicles() {
    setLoading(true)
    setError(null)

    const apiFilters = { ...filters, type: 'car' }; // Enforce car listing_type

    if (apiFilters.seating_capacity === 'any') delete apiFilters.seating_capacity;

    if (apiFilters.search) {
      if (!apiFilters.location) {
        apiFilters.location = apiFilters.search;
      }
    }
    delete apiFilters.search;

    try {
      const data = await getAllProperties(apiFilters)
      const results = Array.isArray(data) ? data : data.results || []
      setVehicles(results.map(mapVehicleToCard))
    } catch (err) {
      setError(err.message || 'Failed to load vehicles.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFavorites() {
    try {
      const data = await getFavorites()
      const favoriteIds = data.map(fav => fav.property?.id || fav.property_id || fav)
      setFavorites(favoriteIds)
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
    }
  }

  const toggleFavorite = async (propertyId) => {
    if (!user) {
      navigate('/login')
      return
    }
    if (favoriteLoading[propertyId]) return

    const isFavorite = favorites.includes(propertyId)

    setFavorites(prev =>
      isFavorite ? prev.filter(id => id !== propertyId) : [...prev, propertyId]
    )
    setFavoriteLoading(prev => ({ ...prev, [propertyId]: true }))

    try {
      if (isFavorite) {
        await removeFavorite(propertyId)
      } else {
        await addFavorite(propertyId)
      }
    } catch (err) {
      setFavorites(prev =>
        isFavorite ? [...prev, propertyId] : prev.filter(id => id !== propertyId)
      )
      console.error('Failed to toggle favorite:', err)
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [propertyId]: false }))
    }
  }

  const handleClearAll = () => {
    setFilters(defaultFilters);
    setSearchParams({});
    setIsFilterOpen(false);
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.brand ? 1 : 0) +
    (filters.fuel_type ? 1 : 0) +
    (filters.seating_capacity !== 'any' ? 1 : 0) +
    (filters.min_price > 0 || filters.max_price < 200000 ? 1 : 0) +
    (filters.is_available !== '' ? 1 : 0);

  const sortedVehicles = [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.priceRaw - b.priceRaw
      case 'price-high':
        return b.priceRaw - a.priceRaw
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'popular':
        return parseFloat(b.rating) - parseFloat(a.rating)
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      {/* Toolbar */}
      <section className="sticky top-20 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md py-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/95">
        <div className="mx-auto max-w-screen-2xl lg:mx-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Vehicles for Rent
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {loading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>
                    <span className="font-bold text-[#c99b43]">{sortedVehicles.length}</span>{' '}
                    {sortedVehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Available
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                className="h-9 rounded-lg border-slate-200 bg-white/80 px-3 text-xs font-medium text-slate-600 hover:border-[#c99b43]/40 hover:bg-[#c99b43]/5 hover:text-[#c99b43] dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-[#c99b43]/30"
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#c99b43] text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 appearance-none rounded-lg border border-slate-200 bg-white/80 pl-3 pr-8 text-xs font-medium transition-all duration-200 hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-white dark:hover:border-slate-600"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/80 p-0.5 dark:border-slate-700/60 dark:bg-slate-800/40">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-md p-1.5 transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-[#c99b43] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-md p-1.5 transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-[#c99b43] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  aria-label="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <section className="bg-white py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-screen-2xl lg:mx-10 px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 lg:gap-6">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-[260px] xl:w-[272px] flex-shrink-0 sticky top-44 self-start h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar pb-8">
              <VehicleSidebarFilters
                filters={filters}
                setFilters={setFilters}
                onClearAll={handleClearAll}
              />
            </aside>

            {/* Content Area */}
            <main className="flex-1 min-w-0">
              {loading && (
                <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-4"}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <VehicleCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200/60 bg-white py-20 text-center shadow-sm dark:border-red-900/30 dark:bg-slate-900">
                  <div className="rounded-full bg-red-50 p-5 dark:bg-red-950/30">
                    <AlertCircle className="h-10 w-10 text-red-400 dark:text-red-500" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    Failed to Load Vehicles
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    {error}
                  </p>
                  <Button
                    onClick={fetchVehicles}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:opacity-90"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              )}

              {!loading && !error && sortedVehicles.length > 0 && (
                <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-4"}>
                  {sortedVehicles.map((vehicle, index) => (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
                    >
                      <Card
                        className={`group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:ring-slate-200 dark:border-slate-800/60 dark:bg-slate-900 dark:ring-slate-800/40 dark:hover:ring-slate-700/60 ${viewMode === 'list' ? 'flex flex-row h-32 sm:h-48' : ''
                          }`}
                      >
                        {/* Image Container */}
                        <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-2/5 sm:w-1/3 shrink-0 h-full' : 'h-28 sm:h-48 lg:h-44'}`}>
                          <img
                            src={vehicle.image}
                            alt={vehicle.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Subtle gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                          {/* Type Badge */}
                          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 z-10">
                            <span className="inline-flex rounded-full bg-[#c99b43]/90 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-md backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-xs">
                              {vehicle.type}
                            </span>
                          </div>

                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(vehicle.id);
                            }}
                            className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900"
                            aria-label="Add to favorites"
                          >
                            {favoriteLoading[vehicle.id] ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-slate-400" />
                            ) : (
                              <Heart
                                className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors duration-200 ${favorites.includes(vehicle.id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-slate-500 dark:text-slate-400'
                                  }`}
                              />
                            )}
                          </button>

                          {/* Rating Badge */}
                          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 shadow-md backdrop-blur-md dark:bg-slate-900/90 sm:px-2.5 sm:py-1">
                            <Star className="h-2.5 w-2.5 fill-[#c99b43] text-[#c99b43] sm:h-3.5 sm:w-3.5" />
                            <span className="text-[9px] font-bold text-slate-900 dark:text-white sm:text-xs">
                              {vehicle.rating}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className={`p-2.5 sm:p-4 flex flex-col justify-between ${viewMode === 'list' ? 'flex-1 min-w-0' : ''}`}>
                          <div>
                            {/* Title */}
                            <h3 className="text-xs sm:text-base font-semibold text-slate-900 transition-colors duration-200 group-hover:text-[#c99b43] dark:text-white dark:group-hover:text-[#f3c96d] line-clamp-1">
                              {vehicle.name}
                            </h3>

                            {/* Location */}
                            <p className="mt-1 flex items-center gap-1 text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-[#c99b43]" />
                              <span className="truncate">{vehicle.location}</span>
                            </p>

                            {/* Vehicle Details */}
                            <div className={`mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 ${viewMode === 'list' ? '' : 'border-t border-slate-100 pt-2 sm:pt-3 dark:border-slate-800'}`}>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>{vehicle.seats}</span>
                              </div>
                              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                              <div className="flex items-center gap-1">
                                <Fuel className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="truncate max-w-[36px] sm:max-w-none">{vehicle.fuel}</span>
                              </div>
                              <div className="hidden sm:block h-3 w-px bg-slate-200 dark:bg-slate-700" />
                              <div className="hidden sm:flex items-center gap-1">
                                <Settings2 className="h-3.5 w-3.5" />
                                <span>{vehicle.transmission}</span>
                              </div>
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="mt-2 sm:mt-4 flex items-center justify-between border-t border-slate-100 pt-2 sm:pt-3 dark:border-slate-800">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm sm:text-xl font-bold text-[#c99b43]">
                                {vehicle.price}
                              </span>
                              <span className="text-[9px] sm:text-xs text-slate-400 dark:text-slate-500">
                                ETB/d
                              </span>
                            </div>
                            <Button
                              size="sm"
                              className="rounded-xl bg-gradient-to-r from-[#c99b43] to-[#f3c96d] h-7 px-2.5 text-[11px] font-semibold text-slate-950 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-[#c99b43]/20 hover:opacity-90 sm:h-9 sm:px-4 sm:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/vehicles/${vehicle.id}`);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {!loading && !error && sortedVehicles.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-20 text-center shadow-sm dark:border-slate-800/60 dark:bg-slate-900">
                  <div className="rounded-full bg-slate-100 p-5 dark:bg-slate-800/60">
                    <Car className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    No Vehicles Found
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    We couldn't find any vehicles matching your search criteria. Try adjusting your filters.
                  </p>
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    className="mt-6 rounded-xl border-[#c99b43]/30 bg-[#c99b43]/5 px-5 py-2.5 text-sm font-semibold text-[#c99b43] hover:border-[#c99b43] hover:bg-[#c99b43] hover:text-white"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Mobile/Tablet Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
                <VehicleSidebarFilters
                  filters={filters}
                  setFilters={setFilters}
                  onClearAll={handleClearAll}
                />
                {/* Apply Button */}
                <div className="mt-6">
                  <Button
                    className="w-full bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Show Results ({sortedVehicles.length})
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}

export default Vehicles
