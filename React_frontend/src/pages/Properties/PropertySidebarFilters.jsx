import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { PriceRangeSlider } from './PriceRangeSlider';
import { getFeatures } from '../../api/property/propertyApi';

function FilterSection({ title, children }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {title}
            </h3>
            {children}
        </div>
    );
}

export function PropertySidebarFilters({ filters, setFilters, onClearAll, className = '' }) {
    const [availableFeatures, setAvailableFeatures] = useState([]);
    const [showAllFeatures, setShowAllFeatures] = useState(false);
    
    // Default fallback features if API fails
    const fallbackFeatures = [
        { id: 1, name: 'Wi-Fi' },
        { id: 2, name: 'Parking' },
        { id: 3, name: 'Garden' },
        { id: 4, name: 'Pool' },
        { id: 5, name: 'Security' },
        { id: 6, name: 'Air Conditioning' },
        { id: 7, name: 'Gym' },
    ];

    useEffect(() => {
        let mounted = true;
        async function fetchFeatures() {
            try {
                const data = await getFeatures();
                if (mounted) {
                    setAvailableFeatures(Array.isArray(data) && data.length > 0 ? data : fallbackFeatures);
                }
            } catch (err) {
                console.warn('Failed to load features from API, using fallback', err);
                if (mounted) {
                    setAvailableFeatures(fallbackFeatures);
                }
            }
        }
        fetchFeatures();
        return () => {
            mounted = false;
        };
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const toggleFeature = (featureId) => {
        setFilters((prev) => {
            const isSelected = prev.selectedFeatures.includes(featureId);
            return {
                ...prev,
                selectedFeatures: isSelected
                    ? prev.selectedFeatures.filter(id => id !== featureId)
                    : [...prev.selectedFeatures, featureId]
            };
        });
    };

    const PillButton = ({ active, onClick, children }) => (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active 
                    ? 'bg-[#c99b43] text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
        >
            {children}
        </button>
    );

    const displayedFeatures = showAllFeatures ? availableFeatures : availableFeatures.slice(0, 6);

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
                <button 
                    onClick={onClearAll}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline"
                >
                    Clear All
                </button>
            </div>

            <FilterSection title="Search">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search properties..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="w-full pl-9 bg-slate-50 dark:bg-slate-800/50"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Property Type">
                <div className="flex flex-wrap gap-1.5">
                    <PillButton 
                        active={filters.propertyType === 'all'} 
                        onClick={() => handleFilterChange('propertyType', 'all')}
                    >
                        All
                    </PillButton>
                    <PillButton 
                        active={filters.propertyType === 'house'} 
                        onClick={() => handleFilterChange('propertyType', 'house')}
                    >
                        House
                    </PillButton>
                    <PillButton 
                        active={filters.propertyType === 'car'} 
                        onClick={() => handleFilterChange('propertyType', 'car')}
                    >
                        Car
                    </PillButton>
                </div>
            </FilterSection>

            <FilterSection title="Price Range">
                <div className="pt-2">
                    <PriceRangeSlider 
                        value={filters.priceRange} 
                        onValueChange={(val) => handleFilterChange('priceRange', val)} 
                    />
                </div>
            </FilterSection>

            {filters.propertyType !== 'car' && (
                <>
                    <FilterSection title="Bedrooms">
                        <div className="flex flex-wrap gap-1.5">
                            {['any', '1', '2', '3', '4', '5'].map((val) => (
                                <PillButton 
                                    key={`bed-${val}`}
                                    active={filters.bedrooms === val} 
                                    onClick={() => handleFilterChange('bedrooms', val)}
                                >
                                    {val === 'any' ? 'Any' : `${val}+`}
                                </PillButton>
                            ))}
                        </div>
                    </FilterSection>

                    <FilterSection title="Bathrooms">
                        <div className="flex flex-wrap gap-1.5">
                            {['any', '1', '2', '3', '4'].map((val) => (
                                <PillButton 
                                    key={`bath-${val}`}
                                    active={filters.bathrooms === val} 
                                    onClick={() => handleFilterChange('bathrooms', val)}
                                >
                                    {val === 'any' ? 'Any' : `${val}+`}
                                </PillButton>
                            ))}
                        </div>
                    </FilterSection>
                </>
            )}

            <FilterSection title="Availability">
                <div className="flex flex-wrap gap-1.5">
                    <PillButton 
                        active={filters.availability === 'all'} 
                        onClick={() => handleFilterChange('availability', 'all')}
                    >
                        All
                    </PillButton>
                    <PillButton 
                        active={filters.availability === 'available'} 
                        onClick={() => handleFilterChange('availability', 'available')}
                    >
                        Available Only
                    </PillButton>
                    <PillButton 
                        active={filters.availability === 'rented'} 
                        onClick={() => handleFilterChange('availability', 'rented')}
                    >
                        Rented Only
                    </PillButton>
                </div>
            </FilterSection>

            <FilterSection title="Features">
                <div className="flex flex-wrap gap-1.5">
                    {displayedFeatures.map((feature) => {
                        const isActive = filters.selectedFeatures.includes(feature.id);
                        return (
                            <button
                                key={feature.id}
                                onClick={() => toggleFeature(feature.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    isActive
                                        ? 'bg-[#c99b43]/10 border-[#c99b43] text-[#c99b43]'
                                        : 'bg-transparent border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                                }`}
                            >
                                {feature.name}
                            </button>
                        );
                    })}
                </div>
                {availableFeatures.length > 6 && (
                    <button
                        onClick={() => setShowAllFeatures(!showAllFeatures)}
                        className="flex items-center gap-1 mt-2 text-xs font-medium text-[#c99b43] hover:underline"
                    >
                        {showAllFeatures ? (
                            <><ChevronUp className="h-3 w-3" /> Show less</>
                        ) : (
                            <><ChevronDown className="h-3 w-3" /> Show more</>
                        )}
                    </button>
                )}
            </FilterSection>
        </div>
    );
}
