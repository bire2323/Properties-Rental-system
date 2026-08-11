import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, MapPin, Search, SlidersHorizontal, Star, Heart, Grid3x3, List, ChevronDown, Bed, Bath, Maximize2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { getAllProperties } from '../../api/property/propertyApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Build a full image URL from the backend response.
 * If the image path is already absolute (http/https), return as-is.
 * Otherwise, prepend the API base URL.
 */
function resolveImageUrl(imagePath) {
  if (!imagePath) return null
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // imagePath from DRF will be like "/media/properties/2026/08/11/photo.jpg"
  return `${API_BASE_URL}${imagePath}`
}

/**
 * Map a single backend property object to the shape the UI cards expect.
 *
 * Backend shape (from PropertySerializer):
 *   { id, owner, owner_email, title, description, price, security_deposit,
 *     property_type, location, main_image, is_available, specific, images,
 *     created_at, updated_at }
 *
 * UI card shape:
 *   { id, image, title, location, price, beds, baths, area, type, is_available, created_at }
 */
function mapPropertyToCard(property) {
  // Resolve the main image — first image by order, or a placeholder
  const mainImageUrl = property.main_image?.image
    ? resolveImageUrl(property.main_image.image)
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'

  // Extract house-specific fields from the nested 'specific' object
  const specific = property.specific || {}
  const beds = specific.bedrooms ?? '-'
  const baths = specific.bathrooms ?? '-'
  const area = specific.area_sqft ?? '-'

  // Format price with commas for display
  const priceNum = parseFloat(property.price) || 0
  const priceFormatted = priceNum.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  // Capitalize property_type for display (e.g. 'house' → 'House')
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

/**
 * Loading skeleton card component that matches the property card layout.
 */
function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
    </Card>
  )
}

function Properties() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [propertyType, setPropertyType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [favorites, setFavorites] = useState([])

  // API state
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch properties from the backend on mount
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchProperties()
    }
  }, [])

  async function fetchProperties() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllProperties()
      // DRF's DefaultRouter returns an array directly from a ViewSet list action.
      // If paginated, results would be in data.results — handle both cases.
      const results = Array.isArray(data) ? data : data.results || []
      setProperties(results.map(mapPropertyToCard))
    } catch (err) {
      setError(err.message || 'Failed to load properties.')
    } finally {
      setLoading(false)
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

  // Get page title based on property type
  const getPageTitle = () => {
    if (propertyType === 'all') return 'All Properties'
    return `${propertyType}s`
  }

  // Toggle favorite
  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    )
  }

  // Filter properties based on search and filters
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

  // Sort properties
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {/* Search and Filter Section - Horizontal Layout */}
      <section className="sticky top-24 z-40 border-b border-slate-200 bg-white py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Desktop: Single Row Layout */}
          <div className="hidden gap-3 lg:flex">
            {/* Search Input - 50% width */}
            <div className="relative flex-[2]">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search by property name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-xl border-slate-300 bg-white pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            {/* Property Type - 25% width */}
            <div className="relative flex-1">
              <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <select
                value={propertyType}
                onChange={(e) => {
                  const nextType = e.target.value
                  setPropertyType(nextType)
                  if (nextType !== 'all') {
                    setSearchParams({ type: nextType.toLowerCase() })
                  } else {
                    setSearchParams({})
                  }
                }}
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-11 pr-10 text-sm shadow-sm transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="House">House</option>
                <option value="Car">Car</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            </div>

            {/* Price Range - 25% width */}
            <div className="relative flex-1">
              <SlidersHorizontal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-11 pr-10 text-sm shadow-sm transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Prices</option>
                <option value="low">Under 30,000 ETB</option>
                <option value="mid">30,000 - 50,000 ETB</option>
                <option value="high">Above 50,000 ETB</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            </div>
          </div>

          {/* Mobile: Optimized Layout */}
          <div className="space-y-3 lg:hidden">
            {/* Search Input - Full Width */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-xl border-slate-300 pl-10 pr-4 shadow-sm"
              />
            </div>

            {/* Property Type & Price - Single Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Property Type */}
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <select
                  value={propertyType}
                  onChange={(e) => {
                    const nextType = e.target.value
                    setPropertyType(nextType)
                    if (nextType !== 'all') {
                      setSearchParams({ type: nextType.toLowerCase() })
                    } else {
                      setSearchParams({})
                    }
                  }}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-8 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="House">House</option>
                  <option value="Car">Car</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Price Range */}
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-8 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Prices</option>
                  <option value="low">&lt; 30K</option>
                  <option value="mid">30K - 50K</option>
                  <option value="high">&gt; 50K</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar - Showing Count & Sort */}
      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Page Title & Count */}
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

            {/* Right: Sort & View Toggle */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
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

              {/* View Toggle */}
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

      {/* Properties Grid */}
      <section className="bg-slate-50 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Loading State */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
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

          {/* Properties List */}
          {!loading && !error && sortedProperties.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProperties.map((property) => (
                <Card
                  key={property.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Image Container */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'
                      }}
                    />

                    {/* Availability Badge */}
                    <div className="absolute left-4 top-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-md ${property.is_available
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-500 text-white'
                        }`}>
                        {property.is_available ? 'Available' : 'Rented'}
                      </span>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute left-4 bottom-4">
                      <span className="inline-flex rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm dark:bg-slate-900/95 dark:text-slate-300">
                        {property.type}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(property.id)}
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900"
                      aria-label="Add to favorites"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${favorites.includes(property.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-slate-600 dark:text-slate-400'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-[#c99b43] dark:text-white dark:group-hover:text-[#f3c96d]">
                      {property.title}
                    </h3>

                    {/* Location */}
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {property.location}
                    </p>

                    {/* Property Details — only show bed/bath/area for houses */}
                    {property.type === 'House' && (
                      <div className="mt-4 flex items-center gap-4 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Bed className="h-4 w-4" />
                          <span>{property.beds}</span>
                        </div>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                        <div className="flex items-center gap-1.5">
                          <Bath className="h-4 w-4" />
                          <span>{property.baths}</span>
                        </div>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                        <div className="flex items-center gap-1.5">
                          <Maximize2 className="h-4 w-4" />
                          <span>{property.area} sqft</span>
                        </div>
                      </div>
                    )}

                    {/* Price & CTA */}
                    <div className={`flex items-center justify-between ${property.type === 'House' ? 'mt-4' : 'mt-4 border-t border-slate-200 pt-4 dark:border-slate-800'}`}>
                      <div>
                        <span className="text-2xl font-bold text-[#c99b43]">
                          {property.price}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400"> ETB/mo</span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-lg bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:shadow-md hover:opacity-90"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State — only show when data is loaded but filters match nothing */}
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
