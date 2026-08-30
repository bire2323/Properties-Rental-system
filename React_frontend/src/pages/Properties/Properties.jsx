import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid3x3, List, ChevronDown, Loader2,
  AlertCircle, RefreshCw, Building2, Filter, X
} from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { getAllProperties, getFavorites, addFavorite, removeFavorite } from '../../api/property/propertyApi'
import { useAuth } from '../../hooks/useAuth'
import { PropertySidebarFilters } from './PropertySidebarFilters'
import { PropertyCard } from './PropertyCard'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ─── Helpers ──────────────────────────────────────────────────────────

function resolveImageUrl(imagePath) {
  if (!imagePath) return null
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${API_BASE_URL}${imagePath}`
}

function mapPropertyToCard(property) {
  const mainImageUrl = property.main_image?.image
    ? resolveImageUrl(property.main_image.image)
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'

  const isHouse = property.listing_type === 'house'
  const detail = isHouse ? (property.house_detail || {}) : (property.car_detail || {})

  const beds = isHouse ? (detail.bedrooms ?? '-') : '-'
  const baths = isHouse ? (detail.bathrooms ?? '-') : '-'
  const area = isHouse ? (detail.area_sqft ?? '-') : '-'

  const priceNum = parseFloat(property.price) || 0
  const priceFormatted = priceNum.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const typeDisplay = property.listing_type
    ? property.listing_type.charAt(0).toUpperCase() + property.listing_type.slice(1)
    : 'Property'

  const locationDisplay = [property.city, property.region, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'

  return {
    id: property.id,
    image: mainImageUrl,
    title: property.property_name,
    location: locationDisplay,
    price: priceFormatted,
    priceRaw: priceNum,
    rental_unit: property.rental_unit || 'monthly',
    beds,
    baths,
    area,
    type: typeDisplay,
    is_available: property.status === 'active',
    created_at: property.created_at,
    listing_type: property.listing_type,
    features: property.features || [],
  }
}

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="h-56 animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="flex gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="h-4 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

function Properties() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const defaultFilters = {
    search: '',
    location: '',
    type: 'all',
    min_price: 0,
    max_price: 200000,
    bedrooms: 'any',
    is_available: '',
    features: [],
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')

  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [favorites, setFavorites] = useState([])
  const [favoriteLoading, setFavoriteLoading] = useState({})

  const fetchedRef = useRef(false)

  // Debounced fetch for filters
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProperties();
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

  // Sync specific URL params to filters
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam && ['house', 'car', 'all'].includes(typeParam.toLowerCase())) {
      setFilters(prev => ({ ...prev, type: typeParam.toLowerCase() }))
    }
  }, [searchParams])

  async function fetchProperties() {
    setLoading(true)
    setError(null)
    
    // Prepare backend-compatible filters
    const apiFilters = { ...filters };
    if (apiFilters.type === 'all') delete apiFilters.type;
    if (apiFilters.bedrooms === 'any') delete apiFilters.bedrooms;
    if (apiFilters.features && apiFilters.features.length === 0) delete apiFilters.features;
    if (apiFilters.search) {
      // Backend uses location for text search of city/region/address if we want to combine them, or we could pass `location=search`
      // Actually, since we added location dropdown, we can pass both or just map search to a query string.
      // Wait, backend supports `location` for city/address/region. The sidebar now has both search and location.
      // If we pass both, the backend only looks at `location`. Let's map search to a custom param or just merge it into location if backend doesn't support generic search.
      // For now, let's just pass `location: apiFilters.location || apiFilters.search` if we want, or leave it. We'll pass `location` and `search` as they are, but backend might ignore `search`.
      // Actually we can just send `location` if search is set.
      if (!apiFilters.location && apiFilters.search) {
        apiFilters.location = apiFilters.search;
      }
    }
    delete apiFilters.search; // Backend doesn't use `search`
    
    try {
      const data = await getAllProperties(apiFilters)
      const results = Array.isArray(data) ? data : data.results || []
      setProperties(results.map(mapPropertyToCard))
    } catch (err) {
      setError(err.message || 'Failed to load properties.')
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
    (filters.type !== 'all' ? 1 : 0) +
    (filters.min_price > 0 || filters.max_price < 200000 ? 1 : 0) +
    (filters.bedrooms !== 'any' ? 1 : 0) +
    (filters.is_available !== '' ? 1 : 0) +
    (filters.features?.length || 0);

  const getPageTitle = () => {
    if (filters.type === 'all') return 'All Properties'
    return `${(filters.type || '').charAt(0).toUpperCase() + (filters.type || '').slice(1)}s`
  }

  // Client-side filtering is no longer needed!
  const filteredProperties = properties;

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.priceRaw - b.priceRaw
      case 'price-high':
        return b.priceRaw - a.priceRaw
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at)
      default:
        return 0
    }
  })

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {/* Toolbar */}
      <section className="sticky top-20 z-30 border-b border-slate-200 bg-white py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {getPageTitle()}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                {loading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>
                    <span className="font-bold text-[#c99b43]">{sortedProperties.length}</span>{' '}
                    {sortedProperties.length === 1 ? 'Property' : 'Properties'} Available
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#c99b43] text-xs font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-medium transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-300 p-1 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-1.5 transition-colors ${viewMode === 'grid'
                    ? 'bg-[#c99b43] text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded p-1.5 transition-colors ${viewMode === 'list'
                    ? 'bg-[#c99b43] text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <section className="bg-slate-50 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-44 self-start h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar pb-8">
              <PropertySidebarFilters
                filters={filters}
                setFilters={setFilters}
                onClearAll={handleClearAll}
              />
            </aside>

            {/* Content Area */}
            <main className="flex-1 min-w-0">
              {loading && (
                <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/30">
                    <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                    Failed to Load Properties
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                    {error}
                  </p>
                  <Button
                    onClick={fetchProperties}
                    className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950 shadow-sm hover:opacity-90"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              )}

              {!loading && !error && sortedProperties.length > 0 && (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4'}>
                  {sortedProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isFav={favorites.includes(property.id)}
                      isLoading={favoriteLoading[property.id]}
                      toggleFavorite={toggleFavorite}
                      layout={viewMode}
                    />
                  ))}
                </div>
              )}

              {!loading && !error && sortedProperties.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                    <Building2 className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                    No Properties Found
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                    {properties.length === 0
                      ? 'There are no properties listed yet. Check back later!'
                      : "We couldn't find any properties matching your search criteria. Try adjusting your filters."}
                  </p>
                  {properties.length > 0 && (
                    <Button
                      onClick={handleClearAll}
                      variant="outline"
                      className="mt-6 border-[#c99b43] text-[#c99b43] hover:bg-[#c99b43] hover:text-white"
                    >
                      Clear Filters
                    </Button>
                  )}
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
                <PropertySidebarFilters
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
                    Show Results ({sortedProperties.length})
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

export default Properties