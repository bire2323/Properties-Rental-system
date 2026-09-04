import { useState, useEffect } from 'react'
import { ArrowRight, Building2, CheckCircle, Key, MapPin, Search, Shield, Star, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import Testimonials from '../../components/common/Testimonials'
import { useAuth } from '../../hooks/useAuth'
import { getAllProperties } from '../../api/property/propertyApi'
import { getImageUrl } from '../../api/mediaHelper'

const heroImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000'
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'

const features = [
  {
    icon: Search,
    title: 'Easy Search',
    description: 'Find your dream property with advanced filters and smart recommendations.',
  },
  {
    icon: Shield,
    title: 'Verified Listings',
    description: 'All properties verified and inspected for quality and authenticity.',
  },
  {
    icon: Key,
    title: 'Instant Booking',
    description: 'Book instantly with secure payments and digital contracts.',
  },
  {
    icon: TrendingUp,
    title: 'Best Prices',
    description: 'Competitive pricing and exclusive deals on premium properties.',
  },
]

// ─── Map a raw backend property to what the card JSX expects ────────────────
// Mirrors the same pattern used in Properties.jsx — single source of truth.
function mapProperty(p) {
  const imageUrl = getImageUrl(p.main_image) || FALLBACK_IMAGE

  const isHouse = p.listing_type === 'house'
  const detail = isHouse ? (p.house_detail || {}) : (p.car_detail || {})

  const beds = isHouse ? (detail.bedrooms ?? null) : null
  const baths = isHouse ? (detail.bathrooms ?? null) : null
  const area = isHouse ? (detail.area_sqft ?? null) : null

  const priceNum = parseFloat(p.price) || 0
  const priceFormatted = priceNum.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const location = [p.city_name, p.region_name, p.kebele].filter(Boolean).join(', ') || 'Location Unspecified'

  const averageRating = p.rating_summary?.average_rating ?? null

  return {
    id: p.id,
    image: imageUrl,
    title: p.property_name,
    location,
    price: priceFormatted,
    rental_unit: p.rental_unit || 'monthly',
    beds,
    baths,
    area,
    rating: averageRating,
    listing_type: p.listing_type,
  }
}

function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ─── Top Properties fetch ─────────────────────────────────────────────────
  const [topProperties, setTopProperties] = useState([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [propertiesError, setPropertiesError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setPropertiesLoading(true)
    setPropertiesError(null)

    // Request only active, available listings — visibility enforced server-side.
    // Slice to 4 client-side (no limit param on the backend).
    getAllProperties({ status: 'active', is_available: 'true' })
      .then((data) => {
        if (cancelled) return
        const raw = Array.isArray(data) ? data : (data?.results ?? [])
        setTopProperties(raw.slice(0, 4).map(mapProperty))
      })
      .catch((err) => {
        if (cancelled) return
        setPropertiesError(err?.message || 'Failed to load properties.')
      })
      .finally(() => {
        if (!cancelled) setPropertiesLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const handlePostProperty = () => {
    if (user) {
      if (user.role === 'tenant') {
        window.open('/become-owner', '_blank')
      } else if (user.role === 'owner') {
        navigate('/owner/properties/add')
      }
    }
    else {
      navigate('/login')
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden pt-24">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Luxury property"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/60 dark:from-slate-950/95 dark:via-slate-950/85 dark:to-slate-950/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
                Find Your Dream
                <span className="mt-2 block bg-gradient-to-r from-[#f3c96d] via-[#c99b43] to-[#b98227] bg-clip-text text-transparent">
                  Property in Ethiopia
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
                Discover premium properties and vehicles for rent across Ethiopia. Your perfect space is just a search away.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-8 text-base font-semibold text-slate-950 hover:opacity-90"
                  onClick={() => navigate('/properties')}
                >
                  Explore Properties
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  onClick={handlePostProperty}
                  size="lg" variant="outline" className="border-2 border-white dark:text-white hover:bg-white hover:text-slate-900">
                  Post Property
                </Button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-10 py-0 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Why Choose NexaSpace?
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Premium features designed to make your property search effortless
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 transition-all hover:shadow-xl hover:-translate-y-1 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800"
              >
                <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-[#c99b43]/20 to-transparent" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c99b43] to-[#f3c96d] text-white shadow-lg">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Properties — real data from backend */}
      <section className="mt-10 py-0 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Featured Properties
              </h2>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
                Handpicked premium properties just for you
              </p>
            </div>
            <Button
              variant="outline"
              className="border-[#c99b43] text-[#c99b43] hover:bg-[#c99b43] hover:text-white"
              onClick={() => navigate('/properties')}
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Loading state — 4 skeleton cards matching card dimensions */}
          {propertiesLoading && (
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-32 sm:h-56 animate-pulse bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2 sm:space-y-3 p-3 sm:p-5">
                    <div className="h-4 sm:h-5 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 sm:h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="flex gap-2 sm:gap-3 border-t border-slate-200 pt-2 sm:pt-3 dark:border-slate-800">
                      <div className="h-3 sm:h-4 w-8 sm:w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 sm:h-4 w-8 sm:w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 sm:h-4 w-10 sm:w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-4 sm:h-6 w-16 sm:w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-7 sm:h-8 w-16 sm:w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!propertiesLoading && propertiesError && (
            <div className="mt-12 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/20">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Could not load properties
                </p>
                <p className="mt-1 text-xs text-red-500 dark:text-red-500">{propertiesError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                  onClick={() => navigate('/properties')}
                >
                  Browse all listings
                </Button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!propertiesLoading && !propertiesError && topProperties.length === 0 && (
            <div className="mt-12 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                  No properties available right now
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Check back soon or browse all listings.
                </p>
                <Button
                  size="sm"
                  className="mt-4 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950 hover:opacity-90"
                  onClick={() => navigate('/properties')}
                >
                  Browse all listings
                </Button>
              </div>
            </div>
          )}

          {/* Property cards — real data */}
          {!propertiesLoading && !propertiesError && topProperties.length > 0 && (
            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {topProperties.map((property) => (
                <Card
                  key={property.id}
                  className="group overflow-hidden rounded-xl sm:rounded-2xl border-slate-200 bg-white transition-all hover:shadow-2xl hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative overflow-hidden h-32 sm:h-56">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE }}
                    />
                    {/* Rating badge — only shown when a rating exists */}
                    {property.rating !== null && (
                      <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-sm dark:bg-slate-900/95">
                        <Star className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-[#c99b43] text-[#c99b43]" />
                        <span className="text-[9px] sm:text-xs font-semibold text-slate-900 dark:text-white">
                          {property.rating}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-5">
                    <h3 className="text-xs sm:text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="mt-1 flex items-center text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                      <MapPin className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </p>

                    {/* House-specific details — only rendered when fields are present */}
                    {property.listing_type === 'house' && (property.beds !== null || property.baths !== null || property.area !== null) && (
                      <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-3 border-t border-slate-200 pt-2 sm:pt-3 text-[9px] sm:text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                        {property.beds !== null && <span>{property.beds} Beds</span>}
                        {property.beds !== null && property.baths !== null && <span>•</span>}
                        {property.baths !== null && <span>{property.baths} Baths</span>}
                        {property.area !== null && <><span className="hidden sm:inline">•</span><span className="truncate max-w-[30px] sm:max-w-none">{property.area} m²</span></>}
                      </div>
                    )}

                    <div className="mt-2 sm:mt-3 flex items-center justify-between">
                      <div className="flex flex-col sm:block">
                        <span className="text-sm sm:text-xl font-bold text-[#c99b43]">
                          {property.price}
                        </span>
                        <span className="text-[9px] sm:text-xs text-slate-600 dark:text-slate-400">
                          {' '}ETB/{property.rental_unit}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#c99b43] to-[#f3c96d] h-7 px-2 sm:px-4 sm:py-2 text-[10px] sm:text-sm text-slate-950 hover:opacity-90"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Testimonials />

      <section className="relative flex overflow-hidden flex-wrap min-h-[70vh] w-full items-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">


        <div className="relative w-full lg:w-1/2 h-[300px] sm:h-[400px] lg:h-[500px] xl:h-[550px] overflow-hidden">

          <div className="absolute -top-4 -left-24 rounded-full bg-gradient-to-br from-[#f3c96d]/10 to-[#c99b43]/5 h-[448px] w-[448px] sm:h-[500px] sm:w-[500px] lg:h-[600px] lg:w-[600px] dark:from-[#f3c96d]/5 dark:to-[#c99b43]/5" />


          <div className="absolute -top-8 -left-16 rounded-full bg-gradient-to-br from-[#f3c96d]/20 to-[#c99b43]/10 h-96 w-96 sm:h-[400px] sm:w-[400px] lg:h-[450px] lg:w-[450px] dark:from-[#f3c96d]/10 dark:to-[#c99b43]/5" />


          <div className="absolute -top-16 -left-10 rounded-full bg-gradient-to-br from-[#c99b43]/30 to-[#f3c96d]/20 h-80 w-80 sm:h-[340px] sm:w-[340px] lg:h-[380px] lg:w-[380px] dark:from-[#c99b43]/20 dark:to-[#f3c96d]/10" />


          <div className="absolute -top-20 -left-5 rounded-full bg-gradient-to-br from-[#b98227]/40 to-[#c99b43]/30 h-60 w-60 sm:h-[280px] sm:w-[280px] lg:h-[320px] lg:w-[320px] dark:from-[#b98227]/30 dark:to-[#c99b43]/20" />

          {/* Small circle - front layer */}
          <div className="absolute -top-28 left-3 rounded-full bg-gradient-to-br from-[#c99b43]/50 to-[#f3c96d]/40 h-44 w-44 sm:h-[200px] sm:w-[200px] lg:h-[240px] lg:w-[240px] dark:from-[#c99b43]/40 dark:to-[#f3c96d]/30" />
        </div>

        {/* RIGHT SIDE - CTA Content */}
        <div className="relative w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start px-4 sm:px-6 lg:px-8 xl:pl-16 py-8 lg:py-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#c99b43]/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-[#c99b43] dark:bg-[#c99b43]/20 mb-3 sm:mb-4">
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Property Owners</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-center lg:text-left text-slate-900 dark:text-white">
            List Your Property
            <span className="mt-1 sm:mt-2 block bg-gradient-to-r from-[#f3c96d] via-[#c99b43] to-[#b98227] bg-clip-text text-transparent">
              & Earn More
            </span>
          </h2>

          {/* Description */}
          <p className="mt-3 sm:mt-4 md:mt-6 text-sm sm:text-base md:text-lg leading-relaxed sm:leading-8 text-center lg:text-left text-slate-600 dark:text-slate-400 max-w-lg">
            Join thousands of property owners who trust us to find the perfect tenants.
            Post your property today and start earning.
          </p>

          {/* Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#c99b43] to-[#f3c96d] px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-slate-950 hover:opacity-90 shadow-lg hover:shadow-xl transition-all dark:text-slate-950"
              onClick={handlePostProperty}
            >
              <Building2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Post Properties
              <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#c99b43] text-[#c99b43] hover:bg-[#c99b43] hover:text-white transition-all px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 text-sm sm:text-base dark:border-[#c99b43] dark:text-[#c99b43] dark:hover:bg-[#c99b43] dark:hover:text-slate-950"
              onClick={() => navigate('/properties')}
            >
              Browse Listings
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#c99b43]" />
              Free to list
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#c99b43]" />
              5K+ active tenants
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#c99b43]" />
              Verified platform
            </span>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Home

