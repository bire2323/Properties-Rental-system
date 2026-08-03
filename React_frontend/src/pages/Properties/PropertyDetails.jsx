import { useState, useEffect } from 'react'
import { MapPin, Star, Bed, Bath, Maximize2, Heart, Share2, Phone, Mail, Calendar, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, Car, Wifi, Wind, Droplets, Zap, Shield, Camera, Dumbbell, TreePine, Sofa, X } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

const allProperties = [
  { id: 1, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200'], title: 'Modern Villa with Pool', type: 'Villa', status: 'For Rent', price: '45,000', location: 'Bole, Addis Ababa', address: 'Atlas Road, Bole, Addis Ababa', description: 'Luxurious modern villa featuring a private swimming pool, spacious garden, and contemporary design.', beds: 4, baths: 3, area: '320', parking: 2, furnished: 'Fully Furnished', propertyId: 'NX-2024-001', datePosted: 'December 15, 2024', rating: 4.9, features: ['Wi-Fi', 'Balcony', 'Garden', 'Security', 'CCTV', 'Air Conditioning', 'Swimming Pool', 'Water Supply', 'Electricity'], owner: { name: 'John Doe', photo: 'https://ui-avatars.com/api/?name=John+Doe&size=200&background=c99b43&color=fff', phone: '+251 911 234 567', email: 'john.doe@nexaspace.com' } },
  { id: 2, images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200'], title: 'Luxury Apartment', type: 'Apartment', status: 'For Rent', price: '35,000', location: 'Kazanchis, Addis Ababa', address: 'Kazanchis, Addis Ababa', description: 'Elegant apartment with stunning city views.', beds: 3, baths: 2, area: '180', parking: 1, furnished: 'Semi-Furnished', propertyId: 'NX-2024-002', datePosted: 'January 5, 2025', rating: 4.8, features: ['Wi-Fi', 'Balcony', 'Security', 'Elevator', 'Gym'], owner: { name: 'Sarah Ahmed', photo: 'https://ui-avatars.com/api/?name=Sarah+Ahmed&size=200&background=c99b43&color=fff', phone: '+251 911 345 678', email: 'sarah.ahmed@nexaspace.com' } },
  { id: 3, images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200'], title: 'Executive Penthouse', type: 'Penthouse', status: 'For Sale', price: '65,000', location: 'CMC, Addis Ababa', address: 'CMC, Addis Ababa', description: 'Stunning penthouse with panoramic views.', beds: 5, baths: 4, area: '450', parking: 3, furnished: 'Fully Furnished', propertyId: 'NX-2024-003', datePosted: 'November 20, 2024', rating: 5.0, features: ['Wi-Fi', 'Security', 'Pool', 'Gym'], owner: { name: 'Michael T', photo: 'https://ui-avatars.com/api/?name=Michael+T&size=200&background=c99b43&color=fff', phone: '+251 911 456 789', email: 'michael@nexaspace.com' } }
]

const featureIcons = { 'Wi-Fi': Wifi, 'Balcony': Sofa, 'Garden': TreePine, 'Security': Shield, 'CCTV': Camera, 'Air Conditioning': Wind, 'Swimming Pool': Droplets, 'Pool': Droplets, 'Gym': Dumbbell, 'Water Supply': Droplets, 'Electricity': Zap }

function PropertyDetails() {
  const [property, setProperty] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const urlParams = new URLSearchParams(hash.split('?')[1] || '')
    const propertyId = parseInt(urlParams.get('id'))
    const foundProperty = allProperties.find((p) => p.id === propertyId)
    if (foundProperty) setProperty(foundProperty)
  }, [])

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold">Property Not Found</h2><p className="mt-2">The property does not exist.</p><Button onClick={() => (window.location.hash = 'properties')} className="mt-6 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950">Back</Button></div></div>
        <Footer />
      </div>
    )
  }

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % property.images.length)
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length)
  const similarProperties = allProperties.filter((p) => p.id !== property.id).slice(0, 3)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <section className="border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => (window.location.hash = 'properties')} className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Properties</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsFavorite(!isFavorite)} className={isFavorite ? 'border-red-500 text-red-500' : ''}><Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500' : ''}`} /></Button>
              <Button variant="outline" size="icon"><Share2 className="h-5 w-5" /></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl cursor-pointer">
            <img src={property.images[selectedImage]} alt={property.title} className="h-96 w-full object-cover md:h-[500px]" onClick={() => setLightboxOpen(true)} />
            {property.images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white dark:bg-slate-900/90"><ChevronLeft className="h-6 w-6" /></button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white dark:bg-slate-900/90"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </div>
          {property.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4 md:grid-cols-6">
              {property.images.map((img, index) => (
                <button key={index} onClick={() => setSelectedImage(index)} className={`overflow-hidden rounded-lg border-2 transition-all ${selectedImage === index ? 'border-[#c99b43]' : 'border-transparent hover:border-slate-300'}`}>
                  <img src={img} alt={`View ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${property.status === 'For Rent' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>{property.status}</span>
                      <span className="rounded-full bg-[#c99b43]/10 px-3 py-1 text-sm font-semibold text-[#c99b43]">{property.type}</span>
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">{property.title}</h1>
                    <p className="mt-2 flex items-center gap-2 text-slate-600 dark:text-slate-400"><MapPin className="h-5 w-5" />{property.location}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{property.address}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1"><Star className="h-5 w-5 fill-[#c99b43] text-[#c99b43]" /><span className="text-lg font-semibold text-slate-900 dark:text-white">{property.rating}</span></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Excellent</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-slate-200 py-6 dark:border-slate-800">
                  <div><p className="text-sm text-slate-600 dark:text-slate-400">Price</p><p className="mt-1 text-3xl font-bold text-[#c99b43]">{property.price}<span className="text-lg text-slate-600 dark:text-slate-400"> ETB/mo</span></p></div>
                  <div className="h-12 w-px bg-slate-200 dark:bg-slate-800" />
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2"><Bed className="h-5 w-5 text-slate-400" /><div><p className="font-semibold text-slate-900 dark:text-white">{property.beds}</p><p className="text-xs text-slate-600 dark:text-slate-400">Bedrooms</p></div></div>
                    <div className="flex items-center gap-2"><Bath className="h-5 w-5 text-slate-400" /><div><p className="font-semibold text-slate-900 dark:text-white">{property.baths}</p><p className="text-xs text-slate-600 dark:text-slate-400">Bathrooms</p></div></div>
                    <div className="flex items-center gap-2"><Maximize2 className="h-5 w-5 text-slate-400" /><div><p className="font-semibold text-slate-900 dark:text-white">{property.area} m²</p><p className="text-xs text-slate-600 dark:text-slate-400">Area</p></div></div>
                    <div className="flex items-center gap-2"><Car className="h-5 w-5 text-slate-400" /><div><p className="font-semibold text-slate-900 dark:text-white">{property.parking}</p><p className="text-xs text-slate-600 dark:text-slate-400">Parking</p></div></div>
                  </div>
                </div>
                <div className="mt-8"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Description</h2><p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">{property.description}</p></div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800"><CheckCircle className="h-5 w-5 text-emerald-500" /><div><p className="text-sm text-slate-600 dark:text-slate-400">Furnished</p><p className="font-semibold text-slate-900 dark:text-white">{property.furnished}</p></div></div>
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800"><CheckCircle className="h-5 w-5 text-emerald-500" /><div><p className="text-sm text-slate-600 dark:text-slate-400">Property ID</p><p className="font-semibold text-slate-900 dark:text-white">{property.propertyId}</p></div></div>
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800"><Calendar className="h-5 w-5 text-emerald-500" /><div><p className="text-sm text-slate-600 dark:text-slate-400">Date Posted</p><p className="font-semibold text-slate-900 dark:text-white">{property.datePosted}</p></div></div>
                </div>
                <div className="mt-8"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Features & Amenities</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">{property.features.map((feature, index) => {const Icon = featureIcons[feature] || CheckCircle; return (<div key={index} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"><Icon className="h-5 w-5 text-[#c99b43]" /><span className="text-slate-700 dark:text-slate-300">{feature}</span></div>)})}</div></div>
              </Card>
              {similarProperties.length > 0 && (
                <Card className="mt-8 p-6"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Similar Properties</h2><div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{similarProperties.map((prop) => (<div key={prop.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"><img src={prop.images[0]} alt={prop.title} className="h-40 w-full object-cover transition-transform group-hover:scale-110" /><div className="p-4"><h3 className="font-semibold text-slate-900 dark:text-white">{prop.title}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{prop.location}</p><div className="mt-3 flex items-center justify-between"><span className="text-lg font-bold text-[#c99b43]">{prop.price} ETB</span><Button size="sm" onClick={() => (window.location.hash = `property-details?id=${prop.id}`)} className="bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950">View</Button></div></div></div>))}</div></Card>
              )}
            </div>
            <div className="lg:col-span-1">
              <Card className="sticky top-32 p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Contact Property Owner</h3>
                <div className="mt-6 flex items-center gap-4"><img src={property.owner.photo} alt={property.owner.name} className="h-16 w-16 rounded-full" /><div><p className="font-semibold text-slate-900 dark:text-white">{property.owner.name}</p><p className="text-sm text-slate-600 dark:text-slate-400">Property Owner</p></div></div>
                <div className="mt-6 space-y-3">
                  <Button className="w-full gap-2 bg-gradient-to-r from-[#c99b43] to-[#f3c96d] text-slate-950"><Phone className="h-4 w-4" />{property.owner.phone}</Button>
                  <Button variant="outline" className="w-full gap-2"><Mail className="h-4 w-4" />Email Owner</Button>
                  <Button variant="outline" className="w-full gap-2"><Calendar className="h-4 w-4" />Schedule Visit</Button>
                </div>
                <div className="mt-6 rounded-lg bg-slate-100 p-4 dark:bg-slate-800"><p className="text-sm text-slate-600 dark:text-slate-400">Interested in this property? Contact the owner for more information.</p></div>
              </Card>
            </div>
          </div>
        </div>
      </section>
      {lightboxOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightboxOpen(false)}><button onClick={() => setLightboxOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-6 w-6" /></button><button onClick={prevImage} className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronLeft className="h-8 w-8" /></button><img src={property.images[selectedImage]} alt={property.title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} /><button onClick={nextImage} className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><ChevronRight className="h-8 w-8" /></button><div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">{selectedImage + 1} / {property.images.length}</div></div>)}
      <Footer />
    </div>
  )
}

export default PropertyDetails
