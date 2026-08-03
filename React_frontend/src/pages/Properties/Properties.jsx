import { useState, useEffect } from 'react'
import { Building2, MapPin, Search, SlidersHorizontal, Star, Heart, Grid3x3, List, ChevronDown, Bed, Bath, Maximize2 } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

// Sample properties data
const allProperties = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
    title: 'Modern Villa with Pool',
    location: 'Bole, Addis Ababa',
    price: '45,000',
    beds: 4,
    baths: 3,
    area: '320',
    rating: 4.9,
    type: 'Villa',
    status: 'For Rent',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800',
    title: 'Luxury Apartment',
    location: 'Kazanchis, Addis Ababa',
    price: '35,000',
    beds: 3,
    baths: 2,
    area: '180',
    rating: 4.8,
    type: 'Apartment',
    status: 'For Rent',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800',
    title: 'Executive Penthouse',
    location: 'CMC, Addis Ababa',
    price: '65,000',
    beds: 5,
    baths: 4,
    area: '450',
    rating: 5.0,
    type: 'Penthouse',
    status: 'For Sale',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800',
    title: 'Cozy Family House',
    location: '4 Kilo, Addis Ababa',
    price: '28,000',
    beds: 3,
    baths: 2,
    area: '200',
    rating: 4.7,
    type: 'House',
    status: 'For Rent',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=800',
    title: 'Spacious Studio',
    location: 'Sarbet, Addis Ababa',
    price: '18,000',
    beds: 1,
    baths: 1,
    area: '80',
    rating: 4.5,
    type: 'Studio',
    status: 'For Rent',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800',
    title: 'Garden Villa',
    location: 'Old Airport, Addis Ababa',
    price: '52,000',
    beds: 4,
    baths: 3,
    area: '380',
    rating: 4.9,
    type: 'Villa',
    status: 'For Rent',
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?q=80&w=800',
    title: 'Modern Townhouse',
    location: 'Megenagna, Addis Ababa',
    price: '40,000',
    beds: 3,
    baths: 2,
    area: '220',
    rating: 4.6,
    type: 'Townhouse',
    status: 'For Sale',
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=800',
    title: 'Elegant Condo',
    location: 'Lebu, Addis Ababa',
    price: '32,000',
    beds: 2,
    baths: 2,
    area: '150',
    rating: 4.8,
    type: 'Condo',
    status: 'For Rent',
  },
  {
    id: 9,
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=800',
    title: 'Luxury Mansion',
    location: 'Summit, Addis Ababa',
    price: '95,000',
    beds: 6,
    baths: 5,
    area: '600',
    rating: 5.0,
    type: 'Mansion',
    status: 'For Sale',
  },
]

function Properties() {
  const [searchTerm, setSearchTerm] = useState('')
  const [propertyType, setPropertyType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [favorites, setFavorites] = useState([])

  // Get property type from URL on mount and when hash changes
  useEffect(() => {
    const updateFromURL = () => {
      const hash = window.location.hash
      const urlParams = new URLSearchParams(hash.split('?')[1] || '')
      const typeParam = urlParams.get('type')
      
      console.log('URL hash:', hash) // Debug log
      console.log('Type parameter:', typeParam) // Debug log
      
      if (typeParam) {
        // Map URL parameter to property type
        const typeMap = {
          'apartment': 'Apartment',
          'house': 'House',
          'villa': 'Villa',
          'studio': 'Studio',
          'condo': 'Condo',
          'penthouse': 'Penthouse',
          'townhouse': 'Townhouse',
          'mansion': 'Mansion',
          'commercial': 'Commercial',
          'office': 'Office',
          'land': 'Land',
          'warehouse': 'Warehouse',
          'shop': 'Shop',
        }
        const mappedType = typeMap[typeParam] || 'all'
        console.log('Setting property type to:', mappedType) // Debug log
        setPropertyType(mappedType)
      } else {
        console.log('No type parameter, showing all properties') // Debug log
        setPropertyType('all')
      }
    }

    updateFromURL()
    window.addEventListener('hashchange', updateFromURL)
    return () => window.removeEventListener('hashchange', updateFromURL)
  }, [])

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
  const filteredProperties = allProperties.filter((property) => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = propertyType === 'all' || property.type === propertyType
    const matchesPrice = priceRange === 'all' ||
                        (priceRange === 'low' && parseInt(property.price.replace(/,/g, '')) < 30000) ||
                        (priceRange === 'mid' && parseInt(property.price.replace(/,/g, '')) >= 30000 && parseInt(property.price.replace(/,/g, '')) < 50000) ||
                        (priceRange === 'high' && parseInt(property.price.replace(/,/g, '')) >= 50000)
    
    return matchesSearch && matchesType && matchesPrice
  })

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseInt(a.price.replace(/,/g, '')) - parseInt(b.price.replace(/,/g, ''))
      case 'price-high':
        return parseInt(b.price.replace(/,/g, '')) - parseInt(a.price.replace(/,/g, ''))
      case 'popular':
        return b.rating - a.rating
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
                  setPropertyType(e.target.value)
                  // Update URL when filter changes
                  if (e.target.value !== 'all') {
                    const typeParam = e.target.value.toLowerCase()
                    window.location.hash = `properties?type=${typeParam}`
                  } else {
                    window.location.hash = 'properties'
                  }
                }}
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-11 pr-10 text-sm shadow-sm transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="Villa">Villa</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Studio">Studio</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Condo">Condo</option>
                <option value="Mansion">Mansion</option>
                <option value="Commercial">Commercial</option>
                <option value="Office">Office</option>
                <option value="Land">Land</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Shop">Shop</option>
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
                    setPropertyType(e.target.value)
                    // Update URL when filter changes
                    if (e.target.value !== 'all') {
                      const typeParam = e.target.value.toLowerCase()
                      window.location.hash = `properties?type=${typeParam}`
                    } else {
                      window.location.hash = 'properties'
                    }
                  }}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-8 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="Villa">Villa</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Studio">Studio</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Condo">Condo</option>
                  <option value="Mansion">Mansion</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Office">Office</option>
                  <option value="Land">Land</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Shop">Shop</option>
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
                <span className="font-bold text-[#c99b43]">{sortedProperties.length}</span>{' '}
                {sortedProperties.length === 1 ? 'Property' : 'Properties'} Available
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
                  <option value="popular">Most Popular</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 p-1 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-1.5 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#c99b43] text-white'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded p-1.5 transition-colors ${
                    viewMode === 'list'
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
          {sortedProperties.length > 0 ? (
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
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute left-4 top-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-md ${
                        property.status === 'For Rent'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {property.status}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(property.id)}
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900"
                      aria-label="Add to favorites"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          favorites.includes(property.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      />
                    </button>

                    {/* Rating Badge */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 shadow-md backdrop-blur-sm dark:bg-slate-900/95">
                      <Star className="h-3.5 w-3.5 fill-[#c99b43] text-[#c99b43]" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {property.rating}
                      </span>
                    </div>
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

                    {/* Property Details */}
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
                        <span>{property.area} m²</span>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-[#c99b43]">
                          {property.price}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400"> ETB/mo</span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-lg bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:shadow-md hover:opacity-90"
                        onClick={() => (window.location.hash = `property-details?id=${property.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                <Building2 className="h-12 w-12 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                No Properties Found
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                We couldn't find any properties matching your search criteria. Try adjusting your filters.
              </p>
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
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Properties
