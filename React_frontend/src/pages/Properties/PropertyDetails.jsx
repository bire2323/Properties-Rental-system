import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  MapPin, Star, Bed, Bath, Maximize2, Heart, Calendar,
  CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, Car,
  X, Loader2, Fuel, Gauge, Users, Settings2
} from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { getImageUrl } from '../../lib/utils'
import { getFeatureIcon } from '../../lib/featureIcons'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { getPropertyById, addFavorite, removeFavorite, rateProperty } from '../../api/property/propertyApi'
import { useAuth } from '../../hooks/useAuth'
import ShareButton from '../../components/common/ShareButton'

// ─── Map API Property to Card Format ──────────────────────────────
function mapPropertyToCard(property) {
  const images = property.images || []
  const mainImageUrl = images.length > 0
    ? (images[0].image || getImageUrl(images[0].image_url) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800')
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

  const locationDisplay = [property.city_name, property.region_name, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'

  return {
    id: property.id,
    images: images.map(img => img.image || img.image_url),
    mainImage: mainImageUrl,
    title: property.property_name,
    location: locationDisplay,
    address: property.address || locationDisplay,
    price: priceFormatted,
    priceRaw: priceNum,
    rental_unit: property.rental_unit || 'monthly',
    beds,
    baths,
    area,
    type: typeDisplay,
    status: property.status === 'active' ? 'For Rent' : 'Not Available',
    is_favorite: property.is_favorite || false,
    rating_summary: property.rating_summary || { average_rating: 4.5, rating_count: 0, user_rating: null },
    rating: property.rating_summary?.average_rating || 4.5,
    furnished: detail.furnishing || 'Standard',
    propertyId: `NX-${String(property.id).padStart(4, '0')}`,
    datePosted: property.created_at
      ? new Date(property.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : 'Recently',
    features: property.features || [],
    parking: detail.has_garage ? 1 : (property.listing_type === 'car' ? 0 : 1),
    description: property.description || 'No description available.',
    owner: {
      name: property.company?.name || property.owner_email || 'Owner',
      photo: property.company?.logo
        ? (typeof property.company.logo === 'string' ? property.company.logo : property.company.logo.image || '')
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(property.owner_email || 'Owner')}&size=200&background=c99b43&color=fff`,
      phone: property.company?.contact_phone || property.owner?.phone_number || '+251 911 000 000',
      email: property.company?.contact_email || property.owner_email || 'owner@nexaspace.com',
      isCompany: !!property.company
    },
    detail: detail,
    listing_type: property.listing_type,
    // Car specific fields
    brand: detail.brand || '',
    model: detail.model || '',
    year: detail.year || '',
    mileage: detail.mileage || '',
    fuel_type: detail.fuel_type || '',
    seating_capacity: detail.seating_capacity || '',
  }
}

// ─── Main Component ────────────────────────────────────────────────
function PropertyDetails() {
  const navigate = useNavigate();
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [isRatingLoading, setIsRatingLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const { user } = useAuth()

  // ─── Fetch Property ──────────────────────────────────────────────
  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setError('Property ID is missing')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getPropertyById(id)

        if (data) {
          const formatted = mapPropertyToCard(data)
          setProperty(formatted)
          setIsFavorite(formatted.is_favorite)
        } else {
          setError('Property not found')
        }
      } catch (err) {
        console.error('Error fetching property:', err)
        setError(err.message || 'Failed to load property details')
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [id])

  // ─── Image Navigation ─────────────────────────────────────────────
  const nextImage = () => {
    if (property?.images?.length) {
      setSelectedImage((prev) => (prev + 1) % property.images.length)
    }
  }

  const prevImage = () => {
    if (property?.images?.length) {
      setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length)
    }
  }

  // ─── Interaction Handlers ──────────────────────────────────────────
  const handleFavoriteClick = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (isFavoriteLoading) return

    try {
      setIsFavoriteLoading(true)
      if (isFavorite) {
        await removeFavorite(property.id)
        setIsFavorite(false)
        setProperty(prev => ({ ...prev, is_favorite: false }))
      } else {
        await addFavorite(property.id)
        setIsFavorite(true)
        setProperty(prev => ({ ...prev, is_favorite: true }))
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err)
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  const handleRating = async (ratingValue) => {
    if (!user) {
      navigate('/login')
      return
    }
    if (isRatingLoading) return

    try {
      setIsRatingLoading(true)

      setProperty(prev => ({
        ...prev,
        rating_summary: {
          ...prev.rating_summary,
          user_rating: ratingValue
        }
      }))

      await rateProperty(property.id, ratingValue)

      const data = await getPropertyById(property.id)
      if (data) {
        setProperty(mapPropertyToCard(data))
      }

    } catch (err) {
      console.error('Failed to rate property', err)
    } finally {
      setIsRatingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#c99b43]" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading property details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex h-[70vh] flex-col items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
              <X className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Property Not Found</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{error || 'The property does not exist.'}</p>
            <Button
              onClick={() => navigate('/properties')}
              className="mt-6 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const isHouse = property.listing_type === 'house'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {/* ─── Top Navigation ────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/properties')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Properties
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleFavoriteClick}
                disabled={isFavoriteLoading}
                className={isFavorite ? 'border-red-500 text-red-500' : ''}
              >
                {isFavoriteLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} />
                )}
              </Button>
              <ShareButton propertyId={property.id} title={property.title} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Image Gallery ──────────────────────────────────────────── */}
      {/* <section className="bg-white py-8 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative cursor-pointer overflow-hidden rounded-[28px] border border-slate-200/70 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800">
            <img
              src={property.images[selectedImage] || property.mainImage}
              alt={property.title}
              className="h-96 w-full object-cover md:h-[500px]"
              onClick={() => setLightboxOpen(true)}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
            <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur dark:bg-slate-900/80 dark:text-white">
              {selectedImage + 1} / {property.images.length} Photos
            </div>
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white dark:bg-slate-900/90"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white dark:bg-slate-900/90"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          {property.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4 md:grid-cols-6">
              {property.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`overflow-hidden rounded-lg border-2 transition-all ${selectedImage === index
                    ? 'border-[#c99b43]'
                    : 'border-transparent hover:border-slate-300'
                    }`}
                >
                  <img
                    src={img}
                    alt={`View ${index + 1}`}
                    className="h-20 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section> */}

      <section className="bg-white py-8 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* ─── Main Image ────────────────────────────────────────────── */}
            <div className="relative flex-1 cursor-pointer overflow-hidden rounded-l-[28px] border border-slate-200/70 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 lg:flex-[2]">
              <img
                src={property.images[selectedImage] || property.mainImage}
                alt={property.title}
                className="h-96 w-full object-cover md:h-[400px] lg:h-[400px]"
                onClick={() => setLightboxOpen(true)}
              />
              {/* Gradient overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
              {/* Photo count badge */}
              <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur dark:bg-slate-900/80 dark:text-white">
                {selectedImage + 1} / {property.images.length} Photos
              </div>
              {/* Navigation arrows */}
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white dark:bg-slate-900/90"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white dark:bg-slate-900/90"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* ─── Thumbnail Grid ────────────────────────────────────────── */}
            {property.images.length > 1 && (
              <div className="grid flex-1 grid-cols-2 lg:flex-[1] rounded-r-xl border">
                {property.images.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative overflow-hidden  border-2 transition-all ${selectedImage === index
                      ? 'border-[#c99b43] shadow-lg shadow-[#c99b43]/20'
                      : 'border-transparent hover:border-slate-300'
                      }`}
                  >
                    <img
                      src={img}
                      alt={`View ${index + 1}`}
                      className="h-28 w-full object-cover md:h-full lg:h-40"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    {/* If there are more than 4 images, show a "+N" overlay on the last thumbnail */}
                    {index === 3 && property.images.length > 4 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white backdrop-blur-sm">
                        +{property.images.length - 4}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Main Content ───────────────────────────────────────────── */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* ─── Property Info Card ────────────────────────────── */}
              <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95 md:p-8">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${property.status === 'For Rent'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-blue-500 text-white'
                        }`}>
                        {property.status}
                      </span>
                      <span className="rounded-full bg-[#c99b43]/10 px-3 py-1 text-sm font-semibold text-[#c99b43]">
                        {property.type}
                      </span>
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                      {property.title}
                    </h1>
                    <p className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="h-5 w-5" />
                      {property.location}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                      {property.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="h-5 w-5 fill-[#c99b43] text-[#c99b43]" />
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {property.rating}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {property.rating_summary?.rating_count || 0} ratings
                    </p>
                    <div className="flex flex-col items-end">
                      <p className="text-xs text-slate-500 mb-1">
                        {property.rating_summary?.user_rating ? 'Your rating:' : 'Rate this:'}
                      </p>
                      <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 cursor-pointer transition-colors ${(hoverRating || property.rating_summary?.user_rating) >= star
                              ? 'fill-[#c99b43] text-[#c99b43]'
                              : 'text-slate-300 dark:text-slate-600'
                              }`}
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => handleRating(star)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Stats Grid ──────────────────────────────────── */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {/* Price Card (always visible) */}
                  <div className="rounded-2xl border border-[#c99b43]/20 bg-gradient-to-br from-[#fff7e8] to-white p-5 shadow-sm dark:border-[#c99b43]/20 dark:from-[#1e1a11] dark:to-slate-900">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Price ({property.rental_unit})</p>
                    <p className="mt-2 text-3xl font-bold text-[#c99b43]">{property.price}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ETB / {property.rental_unit}</p>
                  </div>

                  {/* ─── House-specific stats ────────────────────── */}
                  {isHouse ? (
                    <>
                      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Bed className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.beds}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Bedrooms</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Bath className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.baths}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Bathrooms</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Maximize2 className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.area} m²</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Area</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Car className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.parking}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Parking</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // ─── Car-specific stats ──────────────────────
                    <>
                      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Car className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.brand || '-'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Brand</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Settings2 className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.model || '-'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Model</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.year || '-'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Year</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Gauge className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.mileage || '-'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Mileage</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* ─── Description ──────────────────────────────────── */}
                <div className="mt-10">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{isHouse ? 'About the House' : 'About the Vehicle'}</h2>
                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                      {property.description}
                    </p>
                  </div>
                </div>

                {/* ─── Additional Info ────────────────────────────────── */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {/* Show Furnished only for houses */}
                  {isHouse && (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Furnished</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{property.furnished}</p>
                      </div>
                    </div>
                  )}

                  {/* Show Fuel Type and Seating Capacity for cars */}
                  {!isHouse && property.fuel_type && (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <Fuel className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Fuel Type</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{property.fuel_type}</p>
                      </div>
                    </div>
                  )}

                  {!isHouse && property.seating_capacity && (
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                      <Users className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Seating</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{property.seating_capacity}</p>
                      </div>
                    </div>
                  )}

                  {/* Common fields */}
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Property ID</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{property.propertyId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Date Posted</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{property.datePosted}</p>
                    </div>
                  </div>
                </div>

                {/* ─── Features ────────────────────────────────────── */}
                <div className="mt-10">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{isHouse ? 'House Features & Amenities' : 'Vehicle Features & Amenities'}</h2>
                  {property.features?.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {property.features.map((feature) => {
                        const Icon = getFeatureIcon(feature.name)
                        return (
                          <div
                            key={feature.id}
                            className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-[#c99b43]/50 hover:shadow-sm dark:border-slate-800"
                          >
                            <Icon className="h-5 w-5 text-[#c99b43]" />
                            <span className="text-slate-700 dark:text-slate-300">{feature.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 text-slate-600 dark:text-slate-400">No features available for this property.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* ─── Sidebar ───────────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                <Card className="border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Property Snapshot</h3>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Availability</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{property.status}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Category</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{property.type}</span>
                    </div>
                    {isHouse && (
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Furnished</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{property.furnished}</span>
                      </div>
                    )}
                    {!isHouse && property.fuel_type && (
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Fuel Type</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{property.fuel_type}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Rating</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{property.rating} / 5</span>
                    </div>
                  </div>
                </Card>

                {/* Booking Card */}
                <div className="w-full rounded-xl border-2 border-[#c99b43] bg-white p-6 shadow-xl dark:bg-slate-900">
                  <h2 className="text-2xl font-bold text-[#c99b43]">BOOKING CARD</h2>
                  <p className="mt-2 text-slate-700 dark:text-slate-300">Rent ({property.rental_unit})</p>
                  <p className="mt-1 text-2xl font-bold text-[#c99b43]">
                    ETB {property.price}
                    <span className="ml-1 text-sm font-normal">/ {property.rental_unit}</span>
                  </p>
                  <Button
                    disabled={property.status !== 'For Rent'}
                    onClick={() => {
                      if (!user) {
                        navigate('/login', { state: { from: `/properties/${property.id}/book` } })
                        return
                      }
                      navigate(`/properties/${property.id}/book`)
                    }}
                    className="mt-5 w-full bg-[#c99b43] text-white hover:bg-[#b88a35]"
                  >
                    {property.status === 'For Rent' ? 'Book Now' : 'Currently Unavailable'}
                  </Button>
                  <Button variant="outline" className="mt-3 w-full">Contact Owner</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <img
            src={property.images[selectedImage]}
            alt={property.title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={nextImage}
            className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {selectedImage + 1} / {property.images.length}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default PropertyDetails