import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Star, MapPin, Loader2, UserRound } from 'lucide-react'
import { getOwnerFavorites } from '../../api/property/propertyApi'
import { Button } from '../../components/ui/button'
import { getImageUrl } from '../../lib/utils'
import EmptyState from './components/EmptyState'

export default function OwnerFavorites() {
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchFavorites()
    }, [])

    const fetchFavorites = async () => {
        try {
            setLoading(true)
            const data = await getOwnerFavorites()
            setFavorites(data)
        } catch (err) {
            setError(err.message || 'Failed to load favorites')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#c99b43]" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center p-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchFavorites} variant="outline">Try Again</Button>
            </div>
        )
    }

    if (favorites.length === 0) {
        return (
            <div>
                <EmptyState
                    title="No favorites yet"
                    description="Save properties and vehicles you like to find them quickly later."
                    action={
                        <Button
                            onClick={() => navigate('/properties')}
                            className="bg-[#c99b43] text-white hover:bg-[#b0883a]"
                        >
                            Browse Rentals
                        </Button>
                    }
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Property Interest</h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Tenants who saved your properties and vehicles.</p>
            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
                {favorites.map((fav) => {
                    const property = fav.property
                    const mainImage = property.images?.length > 0
                        ? (property.images[0].image || getImageUrl(property.images[0].image_url))
                        : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800'

                    return (
                        <div
                            key={fav.id}
                            onClick={() => navigate(`/properties/${property.id}`)}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="relative h-48 w-full overflow-hidden">
                                <img
                                    src={mainImage}
                                    alt={property.property_name}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow">
                                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                </div>
                            </div>
                            <div className="p-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{property.property_name}</h3>
                                        <p className="mt-1 flex items-center text-[10px] text-slate-600 dark:text-slate-400">
                                            <MapPin className="mr-1 h-3 w-3" />
                                            {[property.city_name, property.region_name, property.kebele].filter(Boolean).join(", ") || 'Location Unspecified'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 rounded bg-[#c99b43]/10 px-2 py-1">
                                        <Star className="h-3 w-3 fill-[#c99b43] text-[#c99b43]" />
                                        <span className="text-[10px] font-semibold text-[#c99b43]">
                                            {property.rating_summary?.average_rating || 'New'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <span className="text-sm font-bold text-[#c99b43]">
                                        ETB {parseFloat(property.price).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-slate-500">{property.listing_type}</span>
                                </div>
                                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <UserRound className="h-4 w-4 text-[#c99b43]" />
                                    <div className="min-w-0 text-xs">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                                            {`${fav.user?.first_name || ''} ${fav.user?.last_name || ''}`.trim() || fav.user?.email || 'Tenant'}
                                        </p>
                                        <p className="truncate text-slate-500 dark:text-slate-400">
                                            {fav.user?.email || 'Email unavailable'}{fav.user?.phone_number ? ` • ${fav.user.phone_number}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}