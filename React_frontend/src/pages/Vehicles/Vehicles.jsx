import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Car, MapPin, Search, SlidersHorizontal, Star, Heart, Grid3x3, List, ChevronDown, Fuel, Users, Settings2 } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

// Sample vehicles data
const allVehicles = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800',
    name: 'Toyota Corolla',
    type: 'sedan',
    location: 'Bole, Addis Ababa',
    price: '3,500',
    seats: 5,
    fuel: 'Petrol',
    rating: 4.8,
    transmission: 'Automatic',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=800',
    name: 'Hyundai Tucson',
    type: 'suv',
    location: 'CMC, Addis Ababa',
    price: '5,200',
    seats: 5,
    fuel: 'Diesel',
    rating: 4.9,
    transmission: 'Automatic',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800',
    name: 'Honda Fit',
    type: 'hatchback',
    location: 'Sarbet, Addis Ababa',
    price: '2,900',
    seats: 5,
    fuel: 'Petrol',
    rating: 4.6,
    transmission: 'Manual',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800',
    name: 'Ford Ranger',
    type: 'pickup-truck',
    location: 'Megenagna, Addis Ababa',
    price: '6,400',
    seats: 5,
    fuel: 'Diesel',
    rating: 4.7,
    transmission: 'Manual',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800',
    name: 'Yamaha NMAX',
    type: 'scooter',
    location: 'Kazanchis, Addis Ababa',
    price: '1,600',
    seats: 2,
    fuel: 'Petrol',
    rating: 4.5,
    transmission: 'Automatic',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?q=80&w=800',
    name: 'Mercedes Sprinter',
    type: 'van',
    location: 'Piassa, Addis Ababa',
    price: '7,200',
    seats: 12,
    fuel: 'Diesel',
    rating: 5.0,
    transmission: 'Automatic',
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800',
    name: 'BMW X5',
    type: 'suv',
    location: '4 Kilo, Addis Ababa',
    price: '8,500',
    seats: 7,
    fuel: 'Petrol',
    rating: 4.9,
    transmission: 'Automatic',
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800',
    name: 'Audi A4',
    type: 'sedan',
    location: 'Old Airport, Addis Ababa',
    price: '4,800',
    seats: 5,
    fuel: 'Petrol',
    rating: 4.7,
    transmission: 'Automatic',
  },
  {
    id: 9,
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800',
    name: 'Isuzu D-Max',
    type: 'pickup-truck',
    location: 'Lebu, Addis Ababa',
    price: '5,900',
    seats: 5,
    fuel: 'Diesel',
    rating: 4.8,
    transmission: 'Manual',
  },
]

const typeLabels = {
  sedan: 'Sedan',
  suv: 'SUV',
  hatchback: 'Hatchback',
  coupe: 'Coupe',
  convertible: 'Convertible',
  'pickup-truck': 'Pickup Truck',
  van: 'Van',
  minibus: 'Minibus',
  bus: 'Bus',
  motorcycle: 'Motorcycle',
  scooter: 'Scooter',
  bicycle: 'Bicycle',
  truck: 'Truck',
  trailer: 'Trailer',
}

function Vehicles() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [vehicleType, setVehicleType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [favorites, setFavorites] = useState([])

  const typeParam = searchParams.get('type') || 'all'
  if (typeParam !== vehicleType && typeParam !== 'all') {
    setVehicleType(typeParam)
  } else if (typeParam === 'all' && vehicleType !== 'all') {
    setVehicleType('all')
  }

  // Get page title based on vehicle type
  const getPageTitle = () => {
    if (vehicleType === 'all') return 'All Vehicles'
    return typeLabels[vehicleType] ? `${typeLabels[vehicleType]}s` : 'Vehicles'
  }

  // Toggle favorite
  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    )
  }

  // Filter vehicles based on search and filters
  const filteredVehicles = allVehicles.filter((vehicle) => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = vehicleType === 'all' || vehicle.type === vehicleType
    const matchesPrice = priceRange === 'all' ||
      (priceRange === 'low' && parseInt(vehicle.price.replace(/,/g, '')) < 3000) ||
      (priceRange === 'mid' && parseInt(vehicle.price.replace(/,/g, '')) >= 3000 && parseInt(vehicle.price.replace(/,/g, '')) < 6000) ||
      (priceRange === 'high' && parseInt(vehicle.price.replace(/,/g, '')) >= 6000)

    return matchesSearch && matchesType && matchesPrice
  })

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
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
                placeholder="Search by vehicle name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-xl border-slate-300 bg-white pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-slate-400 hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            {/* Vehicle Type - 25% width */}
            <div className="relative flex-1">
              <Car className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <select
                value={vehicleType}
                onChange={(e) => {
                  const nextType = e.target.value
                  setVehicleType(nextType)
                  if (nextType !== 'all') {
                    setSearchParams({ type: nextType })
                  } else {
                    setSearchParams({})
                  }
                }}
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-11 pr-10 text-sm shadow-sm transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
                <option value="coupe">Coupe</option>
                <option value="convertible">Convertible</option>
                <option value="pickup-truck">Pickup Truck</option>
                <option value="van">Van</option>
                <option value="minibus">Minibus</option>
                <option value="bus">Bus</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="scooter">Scooter</option>
                <option value="bicycle">Bicycle</option>
                <option value="truck">Truck</option>
                <option value="trailer">Trailer</option>
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
                <option value="low">Under 3,000 ETB</option>
                <option value="mid">3,000 - 6,000 ETB</option>
                <option value="high">Above 6,000 ETB</option>
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
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-xl border-slate-300 pl-10 pr-4 shadow-sm"
              />
            </div>

            {/* Vehicle Type & Price - Single Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Vehicle Type */}
              <div className="relative">
                <Car className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <select
                  value={vehicleType}
                  onChange={(e) => {
                    const nextType = e.target.value
                    setVehicleType(nextType)
                    if (nextType !== 'all') {
                      setSearchParams({ type: nextType })
                    } else {
                      setSearchParams({})
                    }
                  }}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-8 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="pickup-truck">Pickup Truck</option>
                  <option value="van">Van</option>
                  <option value="scooter">Scooter</option>
                  <option value="motorcycle">Motorcycle</option>
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
                  <option value="low">&lt; 3K</option>
                  <option value="mid">3K - 6K</option>
                  <option value="high">&gt; 6K</option>
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
                <span className="font-bold text-[#c99b43]">{sortedVehicles.length}</span>{' '}
                {sortedVehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Available
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

      {/* Vehicles Grid */}
      <section className="bg-slate-50 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {sortedVehicles.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedVehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Image Container */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Type Badge */}
                    <div className="absolute left-4 top-4">
                      <span className="inline-flex rounded-full bg-[#c99b43] px-3 py-1 text-xs font-semibold text-white shadow-md">
                        {typeLabels[vehicle.type]}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavorite(vehicle.id)}
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900"
                      aria-label="Add to favorites"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${favorites.includes(vehicle.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-slate-600 dark:text-slate-400'
                          }`}
                      />
                    </button>

                    {/* Rating Badge */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 shadow-md backdrop-blur-sm dark:bg-slate-900/95">
                      <Star className="h-3.5 w-3.5 fill-[#c99b43] text-[#c99b43]" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {vehicle.rating}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-[#c99b43] dark:text-white dark:group-hover:text-[#f3c96d]">
                      {vehicle.name}
                    </h3>

                    {/* Location */}
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {vehicle.location}
                    </p>

                    {/* Vehicle Details */}
                    <div className="mt-4 flex items-center gap-4 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{vehicle.seats}</span>
                      </div>
                      <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                      <div className="flex items-center gap-1.5">
                        <Fuel className="h-4 w-4" />
                        <span>{vehicle.fuel}</span>
                      </div>
                      <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                      <div className="flex items-center gap-1.5">
                        <Settings2 className="h-4 w-4" />
                        <span>{vehicle.transmission}</span>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-[#c99b43]">
                          {vehicle.price}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400"> ETB/day</span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-lg bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:shadow-md hover:opacity-90"
                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
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
                <Car className="h-12 w-12 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
                No Vehicles Found
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
                We couldn't find any vehicles matching your search criteria. Try adjusting your filters.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('')
                  setVehicleType('all')
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

export default Vehicles
