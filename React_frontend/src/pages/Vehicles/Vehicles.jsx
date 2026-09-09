import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, MapPin, Star, Heart, Grid3x3, List, ChevronDown,
  Fuel, Users, Settings2, Loader2, AlertCircle, RefreshCw, Filter, X, ArrowRight
} from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
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
    is_available: property.status === 'active',
  }
}

// ─── Vehicle Card ─────────────────────────────────────────────────────
function VehicleCard({ vehicle, isFav, favLoading, onToggleFav, onView, viewMode }) {
  const isGrid = viewMode === 'grid'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 340, damping: 24 }}
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-[#c99b43]/10 border border-slate-100 dark:border-slate-800/70 transition-shadow duration-300 cursor-pointer ${isGrid ? 'flex flex-col' : 'flex flex-row h-36 sm:h-48'}`}
      onClick={() => onView(vehicle.id)}
    >
      {/* ── Image ── */}
      <div className={`relative overflow-hidden ${isGrid ? 'h-40 sm:h-48 xl:h-52 w-full' : 'w-2/5 sm:w-1/3 shrink-0 h-full'}`}>
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800' }}
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Top-left: type badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex rounded-full bg-[#c99b43]/90 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow backdrop-blur-sm">
            {vehicle.type}
          </span>
        </div>

        {/* Top-right: favorite */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(vehicle.id) }}
          className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:hover:bg-slate-800"
          aria-label="Favorite"
        >
          {favLoading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            : <Heart className={`h-3.5 w-3.5 transition-all duration-200 ${isFav ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-500 dark:text-slate-400'}`} />
          }
        </button>

        {/* Bottom-left: rating */}
        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 px-2 py-0.5">
          <Star className="h-2.5 w-2.5 fill-[#c99b43] text-[#c99b43] sm:h-3 sm:w-3" />
          <span className="text-[9px] sm:text-[10px] font-bold text-white">{vehicle.rating}</span>
        </div>

        {/* Bottom-right: price */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-baseline gap-0.5">
          <span className="text-sm sm:text-base font-extrabold text-white drop-shadow">{vehicle.price}</span>
          <span className="text-[9px] text-white/75 ml-0.5">ETB/d</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={`flex flex-col justify-between ${isGrid ? 'p-3 sm:p-4' : 'flex-1 min-w-0 p-3 sm:p-4'}`}>
        <div>
          {/* Title */}
          <h3 className={`font-bold text-slate-900 dark:text-white group-hover:text-[#c99b43] dark:group-hover:text-[#f3c96d] transition-colors duration-200 line-clamp-1 ${isGrid ? 'text-sm sm:text-[15px]' : 'text-xs sm:text-sm'}`}>
            {vehicle.name}
          </h3>

          {/* Location */}
          <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 truncate">
            <MapPin className="h-3 w-3 text-[#c99b43] shrink-0" />
            <span className="truncate">{vehicle.location}</span>
          </p>

          {/* Spec chips */}
          <div className={`mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs ${isGrid ? '' : 'hidden sm:flex'}`}>
            {[
              { Icon: Users, label: `${vehicle.seats}` },
              { Icon: Fuel, label: vehicle.fuel },
              { Icon: Settings2, label: vehicle.transmission },
            ].map(({ Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1 rounded-lg bg-[#c99b43]/8 dark:bg-[#c99b43]/10 border border-[#c99b43]/20 px-2 py-0.5 font-medium text-[#a07c30] dark:text-[#f3c96d] truncate max-w-[60px] sm:max-w-none">
                <Icon className="h-3 w-3 shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          {/* Availability dot */}
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${vehicle.is_available ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {vehicle.is_available ? 'Available' : 'Rented'}
            </span>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onView(vehicle.id) }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-slate-900 shadow-sm shadow-[#c99b43]/25 transition-all duration-200 hover:shadow-md hover:shadow-[#c99b43]/30 hover:opacity-90 active:scale-95"
          >
            View
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Hover glow ring */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-[#c99b43]/30" />
    </motion.div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────
function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse">
      <div className="h-48 sm:h-52 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-800/50" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-14 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-5 w-14 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-5 w-16 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="h-4 w-16 rounded-md bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-7 w-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────
function Vehicles() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const defaultFilters = {
    search: '',
    location: '',
    category: '',
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

  // Prevent background scrolling and handle Escape when mobile filter drawer is open
  useEffect(() => {
    if (!isFilterOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFilterOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFilterOpen])

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavorites([])
    }
  }, [user])

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam !== null) {
      setFilters((prev) => ({ ...prev, category: categoryParam || '' }))
    }
  }, [searchParams])

  async function fetchVehicles() {
    setLoading(true)
    setError(null)

    const apiFilters = { ...filters, type: 'car' };
    if (apiFilters.seating_capacity === 'any') delete apiFilters.seating_capacity;
    // `search` is now passed directly to the backend which filters by property_name / description
    if (!apiFilters.search) delete apiFilters.search;

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
    (filters.is_available !== '' ? 1 : 0) +
    (filters.category ? 1 : 0);

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
                className="lg:hidden h-9 rounded-lg border-slate-200 bg-white/80 px-3 text-xs font-medium text-slate-600 hover:border-[#c99b43]/40 hover:bg-[#c99b43]/5 hover:text-[#c99b43] dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-[#c99b43]/30"
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
        <div className="mx-auto flex max-w-screen-2xl gap-4 px-4 sm:px-6 lg:mx-10 lg:gap-6 lg:px-8">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-[248px] xl:w-[288px] flex-shrink-0 sticky top-44 self-start h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar pb-8">
            <VehicleSidebarFilters
              filters={filters}
              setFilters={setFilters}
              onClearAll={handleClearAll}
            />
          </aside>

          {/* Content Area — stretches to right edge */}
          <main className="flex-1 min-w-0">
            {loading && (
              <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4" : "flex flex-col gap-4"}>
                {Array.from({ length: 8 }).map((_, i) => (
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
              <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4" : "flex flex-col gap-4"}>
                {sortedVehicles.map((vehicle, index) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
                  >
                    <VehicleCard
                      vehicle={vehicle}
                      isFav={favorites.includes(vehicle.id)}
                      favLoading={favoriteLoading[vehicle.id]}
                      onToggleFav={toggleFavorite}
                      onView={(id) => navigate(`/vehicles/${id}`)}
                      viewMode={viewMode}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && !error && sortedVehicles.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-20 text-center shadow-sm dark:border-slate-800/60 dark:bg-slate-900">
                <div className="rounded-full bg-[#c99b43]/10 p-5">
                  <Car className="h-10 w-10 text-[#c99b43]/60" />
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
      </section>

      {/* Mobile/Tablet Left-side Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-[65] bg-slate-950/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Vehicle Filters"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-[70] flex w-[min(88vw,22rem)] max-w-full flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c99b43]/10 text-[#c99b43]">
                    <Filter className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Filters</h2>
                    {activeFilterCount > 0 && (
                      <p className="text-[11px] font-medium text-[#c99b43]">{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
                <VehicleSidebarFilters
                  filters={filters}
                  setFilters={setFilters}
                  onClearAll={handleClearAll}
                  onFilterSelect={() => setIsFilterOpen(false)}
                />
              </div>

              <div className="border-t border-slate-200/80 bg-slate-50/80 p-4 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/90">
                <div className="flex gap-2">
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleClearAll}
                      className="rounded-xl border-slate-200 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                    >
                      Reset
                    </Button>
                  )}
                  <Button
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#c99b43] to-[#f3c96d] py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:opacity-95"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Show Results ({sortedVehicles.length})
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}

export default Vehicles
