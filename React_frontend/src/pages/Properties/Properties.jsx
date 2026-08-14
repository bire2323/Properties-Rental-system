// src/pages/Properties.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Grid3x3, List, ChevronDown, Loader2,
  AlertCircle, RefreshCw, Building2
} from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { getAllProperties, getFavorites, addFavorite, removeFavorite } from '../../api/property/propertyApi'
import { useAuth } from '../../hooks/useAuth'
import { PropertyFilters } from './PropertyFilters'
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

  const specific = property.specific || {}
  const beds = specific.bedrooms ?? '-'
  const baths = specific.bathrooms ?? '-'
  const area = specific.area_sqft ?? '-'

  const priceNum = parseFloat(property.price) || 0
  const priceFormatted = priceNum.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const typeDisplay =
    property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)

  return {
    id: property.id,
    image: mainImageUrl,
    title: property.title,
    location: property.location,
    price: priceFormatted,
    priceRaw: priceNum,
    beds,
    baths,
    area,
    type: typeDisplay,
    is_available: property.is_available,
    created_at: property.created_at,
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

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [propertyType, setPropertyType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')

  // Data
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Favorites
  const [favorites, setFavorites] = useState([])
  const [favoriteLoading, setFavoriteLoading] = useState({})

  const fetchedRef = useRef(false)

  // ─── Fetch Properties ──────────────────────────────────────────────
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchProperties()
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavorites([])
    }
  }, [user])

  async function fetchProperties() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllProperties()
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

  const typeMap = {
    apartment: 'Apartment',
    house: 'House',
    villa: 'Villa',
    studio: 'Studio',
    condo: 'Condo',
    penthouse: 'Penthouse',
    townhouse: 'Townhouse',
    mansion: 'Mansion',
    commercial: 'Commercial',
    office: 'Office',
    land: 'Land',
    warehouse: 'Warehouse',
    shop: 'Shop',
    car: 'Car',
  }

  const selectedTypeParam = searchParams.get('type')
  if (selectedTypeParam && selectedTypeParam !== 'all') {
    const mappedType = typeMap[selectedTypeParam] || 'all'
    if (mappedType !== propertyType) {
      setPropertyType(mappedType)
    }
  } else if (selectedTypeParam === null && propertyType !== 'all') {
    setPropertyType('all')
  }

  const getPageTitle = () => {
    if (propertyType === 'all') return 'All Properties'
    return `${propertyType}s`
  }


  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = propertyType === 'all' || property.type === propertyType
    const matchesPrice = priceRange === 'all' ||
      (priceRange === 'low' && property.priceRaw < 30000) ||
      (priceRange === 'mid' && property.priceRaw >= 30000 && property.priceRaw < 50000) ||
      (priceRange === 'high' && property.priceRaw >= 50000)

    return matchesSearch && matchesType && matchesPrice
  })

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

      <PropertyFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        propertyType={propertyType}
        setPropertyType={setPropertyType}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        setSearchParams={setSearchParams}
      />

      {/* Toolbar */}
      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
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
            <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 p-1 dark:border-slate-700">
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

      {/* Properties Grid / List */}
      <section className="bg-slate-50 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4' : 'flex flex-col gap-4'}>
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
                  onClick={() => {
                    setSearchTerm('')
                    setPropertyType('all')
                    setPriceRange('all')
                  }}
                  variant="outline"
                  className="mt-6 border-[#c99b43] text-[#c99b43] hover:bg-[#c99b43] hover:text-white"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Properties