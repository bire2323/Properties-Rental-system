import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Star, MapPin, Loader2, Trash2 } from 'lucide-react'
import { getFavorites, removeFavorite } from '../../api/property/propertyApi'
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
            const data = await getFavorites()
            setFavorites(data)
        } catch (err) {
            setError(err.message || 'Failed to load favorites')
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveFavorite = async (propertyId, e) => {
        e.stopPropagation()
        try {
            await removeFavorite(propertyId)
            setFavorites(prev => prev.filter(f => f.property.id !== propertyId))
        } catch (err) {
            console.error('Failed to remove favorite', err)
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Favorites</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                                <div className="absolute right-3 top-3">
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-full bg-white/90 shadow hover:bg-white hover:text-red-500"
                                        onClick={(e) => handleRemoveFavorite(property.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{property.property_name}</h3>
                                        <p className="mt-1 flex items-center text-sm text-slate-600 dark:text-slate-400">
                                            <MapPin className="mr-1 h-3 w-3" />
                                            {[property.city, property.country].filter(Boolean).join(", ")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 rounded bg-[#c99b43]/10 px-2 py-1">
                                        <Star className="h-3 w-3 fill-[#c99b43] text-[#c99b43]" />
                                        <span className="text-xs font-semibold text-[#c99b43]">
                                            {property.rating_summary?.average_rating || 'New'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                                    <span className="text-lg font-bold text-[#c99b43]">
                                        ETB {parseFloat(property.price).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-slate-500">{property.listing_type}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}