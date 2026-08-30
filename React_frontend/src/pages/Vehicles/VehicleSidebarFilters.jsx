import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { PriceRangeSlider } from '../Properties/PriceRangeSlider';
import { getListingNavigationOptions } from '../../api/property/propertyApi';
import { useLocationSelector } from '../../hooks/useLocationSelector';

const selectCls = 'w-full h-10 appearance-none rounded-lg border border-slate-300 bg-slate-50 pl-3 pr-9 text-sm font-medium transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed'


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

export function VehicleSidebarFilters({ filters, setFilters, onClearAll, className = '' }) {
    const [brands, setBrands] = useState([]);
    const [fuelTypes, setFuelTypes] = useState([]);

    const {
        regions,
        cities,
        selectedRegionId,
        selectedCityId,
        setRegionId,
        setCityId,
        reset: resetLocation,
        loading: locLoading,
    } = useLocationSelector({
        initialRegionId: filters.region_id || null,
        initialCityId: filters.city_id || null,
    });

    // Sync location hook → filters when external reset happens (onClearAll)
    useEffect(() => {
        if (!filters.region_id && !filters.city_id) {
            resetLocation();
        }
    }, [filters.region_id, filters.city_id]);

    useEffect(() => {
        let mounted = true;
        async function fetchOptions() {
            try {
                const navOptions = await getListingNavigationOptions();
                if (mounted && navOptions) {
                    if (navOptions.brands) setBrands(navOptions.brands);
                    if (navOptions.fuel_types) setFuelTypes(navOptions.fuel_types);
                }
            } catch (err) {
                console.warn('Failed to load vehicle filter options', err);
            }
        }
        fetchOptions();
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

    const handleRegionChange = (e) => {
        const id = e.target.value ? Number(e.target.value) : null;
        setRegionId(id);
        setFilters((prev) => ({ ...prev, region_id: id || '', city_id: '' }));
    };

    const handleCityChange = (e) => {
        const id = e.target.value ? Number(e.target.value) : null;
        setCityId(id);
        setFilters((prev) => ({ ...prev, city_id: id || '' }));
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
                        placeholder="Search vehicles..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-9 bg-slate-50 dark:bg-slate-800/50"
                    />
                </div>
            </FilterSection>

            {/* Location — cascading Region → City */}
            <FilterSection title="Location">
                <div className="space-y-2">
                    {/* Region */}
                    <div className="relative">
                        <select
                            value={selectedRegionId ?? ''}
                            onChange={handleRegionChange}
                            disabled={locLoading}
                            className={selectCls}
                        >
                            <option value="">{locLoading ? 'Loading…' : 'All Regions'}</option>
                            {regions.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* City — only shown once a region is picked */}
                    {selectedRegionId && cities.length > 0 && (
                        <div className="relative">
                            <select
                                value={selectedCityId ?? ''}
                                onChange={handleCityChange}
                                className={selectCls}
                            >
                                <option value="">All Cities in Region</option>
                                {cities.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                    )}
                </div>
            </FilterSection>

            {brands.length > 0 && (
                <FilterSection title="Brand">
                    <div className="relative">
                        <select
                            value={filters.brand || ''}
                            onChange={(e) => handleFilterChange('brand', e.target.value)}
                            className="w-full h-10 appearance-none rounded-lg border border-slate-300 bg-slate-50 pl-3 pr-9 text-sm font-medium transition-all hover:border-[#c99b43]/50 focus:border-[#c99b43] focus:outline-none focus:ring-2 focus:ring-[#c99b43]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                        >
                            <option value="">All Brands</option>
                            {brands.map((b) => (
                                <option key={b.value} value={b.value}>
                                    {b.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                </FilterSection>
            )}

            <FilterSection title="Price Range">
                <div className="pt-2">
                    <PriceRangeSlider 
                        value={[filters.min_price || 0, filters.max_price || 200000]} 
                        onValueChange={(val) => {
                            setFilters(prev => ({ ...prev, min_price: val[0], max_price: val[1] }));
                        }} 
                    />
                </div>
            </FilterSection>

            {fuelTypes.length > 0 && (
                <FilterSection title="Fuel Type">
                    <div className="flex flex-wrap gap-1.5">
                        <PillButton 
                            active={!filters.fuel_type} 
                            onClick={() => handleFilterChange('fuel_type', '')}
                        >
                            Any
                        </PillButton>
                        {fuelTypes.map((ft) => (
                            <PillButton 
                                key={ft.value}
                                active={filters.fuel_type === ft.value} 
                                onClick={() => handleFilterChange('fuel_type', ft.value)}
                            >
                                {ft.label}
                            </PillButton>
                        ))}
                    </div>
                </FilterSection>
            )}

            <FilterSection title="Seating Capacity">
                <div className="flex flex-wrap gap-1.5">
                    {['any', '2', '4', '5', '7', '12'].map((val) => (
                        <PillButton 
                            key={`seat-${val}`}
                            active={(filters.seating_capacity || 'any') === val} 
                            onClick={() => handleFilterChange('seating_capacity', val === 'any' ? '' : val)}
                        >
                            {val === 'any' ? 'Any' : `${val}+ Seats`}
                        </PillButton>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Availability">
                <div className="flex flex-wrap gap-1.5">
                    <PillButton 
                        active={filters.is_available === undefined || filters.is_available === ''} 
                        onClick={() => handleFilterChange('is_available', '')}
                    >
                        All
                    </PillButton>
                    <PillButton 
                        active={filters.is_available === 'true' || filters.is_available === true} 
                        onClick={() => handleFilterChange('is_available', 'true')}
                    >
                        Available Only
                    </PillButton>
                    <PillButton 
                        active={filters.is_available === 'false' || filters.is_available === false} 
                        onClick={() => handleFilterChange('is_available', 'false')}
                    >
                        Rented Only
                    </PillButton>
                </div>
            </FilterSection>
        </div>
    );
}
