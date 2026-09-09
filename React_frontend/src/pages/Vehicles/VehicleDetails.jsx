import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapPin, Star, Heart, Share2, Calendar, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, Car, Fuel, Users, Settings2, Wifi, Shield, Camera, Wind, Zap, X, Loader2 } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { getAllProperties, getPropertyById, rateProperty, submitPropertyReview } from '../../api/property/propertyApi'
import { useAuth } from '../../hooks/useAuth'

const featureIcons = {
  'Air Conditioning': Wind,
  'Bluetooth': Wifi,
  'Backup Camera': Camera,
  'GPS Navigation': MapPin,
  'GPS': MapPin,
  'USB Ports': Zap,
  'Power Windows': Zap,
  'ABS Brakes': Shield,
  'Airbags': Shield,
  '4WD': Car,
  'Sunroof': Car,
  'Leather Seats': Car,
  'Parking Sensors': Camera,
  'Cruise Control': Settings2,
  'Power Steering': Settings2
}

function mapSimilarVehicle(property) {
  const detail = property.car_detail || {}
  const image = property.main_image?.image || property.images?.[0]?.image
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const imageUrl = image
    ? (image.startsWith('http') ? image : `${apiBaseUrl}${image.startsWith('/') ? '' : '/'}${image}`)
    : 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800'

  return {
    id: property.id,
    image: imageUrl,
    name: property.property_name || `${detail.brand || 'Vehicle'} ${detail.model || ''}`,
    location: [property.city_name, property.region_name, property.kebele].filter(Boolean).join(', ') || 'Location Unspecified',
    price: Number(property.price || 0).toLocaleString('en-US'),
    rentalUnit: property.rental_unit || 'daily',
  }
}

function mapPropertyToVehicle(property) {
  const detail = property.car_detail || {}
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const images = (property.images || [])
    .map((image) => typeof image === 'string' ? image : image?.image)
    .filter(Boolean)
    .map((image) => image.startsWith('http') ? image : `${apiBaseUrl}${image.startsWith('/') ? '' : '/'}${image}`)

  const ratingSummary = property.rating_summary || { average_rating: 4.5, rating_count: 0, user_rating: null }
  const avg = ratingSummary.average_rating ? Number(ratingSummary.average_rating).toFixed(1) : (property.rating_summary?.average_rating || 4.5)

  return {
    id: property.id,
    images: images.length ? images : ['https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200'],
    name: property.property_name || `${detail.brand || 'Vehicle'} ${detail.model || ''}`,
    type: 'car',
    category: property.category || null,
    location: [property.city_name, property.region_name, property.kebele].filter(Boolean).join(', ') || 'Location Unspecified',
    address: property.address || 'Address unavailable',
    description: property.description || 'No description available.',
    price: Number(property.price || 0).toLocaleString('en-US'),
    rentalUnit: property.rental_unit || 'daily',
    isAvailable: property.is_available && property.status === 'active',
    seats: detail.seating_capacity || '-',
    fuel: detail.fuel_type || '-',
    rating_summary: ratingSummary,
    rating: avg,
    transmission: detail.transmission || 'Not specified',
    year: detail.year || '-',
    color: detail.color || 'Not specified',
    plateNumber: detail.plate_number || 'Not specified',
    mileage: detail.mileage || '-',
    vehicleId: `NX-V-${String(property.id).padStart(4, '0')}`,
    datePosted: property.created_at ? new Date(property.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently',
    features: (property.features || []).map((feature) => typeof feature === 'string' ? feature : feature?.name).filter(Boolean),
    reviews: property.reviews || [],
  }
}

function VehicleDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [isRatingLoading, setIsRatingLoading] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [isReviewLoading, setIsReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [similarVehicles, setSimilarVehicles] = useState([])
  const [similarVehiclesLoading, setSimilarVehiclesLoading] = useState(false)
  const [showReviewDrawer, setShowReviewDrawer] = useState(false)

  const handleRating = async (ratingValue) => {
    if (!user) {
      navigate('/login')
      return
    }
    if (isRatingLoading) return

    try {
      setIsRatingLoading(true)

      setVehicle((prev) => ({
        ...prev,
        rating_summary: {
          ...prev.rating_summary,
          user_rating: ratingValue,
        },
      }))

      await rateProperty(vehicle.id, ratingValue)

      const updated = await getPropertyById(vehicle.id)
      if (updated) {
        setVehicle(mapPropertyToVehicle(updated))
      }
    } catch (err) {
      console.error('Failed to rate vehicle', err)
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
      await submitPropertyReview(vehicle.id, reviewText)
      const updated = await getPropertyById(vehicle.id)
      if (updated) setVehicle(mapPropertyToVehicle(updated))
      setReviewText('')
    } catch (err) {
      setReviewError(err.message || 'Failed to save your review.')
    } finally {
      setIsReviewLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function fetchVehicle() {
      setLoading(true)
      setError(null)
      try {
        const property = await getPropertyById(id)
        if (!active) return
        if (!property || typeof property !== 'object') {
          throw new Error('Vehicle details were not returned by the server.')
        }
        if (property.listing_type !== 'car') {
          setError('This listing is not a vehicle.')
          setVehicle(null)
          return
        }

        setVehicle(mapPropertyToVehicle(property))
      } catch (err) {
        if (active) setError(err.message || 'Failed to load vehicle details.')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (id) fetchVehicle()
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!vehicle?.category?.id) {
      return
    }

    let active = true
    getAllProperties({ type: 'car', category: vehicle.category.id })
      .then((data) => {
        if (!active) return
        const results = Array.isArray(data) ? data : data.results || []
        setSimilarVehicles(
          results
            .filter((item) => (
              String(item.id) !== String(vehicle.id) &&
              String(item.category?.id || item.category_id) === String(vehicle.category.id)
            ))
            .slice(0, 4)
            .map(mapSimilarVehicle)
        )
      })
      .catch((err) => console.error('Failed to load similar vehicles:', err))
      .finally(() => {
        if (active) setSimilarVehiclesLoading(false)
      })

    return () => { active = false }
  }, [vehicle])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#c99b43]" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vehicle Not Found</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{error || "The vehicle you're looking for does not exist."}</p>
            <Button
              onClick={() => navigate('/vehicles')}
              className="mt-6 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950"
            >
              Back to Vehicles
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % vehicle.images.length)
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + vehicle.images.length) % vehicle.images.length)

  const handleImageMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100))
    setZoomOrigin(`${x}% ${y}%`)
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {/* Top Navigation Bar */}
      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/vehicles')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Vehicles
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className={isFavorite ? 'border-red-500 text-red-500' : ''}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="bg-slate-50/70 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div
              className="group relative flex-1 cursor-zoom-in overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] transition-shadow duration-500 hover:shadow-[0_32px_100px_rgba(201,155,67,0.18)] dark:border-slate-800 dark:bg-slate-900 lg:flex-[2]"
              onMouseMove={handleImageMove}
              onMouseLeave={() => setZoomOrigin('50% 50%')}
            >
              <img
                src={vehicle.images[selectedImage]}
                alt={vehicle.name}
                className="h-96 w-full object-cover transition-transform duration-[220ms] ease-out will-change-transform group-hover:scale-[1.80] md:h-[520px] lg:h-[560px]"
                style={{ transformOrigin: zoomOrigin }}
                onClick={() => setLightboxOpen(true)}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/0 via-white/0 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%, rgba(201,155,67,0.08) 100%)' }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
              <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur transition-all duration-300 group-hover:scale-105 group-hover:bg-white dark:bg-slate-900/80 dark:text-white dark:group-hover:bg-slate-800">
                {selectedImage + 1} / {vehicle.images.length} Photos
              </div>
              {vehicle.images.length > 1 && (
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
            {vehicle.images.length > 1 && (
              <div className="grid flex-1 grid-cols-2 gap-3 rounded-[2rem] lg:flex-[1]">
                {vehicle.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`group/thumb relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${selectedImage === index ? 'border-[#c99b43] shadow-lg shadow-[#c99b43]/20 scale-[1.02]' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    <img src={img} alt={`View ${index + 1}`} className="h-44 w-full object-cover transition-transform duration-500 ease-out group-hover/thumb:scale-110 md:h-full lg:h-[270px]" />
                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover/thumb:bg-black/10" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-8">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2">
              <Card className="relative overflow-hidden rounded-[2rem] border-slate-200/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950 md:p-8">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c99b43] via-[#f3c96d] to-[#c99b43]" />

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[#c99b43] px-3 py-1 text-sm font-semibold text-white">
                        {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
                      </span>
                      <span className="rounded-full bg-[#c99b43]/10 px-3 py-1 text-sm font-semibold text-[#c99b43]">
                        {vehicle.year}
                      </span>
                    </div>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                      {vehicle.name}
                    </h1>
                    <p className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="h-5 w-5" />
                      {vehicle.location}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{vehicle.address}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* Average rating display */}
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#c99b43] text-[#c99b43]" />
                      <span className="text-base font-bold text-slate-900 dark:text-white">{vehicle.rating}</span>
                      <span className="text-xs text-slate-400">/ 5</span>
                    </div>
                    <p className="text-xs text-slate-500">{vehicle.rating_summary?.rating_count || 0} ratings</p>
                    {/* Interactive user rating stars (compact) */}
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-[11px] text-slate-400">
                        {vehicle.rating_summary?.user_rating ? 'Your rating:' : 'Rate this:'}
                      </p>
                      <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 cursor-pointer transition-colors ${
                              (hoverRating || vehicle.rating_summary?.user_rating) >= star
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
                      View Reviews ({vehicle.reviews.length})
                    </button>
                  </div>
                </div>

                {/* Vehicle Stats Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  <div className="rounded-xl border border-[#c99b43]/20 bg-gradient-to-br from-[#fff7e8] to-white p-4 shadow-sm dark:border-[#c99b43]/20 dark:from-[#1e1a11] dark:to-slate-900">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Daily Rate</p>
                    <p className="mt-1 text-2xl font-bold text-[#c99b43]">{vehicle.price}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">ETB / day</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{vehicle.seats}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Seats</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Fuel className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{vehicle.fuel}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Fuel Type</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Settings2 className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{vehicle.transmission}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Transmission</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{vehicle.mileage} km</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Mileage</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Description</h2>
                  <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="leading-relaxed text-slate-600 dark:text-slate-400">{vehicle.description}</p>
                  </div>
                </div>

                {/* Reviews section removed from main content — opens in side drawer */}


                {/* Vehicle Info Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Color</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{vehicle.color}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Vehicle ID</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{vehicle.vehicleId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Date Posted</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{vehicle.datePosted}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Plate Number</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{vehicle.plateNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Features & Amenities */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Features & Amenities</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {vehicle.features.map((feature, index) => {
                      const Icon = featureIcons[feature] || CheckCircle
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-[#c99b43]/50 hover:shadow-sm dark:border-slate-800"
                        >
                          <Icon className="h-5 w-5 text-[#c99b43]" />
                          <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>

            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                {/* Vehicle Snapshot */}
                <Card className="rounded-[2rem] border-slate-200/70 bg-slate-50/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/80">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Vehicle Snapshot</h3>
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Year</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{vehicle.year}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Type</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Transmission</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/50">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Rating</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{vehicle.rating} / 5</span>
                    </div>
                  </div>
                </Card>

                <div className="w-full rounded-[2rem] border border-[#c99b43]/50 bg-gradient-to-br from-[#fff8eb] via-white to-[#fff1cc] p-7 shadow-[0_20px_55px_rgba(201,155,67,0.16)] dark:border-[#c99b43]/40 dark:from-[#241d10] dark:via-slate-900 dark:to-[#17120a]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b98227] dark:text-[#f3c96d]">Your next journey</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Reserve this vehicle</h2>
                  <p className="mt-2 text-slate-700 dark:text-slate-300">Rental rate ({vehicle.rentalUnit})</p>
                  <p className="mt-1 text-2xl font-bold text-[#c99b43]">
                    ETB {vehicle.price}
                    <span className="ml-1 text-sm font-normal">/ {vehicle.rentalUnit}</span>
                  </p>
                  <Button
                    disabled={!vehicle.isAvailable}
                    onClick={() => navigate(`/properties/${vehicle.id}/book`)}
                    className="mt-5 w-full bg-[#c99b43] text-white hover:bg-[#b88a35]"
                  >
                    {vehicle.isAvailable ? 'Book Now' : 'Currently Unavailable'}
                  </Button>
                </div>

                {/* Why This Vehicle Stands Out */}
                <Card className="overflow-hidden border-[#c99b43]/20 bg-gradient-to-br from-[#fff8eb] via-white to-[#fff3d3] p-6 shadow-[0_24px_80px_rgba(201,155,67,0.16)] dark:border-[#c99b43]/20 dark:from-[#1f1a10] dark:via-slate-900 dark:to-[#1a1308]">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Why This Vehicle Stands Out</h3>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 dark:bg-slate-950/40">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-[#c99b43]" />
                      <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {vehicle.year} model with only {vehicle.mileage} km, ensuring reliability and great condition.
                      </p>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 dark:bg-slate-950/40">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-[#c99b43]" />
                      <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                        Located in {vehicle.location}, making pickup and drop-off convenient.
                      </p>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 dark:bg-slate-950/40">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-[#c99b43]" />
                      <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                        Equipped with {vehicle.features.slice(0, 3).join(', ')} and more for maximum comfort.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {vehicle.category?.id && (similarVehiclesLoading || similarVehicles.length > 0) && (
        <section className="border-t border-slate-200/80 bg-white py-10 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c99b43]">More to explore</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Similar Vehicles</h2>
              </div>
              <Button variant="outline" onClick={() => navigate('/vehicles')}>View all</Button>
            </div>
            {similarVehiclesLoading ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {similarVehicles.map((item) => (
                  <Card key={item.id} className="group overflow-hidden border-slate-200/70 bg-white p-0 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(201,155,67,0.15)] dark:border-slate-800 dark:bg-slate-950">
                    <div className="relative overflow-hidden">
                      <img src={item.image} alt={item.name} className="h-44 w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.15]" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                    <div className="p-4">
                      <h3 className="truncate font-semibold text-slate-900 transition-colors duration-300 group-hover:text-[#c99b43] dark:text-white">{item.name}</h3>
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{item.location}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="font-bold text-[#c99b43]">ETB {item.price}<span className="ml-1 text-xs font-normal text-slate-400">/ {item.rentalUnit}</span></p>
                        <Button size="sm" onClick={() => navigate(`/vehicles/${item.id}`)} className="bg-[#c99b43] text-slate-950 transition-all duration-300 hover:scale-105 hover:bg-[#b88a35]">View</Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightboxOpen(false)}>
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
            src={vehicle.images[selectedImage]}
            alt={vehicle.name}
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
            {selectedImage + 1} / {vehicle.images.length}
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
                  {vehicle.reviews.length} {vehicle.reviews.length === 1 ? 'review' : 'reviews'} · ⭐ {vehicle.rating} / 5
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
              {vehicle.reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Star className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No reviews yet</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to share your experience below</p>
                </div>
              ) : (
                vehicle.reviews.map((review) => {
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

export default VehicleDetails
