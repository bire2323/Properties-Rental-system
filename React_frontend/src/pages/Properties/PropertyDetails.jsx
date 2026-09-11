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
import { getAllProperties, getPropertyById, addFavorite, removeFavorite, rateProperty, submitPropertyReview } from '../../api/property/propertyApi'
import { useAuth } from '../../hooks/useAuth'
import ShareButton from '../../components/common/ShareButton'

// ─── Map API Property to Card Format ──────────────────────────────
function mapPropertyToCard(property) {
  const images = property.images || []
  const mainImageUrl = images.length > 0
    ? (getImageUrl(images[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800')
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
    images: images.map((img) => getImageUrl(img)).filter(Boolean),
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
    status: property.status === 'active' ? 'For Rent' : property.status === 'rented' ? 'Rented' : 'Not Available',
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
    category: property.category || null,
    // Car specific fields
    brand: detail.brand || '',
    model: detail.model || '',
    year: detail.year || '',
    mileage: detail.mileage || '',
    fuel_type: detail.fuel_type || '',
    seating_capacity: detail.seating_capacity || '',
    reviews: property.reviews || [],
  }
}

function mapSimilarProperty(property) {
  const image = property.main_image?.image || property.images?.[0]?.image || property.images?.[0]?.image_url
  const detail = property.house_detail || {}
  const price = Number(property.price || 0).toLocaleString('en-US')

  return {
    id: property.id,
    image: image ? getImageUrl(image) : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
    title: property.property_name || 'Property',
    location: [property.city_name, property.region_name, property.kebele].filter(Boolean).join(', ') || 'Location Unspecified',
    price,
    rentalUnit: property.rental_unit || 'monthly',
    beds: detail.bedrooms ?? '-',
    baths: detail.bathrooms ?? '-',
    area: detail.area_sqft ?? '-',
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
  const [reviewText, setReviewText] = useState('')
  const [isReviewLoading, setIsReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [similarProperties, setSimilarProperties] = useState([])
  const [similarPropertiesLoading, setSimilarPropertiesLoading] = useState(false)
  const [showReviewDrawer, setShowReviewDrawer] = useState(false)
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

  useEffect(() => {
    if (!property?.listing_type || !property.category?.id) {
      return
    }

    let active = true
    getAllProperties({ type: property.listing_type, category: property.category.id })
      .then((data) => {
        if (!active) return
        const results = Array.isArray(data) ? data : data.results || []
        setSimilarProperties(
          results
            .filter((item) => (
              String(item.id) !== String(property.id) &&
              String(item.category?.id || item.category_id) === String(property.category.id)
            ))
            .slice(0, 4)
            .map(mapSimilarProperty)
        )
      })
      .catch((err) => console.error('Failed to load similar properties:', err))
      .finally(() => {
        if (active) setSimilarPropertiesLoading(false)
      })

    return () => { active = false }
  }, [property])

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

  const handleImageMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100))
    setZoomOrigin(`${x}% ${y}%`)
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

  const handleReviewSubmit = async (event) => {
    event.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!reviewText.trim() || isReviewLoading) return

    try {
      setIsReviewLoading(true)
      setReviewError('')
      await submitPropertyReview(property.id, reviewText)
      const data = await getPropertyById(property.id)
      if (data) setProperty(mapPropertyToCard(data))
      setReviewText('')
    } catch (err) {
      setReviewError(err.message || 'Failed to save your review.')
    } finally {
      setIsReviewLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />

        {/* Top Navigation skeleton */}
        <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-screen-2xl lg:mx-10 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-8 dark:bg-slate-900">
          <div className="mx-auto max-w-screen-2xl lg:mx-10 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Main image skeleton */}
              <div className="relative flex-1 lg:flex-[2]">
                <div className="h-96 w-full animate-pulse rounded-l-[28px] bg-gradient-to-br from-slate-200 to-slate-100 md:h-[400px] lg:h-[400px] dark:from-slate-800 dark:to-slate-800/50" />
              </div>

              {/* Thumbnails skeleton */}
              <div className="grid flex-1 grid-cols-2 gap-3 lg:flex-[1]">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 w-full animate-pulse rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-800/50"
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              {/* Main content skeleton */}
              <div className="lg:col-span-2">
                <div className="h-6 w-3/5 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-4 w-1/3 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60" />
                  ))}
                </div>
                <div className="mt-8 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-4 w-11/12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-4 w-4/5 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>

              {/* Booking card skeleton */}
              <div className="h-80 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/40" />
            </div>
          </div>
        </section>

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
        <div className="mx-auto max-w-screen-2xl lg:mx-10 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/properties')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Properties
            </Button>
            <div className="flex items-center gap-2 ">
              <Button
                variant="outline"
                size="icon"
                onClick={handleFavoriteClick}
                disabled={isFavoriteLoading}
                className={isFavorite ? 'border-red-500 text-red-500 w-fit p-1' : 'w-fit p-1'}
              >
                {isFavoriteLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className='text-[11px]'>save</span>
                  </>
                ) : (
                  <>
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} />
                    <span className='text-[11px]'>save</span>
                  </>
                )}
              </Button>
              <div className='flex'>
                <ShareButton propertyId={property.id} title={property.title} />
              </div>
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

      <section className="bg-slate-50/70 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10 lg:mx-10">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* ─── Main Image ────────────────────────────────────────────── */}
            <div
              className="group relative flex-1 cursor-zoom-in overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] transition-shadow duration-500 hover:shadow-[0_32px_100px_rgba(201,155,67,0.18)] dark:border-slate-800 dark:bg-slate-900 lg:flex-[2]"
              onMouseMove={handleImageMove}
              onMouseLeave={() => setZoomOrigin('50% 50%')}
            >
              <img
                src={property.images[selectedImage] || property.mainImage}
                alt={property.title}
                className="h-96 w-full object-cover transition-transform duration-[220ms] ease-out will-change-transform group-hover:scale-[1.80] md:h-[520px] lg:h-[560px]"
                style={{ transformOrigin: zoomOrigin }}
                onClick={() => setLightboxOpen(true)}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%, rgba(201,155,67,0.08) 100%)' }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
              <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition-all duration-300 group-hover:scale-105 group-hover:bg-white dark:bg-slate-900/80 dark:text-white dark:group-hover:bg-slate-800">
                {selectedImage + 1} / {property.images.length} Photos
              </div>
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 translate-x-2 rounded-full bg-white/90 p-2 shadow-lg opacity-0 transition-all duration-300 ease-out hover:scale-110 hover:bg-white group-hover:translate-x-0 group-hover:opacity-100 dark:bg-slate-900/90 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 -translate-x-2 rounded-full bg-white/90 p-2 shadow-lg opacity-0 transition-all duration-300 ease-out hover:scale-110 hover:bg-white group-hover:translate-x-0 group-hover:opacity-100 dark:bg-slate-900/90 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* ─── Thumbnail Grid ────────────────────────────────────────── */}
            {property.images.length > 1 && (
              <div className="grid flex-1 grid-cols-2 gap-3 rounded-[2rem] lg:flex-[1]">
                {property.images.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`group/thumb relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${selectedImage === index
                      ? 'border-[#c99b43] shadow-lg shadow-[#c99b43]/20 scale-[1.02]'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    <img
                      src={img}
                      alt={`View ${index + 1}`}
                      className="h-44 w-full object-cover transition-transform duration-500 ease-out group-hover/thumb:scale-110 md:h-full lg:h-[270px]"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/thumb:bg-black/10" />
                    {index === 3 && property.images.length > 4 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white backdrop-blur-sm transition-all duration-300 group-hover/thumb:bg-black/40">
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
      <section className="bg-white py-12 dark:bg-slate-900">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* ─── Property Info Card ────────────────────────────── */}
              <Card className="relative overflow-hidden rounded-[2rem] border-slate-200/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950 md:p-8">
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
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
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
                  <div className="flex flex-col items-end gap-2">
                    {/* Average rating display */}
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#c99b43] text-[#c99b43]" />
                      <span className="text-base font-bold text-slate-900 dark:text-white">{Number(property.rating).toFixed(1)}</span>
                      <span className="text-xs text-slate-400">/ 5</span>
                    </div>
                    <p className="text-xs text-slate-500">{property.rating_summary?.rating_count || 0} ratings</p>
                    {/* Interactive user rating stars (compact) */}
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[11px] text-slate-400">
                        {property.rating_summary?.user_rating ? 'Your rating:' : 'Rate this:'}
                      </p>
                      <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 cursor-pointer transition-colors ${(hoverRating || property.rating_summary?.user_rating) >= star
                              ? 'fill-[#c99b43] text-[#c99b43]'
                              : 'text-slate-300 dark:text-slate-600'
                              }`}
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => handleRating(star)}
                          />
                        ))}
                      </div>
                    </div>
                    {/* View Reviews button */}
                    <button
                      onClick={() => setShowReviewDrawer(true)}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-[#c99b43] px-3 py-1.5 text-xs font-semibold text-[#c99b43] transition hover:bg-[#c99b43] hover:text-white"
                    >
                      <Star className="h-3 w-3" />
                      View Reviews ({property.reviews.length})
                    </button>
                  </div>
                </div>

                {/* ─── Stats Grid ──────────────────────────────────── */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {/* Price Card (always visible) */}
                  <div className="rounded-xl border border-[#c99b43]/20 bg-gradient-to-br from-[#fff7e8] to-white p-4 shadow-sm dark:border-[#c99b43]/20 dark:from-[#1e1a11] dark:to-slate-900">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Price ({property.rental_unit})</p>
                    <p className="mt-1 text-2xl font-bold text-[#c99b43]">{property.price}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">ETB / {property.rental_unit}</p>
                  </div>

                  {/* ─── House-specific stats ────────────────────── */}
                  {isHouse ? (
                    <>
                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Bed className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.beds}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Bedrooms</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Bath className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.baths}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Bathrooms</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Maximize2 className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.area} m²</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Area</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
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
                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Car className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.brand || '-'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Brand</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Settings2 className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.model || '-'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Model</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-[#c99b43]" />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{property.year || '-'}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Year</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
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
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isHouse ? 'About the House' : 'About the Vehicle'}</h2>
                  <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                      {property.description}
                    </p>
                  </div>
                </div>

                {/* Reviews section removed — opens in side drawer */}


                {/* ─── Additional Info ────────────────────────────────── */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
                  {/* Show Furnished only for houses */}
                  {isHouse && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
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
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isHouse ? 'House Features & Amenities' : 'Vehicle Features & Amenities'}</h2>
                  {property.features?.length ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {property.features.map((feature) => {
                        const Icon = getFeatureIcon(feature.name)
                        return (
                          <div
                            key={feature.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-[#c99b43]/50 hover:shadow-sm dark:border-slate-800"
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
              <div className="sticky top-28 space-y-6">
                <Card className="rounded-[2rem] border-slate-200/70 bg-slate-50/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/80">
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
                <div className="w-full rounded-[2rem] border border-[#c99b43]/50 bg-gradient-to-br from-[#fff8eb] via-white to-[#fff1cc] p-7 shadow-[0_20px_55px_rgba(201,155,67,0.16)] dark:border-[#c99b43]/40 dark:from-[#241d10] dark:via-slate-900 dark:to-[#17120a]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b98227] dark:text-[#f3c96d]">Ready to move in?</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Reserve this home</h2>
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

      {property.category?.id && (similarPropertiesLoading || similarProperties.length > 0) && (
        <section className="border-t border-slate-200/80 bg-white py-10 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c99b43]">More to explore</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Similar {property.type}s</h2>
              </div>
              <Button variant="outline" onClick={() => navigate('/properties')}>View all</Button>
            </div>
            {similarPropertiesLoading ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {similarProperties.map((item) => (
                  <Card key={item.id} className="group overflow-hidden border-slate-200/70 bg-white p-0 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,155,67,0.15)] dark:border-slate-800 dark:bg-slate-950">
                    <div className="relative overflow-hidden">
                      <img src={item.image} alt={item.title} className="h-44 w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.15]" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                    <div className="p-4">
                      <h3 className="truncate font-semibold text-slate-900 transition-colors duration-300 group-hover:text-[#c99b43] dark:text-white">{item.title}</h3>
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{item.location}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="font-bold text-[#c99b43]">ETB {item.price}<span className="ml-1 text-xs font-normal text-slate-400">/ {item.rentalUnit}</span></p>
                        <Button size="sm" onClick={() => navigate(`/properties/${item.id}`)} className="bg-[#c99b43] text-slate-950 transition-all duration-300 hover:scale-105 hover:bg-[#b88a35]">View</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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

      {/* ─── Reviews Side Drawer ─── */}
      {showReviewDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowReviewDrawer(false)}
          />
          {/* Drawer panel */}
          <div
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950"
            style={{ animation: 'slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)' }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reviews</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {property.reviews.length} {property.reviews.length === 1 ? 'review' : 'reviews'} · ⭐ {Number(property.rating).toFixed(1)} / 5
                </p>
              </div>
              <button
                onClick={() => setShowReviewDrawer(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Review list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {property.reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Star className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No reviews yet</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to share your experience below</p>
                </div>
              ) : (
                property.reviews.map((review) => {
                  const initials = (review.user_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={review.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c99b43] to-[#e6b955] text-xs font-bold text-white shadow-sm">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{review.user_name}</p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{review.review_text}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Write a review (pinned at bottom) */}
            <div className="border-t border-slate-100 bg-gradient-to-br from-[#fffbf0] to-white px-5 py-4 dark:border-slate-800 dark:from-[#1a1608] dark:to-slate-950">
              <p className="text-xs font-bold uppercase tracking-wider text-[#c99b43] mb-2">Write a Review</p>
              <form onSubmit={async (e) => { await handleReviewSubmit(e); }}>
                <div className="relative">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={user ? 'Share your experience...' : 'Sign in to write a review'}
                    disabled={!user || isReviewLoading}
                    maxLength={500}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#c99b43] focus:ring-2 focus:ring-[#c99b43]/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">{reviewText.length}/500</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  {reviewError
                    ? <p className="text-xs text-red-500">⚠ {reviewError}</p>
                    : <span />
                  }
                  <Button
                    type="submit"
                    disabled={!user || !reviewText.trim() || isReviewLoading}
                    className="shrink-0 rounded-xl bg-[#c99b43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b48738] disabled:opacity-50"
                  >
                    {isReviewLoading ? 'Saving...' : 'Submit'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default PropertyDetails