import { useState, useEffect } from 'react'
import { MapPin, Star, Heart, Share2, Calendar, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, Car, Fuel, Users, Settings2, Wifi, Shield, Camera, Wind, Zap, X } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

const allVehicles = [
  {
    id: 1,
    images: ['https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200'],
    name: 'Toyota Corolla',
    type: 'sedan',
    location: 'Bole, Addis Ababa',
    address: 'Atlas Road, Bole, Addis Ababa',
    description: 'Reliable and fuel-efficient sedan perfect for city driving and long trips. Features modern technology, comfortable seating, and excellent safety ratings.',
    price: '3,500',
    seats: 5,
    fuel: 'Petrol',
    rating: 4.8,
    transmission: 'Automatic',
    year: 2023,
    color: 'Silver',
    plateNumber: 'AA-123-456',
    mileage: '15,000',
    vehicleId: 'NX-V-2024-001',
    datePosted: 'January 10, 2025',
    features: ['Air Conditioning', 'Bluetooth', 'Backup Camera', 'GPS Navigation', 'USB Ports', 'Power Windows', 'ABS Brakes', 'Airbags'],
    owner: {
      name: 'Ahmed Hassan',
      photo: 'https://ui-avatars.com/api/?name=Ahmed+Hassan&size=200&background=c99b43&color=fff',
      phone: '+251 911 234 567',
      email: 'ahmed.hassan@nexaspace.com'
    }
  },
  {
    id: 2,
    images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=1200', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1200'],
    name: 'Hyundai Tucson',
    type: 'suv',
    location: 'CMC, Addis Ababa',
    address: 'CMC Area, Addis Ababa',
    description: 'Spacious SUV with excellent off-road capabilities and premium interior features.',
    price: '5,200',
    seats: 5,
    fuel: 'Diesel',
    rating: 4.9,
    transmission: 'Automatic',
    year: 2023,
    color: 'Black',
    plateNumber: 'AA-234-567',
    mileage: '8,000',
    vehicleId: 'NX-V-2024-002',
    datePosted: 'December 20, 2024',
    features: ['4WD', 'Sunroof', 'Leather Seats', 'GPS', 'Parking Sensors', 'Cruise Control'],
    owner: {
      name: 'Sara Tesfaye',
      photo: 'https://ui-avatars.com/api/?name=Sara+Tesfaye&size=200&background=c99b43&color=fff',
      phone: '+251 911 345 678',
      email: 'sara.tesfaye@nexaspace.com'
    }
  },
  {
    id: 3,
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200'],
    name: 'Honda Fit',
    type: 'hatchback',
    location: 'Sarbet, Addis Ababa',
    address: 'Sarbet, Addis Ababa',
    description: 'Compact and economical hatchback, perfect for city commuting.',
    price: '2,900',
    seats: 5,
    fuel: 'Petrol',
    rating: 4.6,
    transmission: 'Manual',
    year: 2022,
    color: 'White',
    plateNumber: 'AA-345-678',
    mileage: '22,000',
    vehicleId: 'NX-V-2024-003',
    datePosted: 'November 15, 2024',
    features: ['Air Conditioning', 'USB Ports', 'Power Steering', 'Airbags'],
    owner: {
      name: 'Michael Bekele',
      photo: 'https://ui-avatars.com/api/?name=Michael+Bekele&size=200&background=c99b43&color=fff',
      phone: '+251 911 456 789',
      email: 'michael@nexaspace.com'
    }
  }
]

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

function VehicleDetails() {
  const [vehicle, setVehicle] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const urlParams = new URLSearchParams(hash.split('?')[1] || '')
    const vehicleId = parseInt(urlParams.get('id'))
    console.log('VehicleDetails: Looking for vehicle ID:', vehicleId);
    const foundVehicle = allVehicles.find((v) => v.id === vehicleId)
    console.log('VehicleDetails: Found vehicle:', foundVehicle);
    if (foundVehicle) setVehicle(foundVehicle)
  }, [])

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vehicle Not Found</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">The vehicle you're looking for does not exist.</p>
            <Button
              onClick={() => (window.location.hash = 'vehicles')}
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
  const similarVehicles = allVehicles.filter((v) => v.id !== vehicle.id).slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {/* Top Navigation Bar */}
      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => (window.location.hash = 'vehicles')}
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
      <section className="bg-white py-8 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative cursor-pointer overflow-hidden rounded-[28px] border border-slate-200/70 shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-800">
            <img
              src={vehicle.images[selectedImage]}
              alt={vehicle.name}
              className="h-96 w-full object-cover md:h-[500px]"
              onClick={() => setLightboxOpen(true)}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
            <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur dark:bg-slate-900/80 dark:text-white">
              {selectedImage + 1} / {vehicle.images.length} Photos
            </div>
            {vehicle.images.length > 1 && (
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
          {vehicle.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4 md:grid-cols-6">
              {vehicle.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index ? 'border-[#c99b43]' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`View ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2">
              <Card className="relative overflow-hidden border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95 md:p-8">
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
                    <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                      {vehicle.name}
                    </h1>
                    <p className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="h-5 w-5" />
                      {vehicle.location}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{vehicle.address}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-[#c99b43] text-[#c99b43]" />
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">{vehicle.rating}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Excellent</p>
                  </div>
                </div>

                {/* Vehicle Stats Grid */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-2xl border border-[#c99b43]/20 bg-gradient-to-br from-[#fff7e8] to-white p-5 shadow-sm dark:border-[#c99b43]/20 dark:from-[#1e1a11] dark:to-slate-900">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Daily Rate</p>
                    <p className="mt-2 text-3xl font-bold text-[#c99b43]">{vehicle.price}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ETB / day</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{vehicle.seats}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Seats</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Fuel className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{vehicle.fuel}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Fuel Type</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Settings2 className="h-5 w-5 text-[#c99b43]" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{vehicle.transmission}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Transmission</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
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
                <div className="mt-10">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Description</h2>
                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="leading-relaxed text-slate-600 dark:text-slate-400">{vehicle.description}</p>
                  </div>
                </div>

                {/* Vehicle Info Grid */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Color</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{vehicle.color}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Vehicle ID</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{vehicle.vehicleId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Date Posted</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{vehicle.datePosted}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Plate Number</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{vehicle.plateNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Features & Amenities */}
                <div className="mt-10">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Features & Amenities</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {vehicle.features.map((feature, index) => {
                      const Icon = featureIcons[feature] || CheckCircle
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-[#c99b43]/50 hover:shadow-sm dark:border-slate-800"
                        >
                          <Icon className="h-5 w-5 text-[#c99b43]" />
                          <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>

              {/* Similar Vehicles */}
              {similarVehicles.length > 0 && (
                <Card className="mt-8 border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Similar Vehicles</h2>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {similarVehicles.map((veh) => (
                      <div
                        key={veh.id}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                      >
                        <img
                          src={veh.images[0]}
                          alt={veh.name}
                          className="h-40 w-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{veh.name}</h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{veh.location}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-lg font-bold text-[#c99b43]">{veh.price} ETB</span>
                            <Button
                              size="sm"
                              onClick={() => (window.location.hash = `vehicle-details?id=${veh.id}`)}
                              className="bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950"
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                {/* Vehicle Snapshot */}
                <Card className="border-slate-200/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/95">
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
    </div>
  )
}

export default VehicleDetails
