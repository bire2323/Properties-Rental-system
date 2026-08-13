import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { addFavorite, removeFavorite } from '../api/property/propertyApi';
import { useAuth } from '../hooks/useAuth';

export function PropertyCard({ property, onFavoriteToggle }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Track local favorite state explicitly for immediate UI feedback
    const [isFavorite, setIsFavorite] = useState(Boolean(property.is_favorite));
    const [isLoading, setIsLoading] = useState(false);

    const handleFavoriteClick = async (e) => {
        // 1. Prevent navigating to property details page
        e.preventDefault();
        e.stopPropagation();

        // 2. Auth check
        if (!user) {
            navigate('/login');
            return;
        }

        if (isLoading) return;

        const previousState = isFavorite;

        // 3. Optimistic UI update
        setIsFavorite(!previousState);
        setIsLoading(true);

        try {
            if (previousState) {
                await removeFavorite(property.id);
            } else {
                await addFavorite(property.id);
            }

            // Notify parent list if it tracks favorites (e.g., removing item from "Favorites" tab)
            if (onFavoriteToggle) {
                onFavoriteToggle(property.id, !previousState);
            }
        } catch (err) {
            console.error('Failed to update favorite status:', err);
            // Rollback on failure
            setIsFavorite(previousState);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            onClick={() => navigate(`/properties/${property.id}`)}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src={property.mainImage || property.image || 'https://via.placeholder.com/400x300'}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Favorite Button Overlay */}
                <button
                    type="button"
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    aria-label="Toggle favorite"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition hover:bg-white hover:scale-110 dark:bg-slate-900/80 dark:hover:bg-slate-900"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#c99b43]" />
                    ) : (
                        <Heart
                            className={`h-5 w-5 transition-colors ${isFavorite
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-slate-600 hover:text-red-500 dark:text-slate-300'
                                }`}
                        />
                    )}
                </button>
            </div>

            {/* Card Details */}
            <div className="p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {property.title}
                </h3>
                <p className="mt-1 text-sm text-[#c99b43] font-bold">
                    {property.price} ETB <span className="text-xs font-normal text-slate-500">/ month</span>
                </p>
            </div>
        </div>
    );
}